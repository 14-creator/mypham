// /api/orders
//  - POST            : khách tạo đơn mới (công khai, đã làm sạch dữ liệu)
//  - POST ?action=claim : khách báo "Tôi đã thanh toán" (cần mã đơn + SĐT)
//  - GET ?id=&phone= : khách tra cứu đơn của mình (cần mã đơn + SĐT)
//  - GET             : admin xem toàn bộ đơn (cần header x-admin-token)
//  - PUT             : admin cập nhật/ghi đè đơn (cần token)
//  - DELETE ?id=     : admin xóa đơn (cần token)
const { sb, isAdmin, digits, readBody, configured } = require('./_db');

const MAX_ITEMS = 50;

// Mã giảm giá hợp lệ (khớp với store.js)
const PROMOS = {
  TRANANH10: { type: 'percent', value: 0.1, label: 'Giảm 10% đơn hàng' },
  GLOW50: { type: 'fixed', value: 50000, label: 'Giảm 50.000 đ' },
  FREESHIP: { type: 'shipping', value: 30000, label: 'Miễn phí vận chuyển' }
};

// Cắt độ dài và mã hóa ký tự HTML (&, <, >, ", ') để dữ liệu khách nhập không thể chèn mã vào trang admin
function cleanStr(v, max) {
  return String(v == null ? '' : v).slice(0, max)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
// Chỉ nhận đường dẫn ảnh nội bộ hoặc https
function cleanImg(v) {
  const x = String(v == null ? '' : v).slice(0, 300);
  return /^(assets\/|https:\/\/)[^\s"'<>]*$/.test(x) ? x : '';
}

// Làm sạch đơn do khách gửi: KHÔNG tin các trường trạng thái/thanh toán từ trình duyệt
function sanitizeNewOrder(o) {
  if (!o || typeof o !== 'object') return null;
  const id = String(o.id || '').slice(0, 40);
  if (!/^TAS-\d{4}-\d{3,8}$/.test(id)) return null;
  const c = o.customer || {};
  const phone = digits(c.phone);
  if (phone.length < 9 || phone.length > 12) return null;
  if (!cleanStr(c.name, 100).trim() || !cleanStr(c.address, 300).trim()) return null;
  if (!Array.isArray(o.items) || !o.items.length || o.items.length > MAX_ITEMS) return null;

  const items = o.items.map(function (i) {
    return {
      id: cleanStr(i.id, 60),
      slug: cleanStr(i.slug, 120),
      name: cleanStr(i.name, 200),
      price: Math.max(0, Number(i.price) || 0),
      compare_price: Math.max(0, Number(i.compare_price) || 0),
      image: cleanImg(i.image),
      volume: cleanStr(i.volume, 60),
      category: cleanStr(i.category, 60),
      quantity: Math.min(99, Math.max(1, parseInt(i.quantity, 10) || 1))
    };
  });
  const subtotal = items.reduce(function (s, i) { return s + i.price * i.quantity; }, 0);

  // Tính lại phí ship + giảm giá ở máy chủ (không tin số khách gửi), cùng quy tắc với store.js
  let shippingFee = subtotal >= 500000 || subtotal === 0 ? 0 : 30000;
  const code = String((o.appliedPromo && o.appliedPromo.code) || '').toUpperCase();
  const promo = PROMOS[code] || null;
  let discount = 0;
  if (promo) {
    if (promo.type === 'percent') discount = Math.round(subtotal * promo.value);
    else if (promo.type === 'fixed') discount = Math.min(subtotal, promo.value);
    else if (promo.type === 'shipping') { discount = shippingFee; shippingFee = 0; }
  }
  const total = Math.max(0, subtotal - discount + (promo && promo.type === 'shipping' ? 0 : shippingFee));

  const rawMethod = String(o.paymentMethod || '');
  if (rawMethod.indexOf('Ví') !== -1) return null; // ví nội bộ chưa hỗ trợ khi đặt từ nhiều thiết bị
  const isQR = rawMethod.indexOf('VietQR') !== -1;
  const method = isQR ? 'Chuyển khoản VietQR' : 'COD (Thanh toán khi nhận hàng)';
  const now = new Date();

  return {
    id: id,
    userId: cleanStr(o.userId, 60),
    userName: cleanStr(o.userName, 100),
    customer: {
      name: cleanStr(c.name, 100),
      phone: cleanStr(c.phone, 20),
      address: cleanStr(c.address, 300),
      notes: cleanStr(c.notes, 500)
    },
    items: items,
    subtotal: subtotal,
    shippingFee: shippingFee,
    discount: discount,
    appliedPromo: promo ? Object.assign({ code: code }, promo) : null,
    total: total,
    paymentMethod: method,
    paymentStatus: isQR ? 'Chờ thanh toán' : 'Chưa thanh toán (COD)',
    status: 'Chờ xác nhận',
    carrier: 'Giao Hàng Tiết Kiệm (GHTK)',
    trackingCode: 'GHTK-' + id,
    timeline: [{
      time: now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }),
      date: now.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      title: 'Khởi tạo đơn hàng',
      desc: 'Khách hàng hoàn tất điền thông tin và gửi đơn đặt hàng.',
      completed: true
    }],
    createdAt: now.toISOString()
  };
}

function samePhone(order, phone) {
  const a = digits(order && order.customer && order.customer.phone).slice(-9);
  const b = digits(phone).slice(-9);
  return a.length === 9 && a === b;
}

async function getOne(id) {
  const rows = await sb('orders?id=eq.' + encodeURIComponent(id) + '&select=data');
  return rows && rows[0] ? rows[0].data : null;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!configured()) return res.status(500).json({ error: 'Chưa cấu hình SUPABASE_URL / SUPABASE_SERVICE_KEY trên Vercel' });

  try {
    const q = req.query || {};

    // ---------- KHÁCH: tra cứu 1 đơn ----------
    if (req.method === 'GET' && q.id) {
      const lid = String(q.id).toUpperCase();
      if (!/^TAS-\d{4}-\d{3,8}$/.test(lid)) return res.status(404).json({ error: 'Không tìm thấy đơn' });
      const order = await getOne(lid);
      if (!order || (!isAdmin(req) && !samePhone(order, q.phone))) return res.status(404).json({ error: 'Không tìm thấy đơn' });
      return res.status(200).json({ order: order });
    }

    // ---------- KHÁCH: báo đã chuyển khoản ----------
    if (req.method === 'POST' && q.action === 'claim') {
      const b = await readBody(req);
      const id = String(b.id || '').toUpperCase();
      if (!/^TAS-\d{4}-\d{3,8}$/.test(id)) return res.status(404).json({ error: 'Không tìm thấy đơn' });
      const order = await getOne(id);
      if (!order || !samePhone(order, b.phone)) return res.status(404).json({ error: 'Không tìm thấy đơn' });
      if (!order.customerClaimedPaid && !String(order.paymentStatus || '').includes('Đã thanh toán')) {
        const now = new Date();
        order.customerClaimedPaid = true;
        order.claimedAt = now.toISOString();
        order.timeline = order.timeline || [];
        order.timeline.push({
          time: now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }),
          date: now.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
          title: 'Khách báo đã chuyển khoản',
          desc: 'Khách bấm "Tôi đã thanh toán". Chờ cửa hàng đối chiếu.',
          completed: true
        });
        await sb('orders?id=eq.' + encodeURIComponent(id), { method: 'PATCH', body: { data: order } });
      }
      return res.status(200).json({ order: order });
    }

    // ---------- KHÁCH: tạo đơn mới ----------
    if (req.method === 'POST') {
      const b = await readBody(req);
      const order = sanitizeNewOrder(b.order);
      if (!order) return res.status(400).json({ error: 'Dữ liệu đơn hàng không hợp lệ' });
      try {
        await sb('orders', { method: 'POST', body: { id: order.id, data: order, created_at: order.createdAt } });
      } catch (e) {
        if (e.status === 409) return res.status(409).json({ error: 'Mã đơn đã tồn tại' });
        throw e;
      }
      return res.status(201).json({ ok: true, order: order });
    }

    // ---------- Từ đây trở xuống: CHỈ ADMIN ----------
    if (!isAdmin(req)) return res.status(401).json({ error: 'Cần quyền quản trị' });

    if (req.method === 'GET') {
      const rows = await sb('orders?select=data&order=created_at.desc&limit=1000');
      return res.status(200).json({ orders: (rows || []).map(function (r) { return r.data; }) });
    }

    if (req.method === 'PUT') {
      const b = await readBody(req);
      const list = Array.isArray(b.orders) ? b.orders : (b.order ? [b.order] : []);
      const rows = list.filter(function (o) { return o && o.id; }).slice(0, 100).map(function (o) {
        return { id: cleanStr(o.id, 40), data: o, created_at: o.createdAt || new Date().toISOString() };
      });
      if (rows.length) {
        await sb('orders?on_conflict=id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: rows });
      }
      return res.status(200).json({ ok: true, count: rows.length });
    }

    if (req.method === 'DELETE') {
      if (!q.id) return res.status(400).json({ error: 'Thiếu id' });
      await sb('orders?id=eq.' + encodeURIComponent(String(q.id)), { method: 'DELETE' });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Phương thức không được hỗ trợ' });
  } catch (e) {
    console.error('orders api error', e.status, e.detail || e.message);
    return res.status(500).json({ error: 'Lỗi máy chủ' });
  }
};
