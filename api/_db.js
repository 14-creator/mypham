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

module.exports = { sb, isAdmin, safeEqual, digits, readBody, configured: () => !!(URL_BASE && KEY) };
