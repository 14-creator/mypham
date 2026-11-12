/**
 * TranAnh Skin - Store & State Management
 * Quản lý giỏ hàng, sản phẩm, đơn hàng, yêu cầu tư vấn và đánh giá với LocalStorage
 */

const Store = (function () {
  const STORAGE_KEYS = {
    PRODUCTS: 'tas_products_v1',
    CART: 'tas_cart_v1',
    ORDERS: 'tas_orders_v1',
    CONSULTATIONS: 'tas_consultations_v1',
    REVIEWS: 'tas_reviews_v1',
    PROMO: 'tas_promo_v1',
    WALLETS: 'tas_wallets_v1',
    TOPUPS: 'tas_topups_v1'
  };

  // Helper function to format VND
  function formatMoney(amount) {
    if (!amount && amount !== 0) return '0 đ';
    return amount.toLocaleString('vi-VN') + ' đ';
  }

  // Event dispatcher
  const listeners = {};
  function on(event, callback) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(callback);
  }
  function emit(event, data) {
    if (listeners[event]) {
      listeners[event].forEach(cb => {
        try { cb(data); } catch (e) { console.error('Store listener error:', e); }
      });
    }
  }

  // --- PRODUCTS ---
  function getStoredProducts() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to parse stored products', e);
    }
    return [...PRODUCTS_DATA];
  }

  let products = getStoredProducts();

  function saveProducts() {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.warn('Failed to save products', e);
    }
    emit('products:changed', products);
  }

  function getProducts(includeInactive = false) {
    if (includeInactive) return products;
    return products.filter(p => p.is_active !== false);
  }

  function getProductBySlug(slug) {
    return products.find(p => p.slug === slug);
  }

  function getProductById(id) {
    return products.find(p => p.id === id);
  }

  function getCategories() {
    const counts = {};
    products.forEach(p => {
      if (p.is_active !== false) {
        counts[p.category] = (counts[p.category] || 0) + 1;
      }
    });
    return Object.keys(counts).map(name => ({
      name,
      count: counts[name]
    }));
  }

  function updateProduct(id, changes) {
    const idx = products.findIndex(p => p.id === id);
    if (idx !== -1) {
      products[idx] = { ...products[idx], ...changes, updated_date: new Date().toISOString() };
      saveProducts();
      return products[idx];
    }
    return null;
  }

  function addProduct(productData) {
    const slug = productData.slug || productData.name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    const newProduct = {
      id: 'prod_' + Date.now(),
      slug,
      rating: 5.0,
      reviews_count: 0,
      is_active: true,
      created_date: new Date().toISOString(),
      image: productData.image || 'assets/images/logo.png',
      ...productData
    };
    products.unshift(newProduct);
    saveProducts();
    return newProduct;
  }

  function deleteProduct(id) {
    products = products.filter(p => p.id !== id);
    saveProducts();
  }

  function resetProducts() {
    products = [...PRODUCTS_DATA];
    saveProducts();
  }

  // --- CART ---
  function getStoredCart() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CART);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to parse cart', e);
    }
    return [];
  }

  let cart = getStoredCart();
  let appliedPromo = null;

  function saveCart() {
    try {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    } catch (e) {
      console.warn('Failed to save cart', e);
    }
    emit('cart:changed', getCartSummary());
  }

  // Chỉ tài khoản đã đăng nhập mới được mua hàng
  function requireLogin() {
    if (window.Auth && Auth.isLoggedIn()) return true;
    emit('toast:show', { message: 'Vui lòng đăng nhập hoặc đăng ký tài khoản để mua hàng', type: 'error' });
    const path = (window.location.hash || '#/').split('?')[0].replace(/^#\/?/, '');
    window.location.hash = '#/dang-nhap?redirect=' + encodeURIComponent(path);
    return false;
  }

  function addToCart(product, quantity = 1) {
    if (!requireLogin()) return false;
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({
        id: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        compare_price: product.compare_price,
        image: product.image || product.local_image,
        volume: product.volume,
        category: product.category,
        quantity: quantity
      });
    }
    saveCart();
    emit('toast:show', { message: `Đã thêm "${product.name}" vào giỏ hàng`, type: 'success' });
    return true;
  }

  function updateQuantity(productId, quantity) {
    const idx = cart.findIndex(item => item.id === productId);
    if (idx !== -1) {
      if (quantity <= 0) {
        cart.splice(idx, 1);
      } else {
        cart[idx].quantity = quantity;
      }
      saveCart();
    }
  }

  function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
  }

  function clearCart() {
    cart = [];
    appliedPromo = null;
    saveCart();
  }

  function applyPromoCode(code) {
    const trimmed = (code || '').trim().toUpperCase();
    if (!trimmed) {
      appliedPromo = null;
      saveCart();
      return { success: false, message: 'Vui lòng nhập mã giảm giá' };
    }
    if (trimmed === 'TRANANH10') {
      appliedPromo = { code: 'TRANANH10', type: 'percent', value: 0.1, label: 'Giảm 10% đơn hàng' };
      saveCart();
      return { success: true, message: 'Áp dụng mã TRANANH10: Giảm 10%' };
    }
    if (trimmed === 'GLOW50') {
      appliedPromo = { code: 'GLOW50', type: 'fixed', value: 50000, label: 'Giảm 50.000 đ' };
      saveCart();
      return { success: true, message: 'Áp dụng mã GLOW50: Giảm 50.000 đ' };
    }
    if (trimmed === 'FREESHIP') {
      appliedPromo = { code: 'FREESHIP', type: 'shipping', value: 30000, label: 'Miễn phí vận chuyển' };
      saveCart();
      return { success: true, message: 'Áp dụng mã FREESHIP: Miễn phí vận chuyển' };
    }
    return { success: false, message: 'Mã giảm giá không hợp lệ hoặc đã hết hạn' };
  }

  function getCartSummary() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Free shipping for orders >= 500.000 đ
    let shippingFee = subtotal >= 500000 || subtotal === 0 ? 0 : 30000;
    
    let discount = 0;
    if (appliedPromo) {
      if (appliedPromo.type === 'percent') {
        discount = Math.round(subtotal * appliedPromo.value);
      } else if (appliedPromo.type === 'fixed') {
        discount = Math.min(subtotal, appliedPromo.value);
      } else if (appliedPromo.type === 'shipping') {
        discount = shippingFee;
        shippingFee = 0;
      }
    }

    const total = Math.max(0, subtotal - discount + (appliedPromo?.type === 'shipping' ? 0 : shippingFee));

    return {
      items: [...cart],
      count,
      subtotal,
      shippingFee,
      discount,
      appliedPromo,
      total
    };
  }

  // --- WALLET (ví riêng cho từng tài khoản) ---
  const WALLET_METHOD = 'Ví TranAnh';
  const TOPUP_MIN = 10000;
  const TOPUP_MAX = 50000000;
  const TOPUP_MAX_PENDING = 3;

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  // Luôn đọc mới từ LocalStorage để nhiều tab (khách / quản trị) không ghi đè dữ liệu của nhau
  function readWallets() {
    const w = readJSON(STORAGE_KEYS.WALLETS, {});
    return (w && typeof w === 'object' && !Array.isArray(w)) ? w : {};
  }

  function writeWallets(all) {
    try {
      localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(all));
    } catch (e) {
      console.warn('Failed to save wallets', e);
    }
  }

  function readTopups() {
    const t = readJSON(STORAGE_KEYS.TOPUPS, []);
    return Array.isArray(t) ? t : [];
  }

  function writeTopups(list) {
    try {
      localStorage.setItem(STORAGE_KEYS.TOPUPS, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save topups', e);
    }
  }

  function currentUser() {
    return (window.Auth && Auth.currentUser) ? Auth.currentUser() : null;
  }

  function getWallet(userId) {
    const w = userId ? readWallets()[userId] : null;
    return w ? { balance: w.balance || 0, transactions: w.transactions || [] } : { balance: 0, transactions: [] };
  }

  function getBalance(userId) {
    return getWallet(userId).balance;
  }

  // Ghi một giao dịch vào ví. delta < 0 là trừ tiền (không cho phép âm số dư).
  function addWalletTx(userId, delta, type, desc, ref) {
    delta = Math.round(delta);
    if (!userId || !delta) return false;
    const all = readWallets();
    const w = all[userId] || { balance: 0, transactions: [] };
    if (w.balance + delta < 0) return false;
    w.balance += delta;
    w.transactions.unshift({
      id: 'tx-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      type,
      amount: delta,
      balanceAfter: w.balance,
      desc,
      ref: ref || '',
      createdAt: new Date().toISOString()
    });
    if (w.transactions.length > 300) w.transactions.length = 300;
    all[userId] = w;
    writeWallets(all);
    emit('wallet:changed', { userId });
    return true;
  }

  function createTopupRequest(amount) {
    const user = currentUser();
    if (!user) throw new Error('Vui lòng đăng nhập để nạp tiền vào ví');
    amount = Math.round(Number(amount));
    if (!amount || amount < TOPUP_MIN) throw new Error('Số tiền nạp tối thiểu là ' + formatMoney(TOPUP_MIN));
    if (amount > TOPUP_MAX) throw new Error('Số tiền nạp tối đa mỗi lần là ' + formatMoney(TOPUP_MAX));

    const list = readTopups();
    const pending = list.filter(t => t.userId === user.id && t.status === 'Chờ xác nhận');
    if (pending.length >= TOPUP_MAX_PENDING) {
      throw new Error('Bạn đang có ' + pending.length + ' yêu cầu nạp chờ xác nhận. Hãy hoàn tất hoặc hủy bớt trước khi tạo thêm.');
    }

    let id;
    do {
      id = 'NAP' + Math.floor(100000 + Math.random() * 900000);
    } while (list.some(t => t.id === id));

    const req = {
      id,
      userId: user.id,
      userName: user.name || user.username,
      userEmail: user.email || '',
      amount,
      status: 'Chờ xác nhận',
      createdAt: new Date().toISOString()
    };
    list.unshift(req);
    writeTopups(list);
    emit('wallet:changed', { userId: user.id });
    return req;
  }

  function getTopups(userId) {
    const list = readTopups();
    return userId ? list.filter(t => t.userId === userId) : list;
  }

  function setTopupStatus(id, fromStatus, toStatus, extra) {
    const list = readTopups();
    const req = list.find(t => t.id === id);
    if (!req || req.status !== fromStatus) return null;
    req.status = toStatus;
    Object.assign(req, extra || {});
    writeTopups(list);
    return req;
  }

  // Quản trị viên đối chiếu sao kê rồi cộng tiền vào ví khách (mỗi yêu cầu chỉ cộng 1 lần)
  function approveTopup(id) {
    if (!(window.Auth && Auth.isAdmin())) return null;
    const req = readTopups().find(t => t.id === id);
    if (!req || req.status !== 'Chờ xác nhận') return null;
    // Đánh dấu đã xử lý trước, rồi mới cộng tiền: tránh cộng 2 lần nếu bấm nhanh
    const done = setTopupStatus(id, 'Chờ xác nhận', 'Đã cộng tiền', { approvedAt: new Date().toISOString() });
    if (!done) return null;
    if (!addWalletTx(req.userId, req.amount, 'topup', 'Nạp tiền vào ví (' + req.id + ')', req.id)) {
      setTopupStatus(id, 'Đã cộng tiền', 'Chờ xác nhận', {});
      return null;
    }
    emit('toast:show', { message: 'Đã cộng ' + formatMoney(req.amount) + ' vào ví của ' + req.userName, type: 'success' });
    return done;
  }

  function rejectTopup(id) {
    if (!(window.Auth && Auth.isAdmin())) return null;
    const req = setTopupStatus(id, 'Chờ xác nhận', 'Đã từ chối', { rejectedAt: new Date().toISOString() });
    if (req) emit('wallet:changed', { userId: req.userId });
    return req;
  }

  // Khách tự hủy yêu cầu nạp của chính mình khi chưa được cộng tiền
  function cancelTopup(id) {
    const user = currentUser();
    const req = readTopups().find(t => t.id === id);
    if (!user || !req || req.userId !== user.id) return null;
    const done = setTopupStatus(id, 'Chờ xác nhận', 'Đã hủy', { cancelledAt: new Date().toISOString() });
    if (done) emit('wallet:changed', { userId: user.id });
    return done;
  }

  // Hoàn tiền vào ví nếu đơn đã trả bằng ví (mỗi đơn chỉ hoàn 1 lần)
  function refundWalletOrder(order, reason) {
    if (!order || !order.walletPaid || order.walletRefunded || !order.userId) return false;
    if (!addWalletTx(order.userId, order.walletPaid, 'refund', reason + ' ' + order.id, order.id)) return false;
    order.walletRefunded = true;
    order.refundedAt = new Date().toISOString();
    return true;
  }

  // Đồng bộ giữa các tab khi quản trị viên cộng tiền
  window.addEventListener('storage', function (e) {
    if (e.key === null || e.key === STORAGE_KEYS.WALLETS || e.key === STORAGE_KEYS.TOPUPS) {
      emit('wallet:changed', {});
    }
  });

  // --- ORDERS ---
  const INITIAL_ORDERS = [
    {
      id: "TAS-2026-9801",
      customer: {
        name: "Nguyễn Thanh Hằng",
        phone: "0912 345 678",
        address: "Số 45 ngõ 198 Xã Đàn, Đống Đa, Hà Nội",
        notes: "Giao giờ hành chính, gọi trước khi giao"
      },
      items: [
        { name: "Tinh Chất Vitamin C 15%", price: 1250000, quantity: 1, volume: "30ml", image: "assets/images/tinh-chat-vitamin-c-15.png" },
        { name: "Kem Dưỡng Phục Hồi Ceramide", price: 1480000, quantity: 1, volume: "50ml", image: "assets/images/kem-duong-phuc-hoi-ceramide.png" }
      ],
      subtotal: 2730000,
      shippingFee: 0,
      discount: 0,
      total: 2730000,
      paymentMethod: "Chuyển khoản VietQR",
      status: "Đã giao",
      createdAt: "2026-11-08T10:30:00.000Z"
    },
    {
      id: "TAS-2026-9802",
      customer: {
        name: "Trần Quốc Bảo",
        phone: "0987 654 321",
        address: "Căn hộ A1204 Vinhomes Central Park, Bình Thạnh, TP.HCM",
        notes: "Để ở lễ tân tòa nhà A nếu không nghe máy"
      },
      items: [
        { name: "Kem Chống Nắng Phổ Rộng SPF50+", price: 720000, quantity: 1, volume: "50ml", image: "assets/images/kem-chong-nang-pho-rong-spf50.png" }
      ],
      subtotal: 720000,
      shippingFee: 0,
      discount: 0,
      total: 720000,
      paymentMethod: "COD (Thanh toán khi nhận hàng)",
      status: "Đang giao",
      createdAt: "2026-11-09T14:15:00.000Z"
    },
    {
      id: "TAS-2026-9803",
      customer: {
        name: "Lê Hoàng My",
        phone: "0903 112 233",
        address: "78 Nguyễn Tri Phương, Quận Hải Châu, Đà Nẵng",
        notes: ""
      },
      items: [
        { name: "Sữa Rửa Mặt Amino Acid", price: 590000, quantity: 1, volume: "150ml", image: "assets/images/sua-rua-mat-amino-acid.png" }
      ],
      subtotal: 590000,
      shippingFee: 0,
      discount: 0,
      total: 590000,
      paymentMethod: "COD (Thanh toán khi nhận hàng)",
      status: "Chờ xác nhận",
      createdAt: "2026-11-10T08:20:00.000Z"
    }
  ];

  function getStoredOrders() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to parse orders', e);
    }
    return INITIAL_ORDERS;
  }

  let orders = getStoredOrders();

  function saveOrders() {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    } catch (e) {
      console.warn('Failed to save orders', e);
    }
    emit('orders:changed', orders);
  }

  function getOrders() {
    return [...orders];
  }

  // Đồng bộ đơn hàng giữa các tab: khi tab khác (vd. trang Quản trị) ghi tas_orders_v1,
  // tab này nạp lại bản mới nhất để không giữ dữ liệu cũ (và không ghi đè nhầm về sau).
  window.addEventListener('storage', function (e) {
    if (e.key !== null && e.key !== STORAGE_KEYS.ORDERS) return;
    orders = getStoredOrders();
    emit('orders:changed', orders);
  });

  function createOrder({ customer, paymentMethod, notes }) {
    const summary = getCartSummary();
    if (summary.items.length === 0) {
      throw new Error('Giỏ hàng đang trống!');
    }

    const user = currentUser();
    if (!user) throw new Error('Vui lòng đăng nhập để đặt hàng');

    let orderId;
    do {
      orderId = 'TAS-2026-' + Math.floor(1000 + Math.random() * 9000);
    } while (orders.some(o => o.id === orderId));

    const isQR = !!paymentMethod && paymentMethod.includes('VietQR');
    const useWallet = paymentMethod === WALLET_METHOD;

    // Thanh toán bằng ví: trừ tiền ngay, không đủ số dư thì không tạo đơn
    if (useWallet && !addWalletTx(user.id, -summary.total, 'payment', 'Thanh toán đơn hàng ' + orderId, orderId)) {
      throw new Error('Số dư ví không đủ. Vui lòng nạp thêm ' + formatMoney(Math.max(0, summary.total - getBalance(user.id))) + ' hoặc chọn phương thức khác.');
    }

    const newOrder = {
      id: orderId,
      userId: user.id,
      userName: user.name || user.username,
      customer: {
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        notes: notes || customer.notes || ''
      },
      items: [...summary.items],
      subtotal: summary.subtotal,
      shippingFee: summary.shippingFee,
      discount: summary.discount,
      appliedPromo: summary.appliedPromo,
      total: summary.total,
      paymentMethod: paymentMethod || 'COD (Thanh toán khi nhận hàng)',
      paymentStatus: isQR ? 'Chờ thanh toán' : 'Chưa thanh toán (COD)',
      status: 'Chờ xác nhận',
      carrier: 'Giao Hàng Tiết Kiệm (GHTK)',
      trackingCode: 'GHTK-' + orderId,
      timeline: [
        {
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          date: new Date().toLocaleDateString('vi-VN'),
          title: 'Khởi tạo đơn hàng',
          desc: 'Khách hàng hoàn tất điền thông tin và gửi đơn đặt hàng.',
          completed: true
        }
      ],
      createdAt: new Date().toISOString()
    };

    if (useWallet) {
      const now = new Date();
      newOrder.paymentStatus = 'Đã thanh toán (Ví TranAnh)';
      newOrder.status = 'Đang chuẩn bị';
      newOrder.walletPaid = summary.total;
      newOrder.paidAt = now.toISOString();
      newOrder.timeline.push({
        time: now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        date: now.toLocaleDateString('vi-VN'),
        title: 'Thanh toán bằng Ví TranAnh',
        desc: `Đã trừ ${formatMoney(summary.total)} từ ví của ${newOrder.userName}. Cửa hàng đang chuẩn bị đơn.`,
        completed: true
      });
    }

    orders.unshift(newOrder);
    saveOrders();
    clearCart();
    return newOrder;
  }

  function markOrderPaidAndShipped(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return null;

    const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const nowDate = new Date().toLocaleDateString('vi-VN');

    order.paymentStatus = 'Đã thanh toán (Ví / VietQR)';
    order.status = 'Đang giao';
    order.paidAt = new Date().toISOString();
    order.shippedAt = new Date().toISOString();
    order.autoDispatched = true;

    if (!order.timeline) order.timeline = [];

    order.timeline.push(
      {
        time: nowTime,
        date: nowDate,
        title: 'Thanh toán chuyển khoản thành công',
        desc: `Ngân hàng đối soát khớp ${formatMoney(order.total)}. Nội dung: ${order.id}.`,
        completed: true
      },
      {
        time: nowTime,
        date: nowDate,
        title: 'Hệ thống tự động xác nhận đơn',
        desc: 'Hệ thống tự động duyệt đơn, xuất hóa đơn điện tử và in phiếu xuất kho.',
        completed: true
      },
      {
        time: nowTime,
        date: nowDate,
        title: 'Tự động bàn giao vận chuyển (GHTK)',
        desc: `Đã kích hoạt vận đơn mã ${order.trackingCode}. Shipper GHTK tiếp nhận và đang trên đường giao.`,
        completed: true,
        active: true
      }
    );

    saveOrders();
    emit('toast:show', { message: `Đơn ${order.id} đã thanh toán & tự động vận chuyển đi!`, type: 'success' });
    return order;
  }

  // Khách bấm "Tôi đã thanh toán": ghi nhận để admin biết và đối chiếu sao kê
  function markCustomerClaimedPaid(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return null;
    if (order.customerClaimedPaid) return order;
    if (order.paymentStatus && order.paymentStatus.includes('Đã thanh toán')) return order;
    const now = new Date();
    order.customerClaimedPaid = true;
    order.claimedAt = now.toISOString();
    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      time: now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      date: now.toLocaleDateString('vi-VN'),
      title: 'Khách báo đã chuyển khoản',
      desc: `Khách bấm "Tôi đã thanh toán" cho đơn ${order.id} (${formatMoney(order.total)}). Chờ cửa hàng đối chiếu.`,
      completed: true
    });
    saveOrders();
    return order;
  }

  function updateOrderStatus(orderId, newStatus) {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      // Đơn đã hủy và hoàn tiền vào ví thì không được mở lại (tránh nhận hàng mà đã được hoàn tiền)
      if (order.walletRefunded && newStatus !== 'Đã hủy') {
        emit('toast:show', { message: 'Đơn này đã hoàn tiền vào ví, không thể chuyển lại trạng thái khác', type: 'error' });
        return null;
      }
      order.status = newStatus;
      if (newStatus === 'Đã hủy' && refundWalletOrder(order, 'Hoàn tiền đơn đã hủy')) {
        emit('toast:show', { message: 'Đã hoàn ' + formatMoney(order.walletPaid) + ' vào ví khách', type: 'success' });
      }
      saveOrders();
      return order;
    }
    return null;
  }

  // Admin xác nhận thủ công đã nhận tiền (không tự động giao hàng)
  function confirmOrderPaidManual(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return null;
    if (order.paymentStatus && order.paymentStatus.includes('Đã thanh toán')) return order;
    const now = new Date();
    order.paymentStatus = 'Đã thanh toán (Admin xác nhận)';
    order.paidAt = now.toISOString();
    if (order.status === 'Chờ xác nhận') order.status = 'Đang chuẩn bị';
    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      time: now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      date: now.toLocaleDateString('vi-VN'),
      title: 'Cửa hàng xác nhận đã nhận thanh toán',
      desc: `Quản trị viên xác nhận đã nhận ${formatMoney(order.total)} cho đơn ${order.id}.`,
      completed: true
    });
    saveOrders();
    return order;
  }

  function deleteOrder(orderId) {
    const target = orders.find(o => o.id === orderId);
    if (target && target.status !== 'Đã giao') refundWalletOrder(target, 'Hoàn tiền đơn bị xóa');
    const before = orders.length;
    orders = orders.filter(o => o.id !== orderId);
    if (orders.length === before) return false;
    saveOrders();
    return true;
  }

  // --- CONSULTATIONS ---
  const INITIAL_CONSULTATIONS = [
    {
      id: "cs-1",
      name: "Nguyễn Thùy Linh",
      phone: "0934 123 456",
      email: "thuy.linh@gmail.com",
      skin_type: "Da hỗn hợp thiên dầu, nhạy cảm",
      concerns: "Mụn ẩn vùng trán và cằm, thâm đỏ sau mụn, dễ bị kích ứng khi dùng acid",
      current_routine: "Nước tẩy trang, sữa rửa mặt dịu nhẹ, kem chống nắng vật lý",
      status: "Chưa xử lý",
      createdAt: "2026-11-09T09:00:00.000Z"
    },
    {
      id: "cs-2",
      name: "Phạm Minh Đức",
      phone: "0918 765 432",
      email: "minhduc.pham@outlook.com",
      skin_type: "Da dầu, lỗ chân lông to",
      concerns: "Đổ nhiều dầu vào buổi chiều, lỗ chân lông 2 bên cánh mũi to, muốn cải thiện độ sáng và đều màu da",
      current_routine: "Chưa có quy trình cụ thể, chỉ dùng sữa rửa mặt",
      status: "Đã tư vấn",
      createdAt: "2026-11-08T15:45:00.000Z"
    }
  ];

  function getStoredConsultations() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONSULTATIONS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to parse consultations', e);
    }
    return INITIAL_CONSULTATIONS;
  }

  let consultations = getStoredConsultations();

  function saveConsultations() {
    try {
      localStorage.setItem(STORAGE_KEYS.CONSULTATIONS, JSON.stringify(consultations));
    } catch (e) {
      console.warn('Failed to save consultations', e);
    }
    emit('consultations:changed', consultations);
  }

  function getConsultations() {
    return [...consultations];
  }

  function addConsultation(data) {
    const item = {
      id: 'cs-' + Date.now(),
      name: data.name,
      phone: data.phone,
      email: data.email || '',
      skin_type: data.skin_type || 'Chưa xác định',
      concerns: data.concerns,
      current_routine: data.current_routine || 'Chưa có',
      status: 'Chưa xử lý',
      createdAt: new Date().toISOString()
    };
    consultations.unshift(item);
    saveConsultations();
    emit('toast:show', { message: 'Đã gửi yêu cầu tư vấn thành công! Chuyên viên sẽ liên hệ trong 24h.', type: 'success' });
    return item;
  }

  function updateConsultationStatus(id, status) {
    const item = consultations.find(c => c.id === id);
    if (item) {
      item.status = status;
      saveConsultations();
      return item;
    }
    return null;
  }

  function deleteConsultation(id) {
    const before = consultations.length;
    consultations = consultations.filter(c => c.id !== id);
    if (consultations.length === before) return false;
    saveConsultations();
    return true;
  }

  // --- REVIEWS ---
  function getStoredReviews() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REVIEWS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to parse reviews', e);
    }
    return INITIAL_REVIEWS;
  }

  let reviews = getStoredReviews();

  function saveReviews() {
    try {
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
    } catch (e) {
      console.warn('Failed to save reviews', e);
    }
    emit('reviews:changed', reviews);
  }

  function getReviews(productSlug) {
    if (!productSlug) return reviews;
    return reviews.filter(r => r.product_slug === productSlug);
  }

  function addReview(reviewData) {
    const item = {
      id: 'rev-' + Date.now(),
      product_slug: reviewData.product_slug,
      name: reviewData.name,
      rating: Number(reviewData.rating) || 5,
      skin_type: reviewData.skin_type || 'Khách hàng đã xác thực',
      date: new Date().toLocaleDateString('vi-VN'),
      title: reviewData.title || 'Đánh giá sản phẩm',
      comment: reviewData.comment
    };
    reviews.unshift(item);
    saveReviews();
    emit('toast:show', { message: 'Cảm ơn bạn đã gửi đánh giá sản phẩm!', type: 'success' });
    return item;
  }

  return {
    formatMoney,
    on,
    emit,
    // Products
    getProducts,
    getProductBySlug,
    getProductById,
    getCategories,
    updateProduct,
    addProduct,
    deleteProduct,
    resetProducts,
    // Cart
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyPromoCode,
    getCartSummary,
    // Orders
    getOrders,
    createOrder,
    updateOrderStatus,
    deleteOrder,
    confirmOrderPaidManual,
    markOrderPaidAndShipped,
    markCustomerClaimedPaid,
    // Wallet
    WALLET_METHOD,
    TOPUP_MIN,
    TOPUP_MAX,
    getWallet,
    getBalance,
    createTopupRequest,
    getTopups,
    approveTopup,
    rejectTopup,
    cancelTopup,
    // Consultations
    getConsultations,
    addConsultation,
    updateConsultationStatus,
    deleteConsultation,
    // Reviews
    getReviews,
    addReview
  };
})();

// Để các file khác (auth.js) kiểm tra được window.Store (const ở top-level không tự gắn vào window)
if (typeof window !== 'undefined') window.Store = Store;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Store;
}