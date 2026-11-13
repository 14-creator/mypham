// Tiện ích dùng chung: gọi Supabase (PostgREST) bằng khóa secret chỉ nằm trên máy chủ Vercel.
const crypto = require('crypto');

const URL_BASE = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const KEY = process.env.SUPABASE_SERVICE_KEY || '';

async function sb(path, opts) {
  opts = opts || {};
  const res = await fetch(URL_BASE + '/rest/v1/' + path, {
    method: opts.method || 'GET',
    headers: Object.assign({
      apikey: KEY,
      Authorization: 'Bearer ' + KEY,
      'Content-Type': 'application/json'
    }, opts.headers || {}),
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
  if (!res.ok) {
    const err = new Error('Supabase ' + res.status);
    err.status = res.status;
    err.detail = data;
    throw err;
  }
  return data;
}

// Gọi hàm Postgres (vd. wallet_apply)
function rpc(fn, args) {
  return sb('rpc/' + fn, { method: 'POST', body: args || {} });
}

// So sánh chuỗi an toàn (chống dò mật khẩu theo thời gian phản hồi)
function safeEqual(a, b) {
  const x = crypto.createHash('sha256').update(String(a || '')).digest();
  const y = crypto.createHash('sha256').update(String(b || '')).digest();
  return crypto.timingSafeEqual(x, y);
}

function isAdmin(req) {
  const expected = process.env.ADMIN_TOKEN || '';
  if (expected.length < 12) return false; // chưa cấu hình hoặc quá ngắn thì không cho vào
  return safeEqual(req.headers['x-admin-token'], expected);
}

function digits(s) { return String(s == null ? '' : s).replace(/\D/g, ''); }

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch (e) { return {}; } }
  return {};
}

// Chuẩn hóa số điện thoại VN (khớp với auth.js phía trình duyệt). Trả về '' nếu không hợp lệ.
function normalizePhone(raw) {
  let d = String(raw == null ? '' : raw).replace(/[\s.\-()]/g, '');
  if (d.startsWith('+84')) d = '0' + d.slice(3);
  else if (d.startsWith('84') && d.length === 11) d = '0' + d.slice(2);
  return /^0\d{9}$/.test(d) ? d : '';
}

// ---------- Mật khẩu (scrypt + salt ngẫu nhiên, băm ở máy chủ) ----------
function scryptHex(password, salt) {
  return new Promise(function (resolve, reject) {
    crypto.scrypt(String(password), salt, 64, { N: 16384, r: 8, p: 1 }, function (err, key) {
      if (err) reject(err); else resolve(key.toString('hex'));
    });
  });
}
async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return { salt: salt, hash: await scryptHex(password, salt) };
}
async function verifyPassword(password, salt, hash) {
  return safeEqual(await scryptHex(password, salt), hash);
}

// ---------- Phiên đăng nhập của khách (token ngẫu nhiên, chỉ lưu bản băm) ----------
function tokenHash(t) { return crypto.createHash('sha256').update(String(t)).digest('hex'); }

function bearer(req) {
  const h = String((req.headers && req.headers.authorization) || '');
  return /^Bearer [a-f0-9]{64}$/.test(h) ? h.slice(7) : '';
}

async function newSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  await sb('sessions', {
    method: 'POST',
    body: {
      token_hash: tokenHash(token),
      user_id: userId,
      expires_at: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString()
    }
  });
  return token;
}

// Trả về {id,name,email,phone} của người đang đăng nhập, hoặc null
async function getSessionUser(req) {
  const t = bearer(req);
  if (!t) return null;
  const rows = await sb('sessions?token_hash=eq.' + tokenHash(t) +
    '&expires_at=gt.' + encodeURIComponent(new Date().toISOString()) + '&select=user_id');
  if (!rows || !rows[0]) return null;
  const us = await sb('users?id=eq.' + encodeURIComponent(rows[0].user_id) + '&select=id,name,email,phone');
  return us && us[0] ? us[0] : null;
}

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, phone: u.phone, role: 'customer' };
}

module.exports = {
  sb, rpc, isAdmin, safeEqual, digits, readBody, normalizePhone,
  hashPassword, verifyPassword, tokenHash, bearer, newSession, getSessionUser, publicUser,
  configured: () => !!(URL_BASE && KEY)
};
