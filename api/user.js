// /api/user?action=register|login|logout (POST)  và  /api/user?action=me (GET)
// Tài khoản khách nằm trên Supabase; mật khẩu băm scrypt ở máy chủ; phiên bằng token ngẫu nhiên.
const {
  sb, readBody, configured, normalizePhone, hashPassword, verifyPassword,
  newSession, getSessionUser, publicUser, bearer, tokenHash
} = require('./_db');
const crypto = require('crypto');

const sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
const enc = encodeURIComponent;

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!configured()) return res.status(500).json({ error: 'Chưa cấu hình SUPABASE_URL / SUPABASE_SERVICE_KEY trên Vercel' });
  const action = String((req.query || {}).action || '');

  try {
    if (req.method === 'GET' && action === 'me') {
      const u = await getSessionUser(req);
      if (!u) return res.status(401).json({ error: 'Chưa đăng nhập' });
      return res.status(200).json({ user: publicUser(u) });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const b = await readBody(req);

    if (action === 'logout') {
      const t = bearer(req);
      if (t) await sb('sessions?token_hash=eq.' + tokenHash(t), { method: 'DELETE' });
      return res.status(200).json({ ok: true });
    }

    if (action === 'register') {
      const name = String(b.name || '').trim().slice(0, 100);
      const email = String(b.email || '').trim().toLowerCase().slice(0, 120);
      const phone = normalizePhone(b.phone);
      const password = String(b.password || '');
      if (name.length < 2) return res.status(400).json({ error: 'Vui lòng nhập họ và tên' });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Email chưa đúng định dạng' });
      if (!phone) return res.status(400).json({ error: 'Số điện thoại chưa đúng (cần 10 số, ví dụ 0912345678)' });
      if (password.length < 6 || password.length > 200) return res.status(400).json({ error: 'Mật khẩu cần từ 6 đến 200 ký tự' });

      const byEmail = await sb('users?email=eq.' + enc(email) + '&select=id');
      if (byEmail && byEmail.length) return res.status(409).json({ error: 'Email này đã được đăng ký. Hãy đăng nhập.' });
      const byPhone = await sb('users?phone=eq.' + enc(phone) + '&select=id');
      if (byPhone && byPhone.length) return res.status(409).json({ error: 'Số điện thoại này đã được đăng ký. Hãy đăng nhập.' });

      const pw = await hashPassword(password);
      const id = 'u_' + crypto.randomBytes(8).toString('hex');
      try {
        await sb('users', { method: 'POST', body: { id: id, email: email, phone: phone, name: name, pass_salt: pw.salt, pass_hash: pw.hash } });
      } catch (e) {
        if (e.status === 409) return res.status(409).json({ error: 'Email hoặc số điện thoại đã được đăng ký. Hãy đăng nhập.' });
        throw e;
      }
      const token = await newSession(id);
      return res.status(201).json({ token: token, user: publicUser({ id: id, name: name, email: email, phone: phone }) });
    }

    if (action === 'login') {
      const ident = String(b.identifier || '').trim().toLowerCase().slice(0, 120);
      const password = String(b.password || '');
      if (!ident || !password || password.length > 200) return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin đăng nhập' });
      const phone = normalizePhone(ident);
      const rows = phone
        ? await sb('users?phone=eq.' + enc(phone) + '&select=*')
        : await sb('users?email=eq.' + enc(ident) + '&select=*');
      const u = rows && rows[0];
      // luôn tốn thời gian băm như nhau dù tài khoản có tồn tại hay không
      const ok = u
        ? await verifyPassword(password, u.pass_salt, u.pass_hash)
        : (await verifyPassword(password, 'ffffffffffffffffffffffffffffffff', '0'), false);
      if (!ok) {
        await sleep(400);
        return res.status(401).json({ error: 'Email/số điện thoại hoặc mật khẩu chưa đúng.' });
      }
      const token = await newSession(u.id);
      return res.status(200).json({ token: token, user: publicUser(u) });
    }

    return res.status(404).json({ error: 'Không rõ thao tác' });
  } catch (e) {
    console.error('user api error', e.status, e.detail || e.message);
    return res.status(500).json({ error: 'Lỗi máy chủ' });
  }
};
