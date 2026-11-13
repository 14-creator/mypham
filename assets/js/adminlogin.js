// POST /api/admin-login  { password }  → xác nhận mật khẩu quản trị (= biến ADMIN_TOKEN trên Vercel)
const { safeEqual, readBody } = require('./_db');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const expected = process.env.ADMIN_TOKEN || '';
  if (expected.length < 12) return res.status(500).json({ error: 'Chưa cấu hình ADMIN_TOKEN (tối thiểu 12 ký tự)' });
  const b = await readBody(req);
  // làm chậm nhẹ để hạn chế dò mật khẩu hàng loạt
  await new Promise(function (r) { setTimeout(r, 400); });
  if (!safeEqual(b.password, expected)) return res.status(401).json({ ok: false, error: 'Sai mật khẩu quản trị' });
  return res.status(200).json({ ok: true });
};
