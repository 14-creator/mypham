// /api/orders
//  - POST            : khách ĐÃ ĐĂNG NHẬP tạo đơn mới (Authorization: Bearer). Thanh toán ví được trừ tiền thật ở máy chủ
//  - POST ?action=claim : khách báo "Tôi đã thanh toán" (cần mã đơn + SĐT)
//  - GET ?id=&phone= : khách tra cứu đơn của mình (cần mã đơn + SĐT)
//  - GET             : admin xem toàn bộ đơn (cần header x-admin-token)
//  - PUT             : admin cập nhật/ghi đè đơn (cần token)
//  - DELETE ?id=     : admin xóa đơn (cần token)
const { sb, rpc, isAdmin, digits, readBody, configured, getSessionUser } = require('./_db');

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
function sanitizeNewOrder(o, user) {
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
  const isWallet = rawMethod.indexOf('Ví') !== -1;
  const isQR = !isWallet && rawMethod.indexOf('VietQR') !== -1;
  const method = isWallet ? 'Ví TranAnh'
    : isQR ? 'Chuyển khoản VietQR'
    : 'COD (Thanh toán khi nhận hàng)';
  const now = new Date();

  const order = {
    id: id,
    userId: user.id,                      // lấy từ phiên đăng nhập, không tin trình duyệt
    userName: cleanStr(user.name, 100),
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
    paymentStatus: (isQR || isWallet) ? 'Chờ thanh toán' : 'Chưa thanh toán (COD)',
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
  // mã tham chiếu duy nhất cho giao dịch ví của đơn này (dùng cho cả trừ tiền và hoàn tiền)
  if (isWallet) order.walletRef = id + '@' + now.getTime();
  return { order: order, wallet: isWallet };
}

function nowStamp() {
  const now = new Date();
  return {
    iso: now.toISOString(),
    time: now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }),
    date: now.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
  };
}

// Hoàn tiền ví cho đơn đã trả bằng ví (mỗi đơn chỉ hoàn 1 lần nhờ ràng buộc unique ở CSDL).
// Trả về 'ok' (đã hoàn, order.walletRefunded = true), 'none' (không có gì để hoàn) hoặc 'fail' (lỗi, cần thử lại)
async function refundIfNeeded(order, why) {
  if (!order || !order.walletPaid || order.walletRefunded || !order.userId) return 'none';
  try {
    const u = await sb('users?id=eq.' + encodeURIComponent(order.userId) + '&select=id');
    if (!u || !u.length) { console.warn('refund skipped, user not on server', order.id); return 'none'; }
    const r = await rpc('wallet_apply', {
      p_user: order.userId,
      p_delta: Math.round(order.walletPaid),
      p_type: 'refund',
      p_desc: why + ' ' + order.id,
      p_ref: order.walletRef || order.id
    });
    if (!r || !r.ok) return 'fail';
    const st = nowStamp();
    order.walletRefunded = true;
    order.refundedAt = st.iso;
    order.timeline = order.timeline || [];
    order.timeline.push({
      time: st.time, date: st.date,
      title: 'Hoàn tiền vào Ví TranAnh',
      desc: 'Đã hoàn ' + Math.round(order.walletPaid).toLocaleString('vi-VN') + ' đ vào ví của khách.',
      completed: true
    });
    return 'ok';
  } catch (e) {
    console.error('refund error', order.id, e.status, e.detail || e.message);
    return 'fail';
  }
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
      const user = await getSessionUser(req);
      if (!user) return res.status(401).json({ error: 'Vui lòng đăng nhập để đặt hàng' });
      const b = await readBody(req);
      const clean = sanitizeNewOrder(b.order, user);
      if (!clean) return res.status(400).json({ error: 'Dữ liệu đơn hàng không hợp lệ' });
      const order = clean.order;
      try {
        await sb('orders', { method: 'POST', body: { id: order.id, data: order, created_at: order.createdAt } });
      } catch (e) {
        if (e.status === 409) return res.status(409).json({ error: 'Mã đơn đã tồn tại' });
        throw e;
      }

      if (clean.wallet) {
        const delOrder = function () {
          return sb('orders?id=eq.' + encodeURIComponent(order.id), { method: 'DELETE' }).catch(function () {});
        };
        // 1) Trừ tiền ví thật (nguyên tử, không bao giờ âm). Không đủ tiền thì hủy đơn vừa tạo.
        if (order.total > 0) {
          let pay;
          try {
            pay = await rpc('wallet_apply', {
              p_user: user.id, p_delta: -order.total, p_type: 'payment',
              p_desc: 'Thanh toán đơn hàng ' + order.id, p_ref: order.walletRef
            });
          } catch (e) { await delOrder(); throw e; }
          if (!pay || !pay.ok || pay.duplicate) {
            await delOrder();
            const bal = Number((pay && pay.balance) || 0);
            return res.status(402).json({
              error: 'Số dư ví không đủ. Vui lòng nạp thêm ' + Math.max(0, order.total - bal).toLocaleString('vi-VN') + ' đ hoặc chọn phương thức khác.',
              balance: bal
            });
          }
        }
        // 2) Ghi nhận đã thanh toán
        const st = nowStamp();
        order.paymentStatus = 'Đã thanh toán (Ví TranAnh)';
        order.status = 'Đang chuẩn bị';
        order.walletPaid = order.total;
        order.paidAt = st.iso;
        order.timeline.push({
          time: st.time, date: st.date,
          title: 'Thanh toán bằng Ví TranAnh',
          desc: 'Đã trừ ' + order.total.toLocaleString('vi-VN') + ' đ từ ví của ' + order.userName + '. Cửa hàng đang chuẩn bị đơn.',
          completed: true
        });
        let saved = false;
        for (let i = 0; i < 2 && !saved; i++) {
          try { await sb('orders?id=eq.' + encodeURIComponent(order.id), { method: 'PATCH', body: { data: order } }); saved = true; }
          catch (e) { console.error('save paid order failed', order.id, e.status, e.detail || e.message); }
        }
        if (!saved) {
          // không ghi được trạng thái đã trả → hoàn tiền và hủy đơn để ví và đơn không bao giờ lệch nhau
          if (order.total > 0) {
            try { await rpc('wallet_apply', { p_user: user.id, p_delta: order.total, p_type: 'refund', p_desc: 'Hoàn tiền đơn lỗi ' + order.id, p_ref: order.walletRef }); }
            catch (e) { console.error('rollback refund failed', order.id, e.status, e.detail || e.message); }
          }
          await delOrder();
          return res.status(500).json({ error: 'Lỗi máy chủ, đơn chưa được tạo và ví không bị trừ tiền. Vui lòng thử lại.' });
        }
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
      const rows = [];
      let failed = 0;
      const WALLET_FIELDS = ['walletPaid', 'walletRef', 'walletRefunded', 'refundedAt'];
      const incoming = list.filter(function (o) { return o && o.id; }).slice(0, 100);
      for (let i = 0; i < incoming.length; i++) {
        const o = incoming[i];
        const id = cleanStr(o.id, 40);
        const ex = await getOne(id);
        // Các trường liên quan tiền ví do MÁY CHỦ quyết định, admin/trình duyệt không được tự sửa
        WALLET_FIELDS.forEach(function (k) {
          if (ex && ex[k] !== undefined) o[k] = ex[k]; else delete o[k];
        });
        if (ex) {
          // đơn đã hoàn tiền thì không được mở lại (tránh khách vừa nhận hàng vừa được hoàn tiền)
          if (ex.walletRefunded && o.status !== 'Đã hủy') o.status = 'Đã hủy';
          if (o.status === 'Đã hủy') {
            const rf = await refundIfNeeded(o, 'Hoàn tiền đơn đã hủy');
            if (rf === 'fail') { failed++; continue; }   // chưa hoàn được → không lưu, client sẽ thử lại
          }
        }
        rows.push({ id: id, data: o, created_at: o.createdAt || new Date().toISOString() });
      }
      if (rows.length) {
        await sb('orders?on_conflict=id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: rows });
      }
      if (failed) return res.status(500).json({ error: 'Không hoàn được tiền vào ví cho ' + failed + ' đơn, vui lòng thử lại', count: rows.length });
      return res.status(200).json({ ok: true, count: rows.length });
    }

    if (req.method === 'DELETE') {
      if (!q.id) return res.status(400).json({ error: 'Thiếu id' });
      const ex = await getOne(String(q.id));
      // xóa đơn chưa giao thì hoàn tiền ví trước (nếu đơn đã trả bằng ví)
      if (ex && ex.status !== 'Đã giao') {
        if ((await refundIfNeeded(ex, 'Hoàn tiền đơn bị xóa')) === 'fail') {
          return res.status(500).json({ error: 'Không hoàn được tiền vào ví, đơn chưa bị xóa' });
        }
      }
      await sb('orders?id=eq.' + encodeURIComponent(String(q.id)), { method: 'DELETE' });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Phương thức không được hỗ trợ' });
  } catch (e) {
    console.error('orders api error', e.status, e.detail || e.message);
    return res.status(500).json({ error: 'Lỗi máy chủ' });
  }
};
