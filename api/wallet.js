// /api/wallet
//  - GET                : khách xem số dư + lịch sử + yêu cầu nạp của mình (Authorization: Bearer <token>)
//  - GET ?scope=admin   : admin xem toàn bộ yêu cầu nạp (header x-admin-token)
//  - POST {action:'topup', amount}   : khách tạo yêu cầu nạp (chờ admin đối chiếu sao kê)
//  - POST {action:'cancel', id}      : khách hủy yêu cầu nạp của mình khi còn chờ
//  - POST {action:'approve', id}     : admin cộng tiền vào ví (mỗi yêu cầu chỉ cộng 1 lần)
//  - POST {action:'reject', id}      : admin từ chối yêu cầu nạp
const crypto = require('crypto');
const { sb, rpc, isAdmin, readBody, configured, getSessionUser } = require('./_db');

const enc = encodeURIComponent;
const PENDING = 'Chờ xác nhận';
const TOPUP_MIN = 10000;
const TOPUP_MAX = 50000000;
const TOPUP_MAX_PENDING = 3;

function mapTx(r) {
  return {
    id: 'tx-' + r.id,
    type: r.type,
    amount: Number(r.delta),
    balanceAfter: Number(r.balance_after),
    desc: r.description || '',
    ref: r.ref,
    createdAt: r.created_at
  };
}
function mapTopup(r, balances) {
  const t = {
    id: r.id,
    userId: r.user_id,
    userName: r.user_name || '',
    userEmail: r.user_email || '',
    amount: Number(r.amount),
    status: r.status,
    createdAt: r.created_at,
    resolvedAt: r.resolved_at || null
  };
  if (balances) t.userBalance = Number(balances[r.user_id] || 0);
  return t;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!configured()) return res.status(500).json({ error: 'Chưa cấu hình SUPABASE_URL / SUPABASE_SERVICE_KEY trên Vercel' });
  const q = req.query || {};

  try {
    // ---------- ADMIN: danh sách yêu cầu nạp ----------
    if (req.method === 'GET' && q.scope === 'admin') {
      if (!isAdmin(req)) return res.status(401).json({ error: 'Cần quyền quản trị' });
      const rows = (await sb('topups?select=*&order=created_at.desc&limit=500')) || [];
      const ids = Array.from(new Set(rows.map(function (r) { return r.user_id; })));
      const balances = {};
      if (ids.length) {
        const ws = (await sb('wallets?select=user_id,balance&user_id=in.(' + ids.map(enc).join(',') + ')')) || [];
        ws.forEach(function (w) { balances[w.user_id] = w.balance; });
      }
      return res.status(200).json({ topups: rows.map(function (r) { return mapTopup(r, balances); }) });
    }

    // ---------- ADMIN: duyệt / từ chối ----------
    if (req.method === 'POST') {
      const b = await readBody(req);
      const action = String(b.action || '');

      if (action === 'approve' || action === 'reject') {
        if (!isAdmin(req)) return res.status(401).json({ error: 'Cần quyền quản trị' });
        const id = String(b.id || '').slice(0, 20);
        if (!/^NAP\d{6}$/.test(id)) return res.status(400).json({ error: 'Mã yêu cầu không hợp lệ' });
        const now = new Date().toISOString();
        // chỉ một request thắng được bước chuyển trạng thái này → tiền chỉ cộng đúng 1 lần
        const rows = await sb('topups?id=eq.' + enc(id) + '&status=eq.' + enc(PENDING), {
          method: 'PATCH',
          headers: { Prefer: 'return=representation' },
          body: { status: action === 'approve' ? 'Đã cộng tiền' : 'Đã từ chối', resolved_at: now }
        });
        const t = rows && rows[0];
        if (!t) return res.status(409).json({ error: 'Yêu cầu này không còn ở trạng thái chờ xác nhận' });
        if (action === 'approve') {
          let ok = false;
          try {
            const r = await rpc('wallet_apply', {
              p_user: t.user_id, p_delta: Number(t.amount), p_type: 'topup',
              p_desc: 'Nạp tiền vào ví (' + t.id + ')', p_ref: t.id
            });
            ok = !!(r && r.ok);
          } catch (e) { console.error('wallet_apply topup', e.status, e.detail || e.message); }
          if (!ok) {
            await sb('topups?id=eq.' + enc(id), { method: 'PATCH', body: { status: PENDING, resolved_at: null } });
            return res.status(500).json({ error: 'Không cộng được tiền vào ví, yêu cầu vẫn đang chờ' });
          }
        }
        return res.status(200).json({ ok: true, topup: mapTopup(t) });
      }
    }

    // ---------- KHÁCH (cần đăng nhập) ----------
    const user = await getSessionUser(req);
    if (!user) return res.status(401).json({ error: 'Vui lòng đăng nhập' });
    const uid = enc(user.id);

    if (req.method === 'GET') {
      const out = await Promise.all([
        sb('wallets?user_id=eq.' + uid + '&select=balance'),
        sb('wallet_tx?user_id=eq.' + uid + '&select=*&order=id.desc&limit=100'),
        sb('topups?user_id=eq.' + uid + '&select=*&order=created_at.desc&limit=50')
      ]);
      return res.status(200).json({
        balance: out[0] && out[0][0] ? Number(out[0][0].balance) : 0,
        transactions: (out[1] || []).map(mapTx),
        topups: (out[2] || []).map(function (r) { return mapTopup(r); })
      });
    }

    if (req.method === 'POST') {
      const b = await readBody(req);
      const action = String(b.action || '');

      if (action === 'topup') {
        const amount = Math.round(Number(b.amount));
        if (!amount || amount < TOPUP_MIN) return res.status(400).json({ error: 'Số tiền nạp tối thiểu là ' + TOPUP_MIN.toLocaleString('vi-VN') + ' đ' });
        if (amount > TOPUP_MAX) return res.status(400).json({ error: 'Số tiền nạp tối đa mỗi lần là ' + TOPUP_MAX.toLocaleString('vi-VN') + ' đ' });
        const pending = (await sb('topups?user_id=eq.' + uid + '&status=eq.' + enc(PENDING) + '&select=id')) || [];
        if (pending.length >= TOPUP_MAX_PENDING) {
          return res.status(400).json({ error: 'Bạn đang có ' + pending.length + ' yêu cầu nạp chờ xác nhận. Hãy hoàn tất hoặc hủy bớt trước khi tạo thêm.' });
        }
        for (let i = 0; i < 6; i++) {
          const id = 'NAP' + (100000 + crypto.randomInt(0, 900000));
          try {
            const rows = await sb('topups', {
              method: 'POST',
              headers: { Prefer: 'return=representation' },
              body: { id: id, user_id: user.id, user_name: user.name, user_email: user.email, amount: amount, status: PENDING }
            });
            return res.status(201).json({ topup: mapTopup(rows[0]) });
          } catch (e) {
            if (e.status !== 409) throw e; // trùng mã → thử mã khác
          }
        }
        return res.status(500).json({ error: 'Không tạo được mã nạp, vui lòng thử lại' });
      }

      if (action === 'cancel') {
        const id = String(b.id || '').slice(0, 20);
        const rows = await sb('topups?id=eq.' + enc(id) + '&user_id=eq.' + uid + '&status=eq.' + enc(PENDING), {
          method: 'PATCH',
          headers: { Prefer: 'return=representation' },
          body: { status: 'Đã hủy', resolved_at: new Date().toISOString() }
        });
        if (!rows || !rows[0]) return res.status(409).json({ error: 'Không thể hủy yêu cầu này' });
        return res.status(200).json({ ok: true });
      }
    }

    return res.status(405).json({ error: 'Phương thức không được hỗ trợ' });
  } catch (e) {
    console.error('wallet api error', e.status, e.detail || e.message);
    return res.status(500).json({ error: 'Lỗi máy chủ' });
  }
};
