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

  // --- WALLET (ví thật: số dư nằm trên máy chủ, trình duyệt chỉ giữ bản sao để hiển thị) ---
  const WALLET_METHOD = 'Ví TranAnh';
  const TOPUP_MIN = 10000;
  const TOPUP_MAX = 50000000;
  const USER_TOKEN_KEY = 'tas_token_v1';   // token phiên đăng nhập của khách (do /api/user cấp)

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function userToken() { try { return localStorage.getItem(USER_TOKEN_KEY) || ''; } catch (e) { return ''; } }
  function userHeaders() {
    const h = { 'Content-Type': 'application/json' };
    const t = userToken();
    if (t) h.Authorization = 'Bearer ' + t;
    return h;
  }

  function currentUser() {
    return (window.Auth && Auth.currentUser) ? Auth.currentUser() : null;
  }

  const EMPTY_WALLET = { userId: null, balance: 0, transactions: [], topups: [] };
  let walletState = EMPTY_WALLET;   // bản sao ví của người đang đăng nhập (đồng bộ từ máy chủ)
  let adminTopups = [];             // toàn bộ yêu cầu nạp (chỉ admin)
  let walletBusy = false;

  async function refreshWallet() {
    if (!cloudEnabled() || adminActive() || walletBusy) return;
    const user = currentUser();
    if (!user || !userToken()) {
      if (walletState.userId) { walletState = EMPTY_WALLET; emit('wallet:changed', {}); }
      return;
    }
    walletBusy = true;
    try {
      const r = await fetch('/api/wallet', { headers: userHeaders(), cache: 'no-store' });
      if (!r.ok) return;
      const d = await r.json();
      const next = { userId: user.id, balance: d.balance || 0, transactions: d.transactions || [], topups: d.topups || [] };
      if (stable(next) !== stable(walletState)) {
        walletState = next;
        emit('wallet:changed', { userId: user.id });
      }
    } catch (e) { /* mất mạng: thử lại lần sau */ }
    finally { walletBusy = false; }
  }

  async function refreshAdminTopups() {
    if (!adminActive()) return;
    try {
      const r = await fetch('/api/wallet?scope=admin', { headers: adminHeaders(), cache: 'no-store' });
      if (!r.ok) return;
      const d = await r.json();
      const list = Array.isArray(d.topups) ? d.topups : [];
      if (stable(list) !== stable(adminTopups)) {
        adminTopups = list;
        emit('wallet:changed', {});
        emit('orders:remote', orders);   // để trang Quản trị vẽ lại tab ví
      }
    } catch (e) { /* bỏ qua */ }
  }

  function getWallet(userId) {
    if (userId && userId === walletState.userId) {
      return { balance: walletState.balance, transactions: walletState.transactions };
    }
    return { balance: 0, transactions: [] };
  }

  function getBalance(userId) {
    return getWallet(userId).balance;
  }

  async function walletPost(body, headers) {
    let r;
    try {
      r = await fetch('/api/wallet', { method: 'POST', headers: headers, body: JSON.stringify(body) });
    } catch (e) {
      throw new Error('Không kết nối được máy chủ. Vui lòng thử lại.');
    }
    const d = await r.json().catch(function () { return {}; });
    if (r.status === 401) throw new Error(d.error || 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
    if (!r.ok) throw new Error(d.error || 'Thao tác không thành công');
    return d;
  }

  async function createTopupRequest(amount) {
    const user = currentUser();
    if (!user) throw new Error('Vui lòng đăng nhập để nạp tiền vào ví');
    if (!cloudEnabled()) throw new Error('Nạp ví chỉ dùng được trên website đã deploy');
    amount = Math.round(Number(amount));
    if (!amount || amount < TOPUP_MIN) throw new Error('Số tiền nạp tối thiểu là ' + formatMoney(TOPUP_MIN));
    if (amount > TOPUP_MAX) throw new Error('Số tiền nạp tối đa mỗi lần là ' + formatMoney(TOPUP_MAX));
    const d = await walletPost({ action: 'topup', amount: amount }, userHeaders());
    await refreshWallet();
    return d.topup;
  }

  function getTopups(userId) {
    if (userId) return userId === walletState.userId ? walletState.topups : [];
    return adminTopups;   // không truyền userId = góc nhìn quản trị
  }

  // Quản trị viên đối chiếu sao kê rồi cộng tiền vào ví khách (máy chủ đảm bảo mỗi yêu cầu chỉ cộng 1 lần)
  async function approveTopup(id) {
    if (!(window.Auth && Auth.isAdmin())) return null;
    const d = await walletPost({ action: 'approve', id: id }, adminHeaders());
    await refreshAdminTopups();
    emit('toast:show', { message: 'Đã cộng ' + formatMoney(d.topup.amount) + ' vào ví của ' + d.topup.userName, type: 'success' });
    return d.topup;
  }

  async function rejectTopup(id) {
    if (!(window.Auth && Auth.isAdmin())) return null;
    const d = await walletPost({ action: 'reject', id: id }, adminHeaders());
    await refreshAdminTopups();
    return d.topup;
  }

  // Khách tự hủy yêu cầu nạp của chính mình khi chưa được cộng tiền
  async function cancelTopup(id) {
    if (!currentUser()) return null;
    await walletPost({ action: 'cancel', id: id }, userHeaders());
    await refreshWallet();
    return true;
  }

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
    cloudAfterSave();
  }

  // ===================================================================
  // ĐỒNG BỘ ĐƠN HÀNG VỚI MÁY CHỦ (Vercel API /api/orders + Supabase)
  //  - Khách: đơn mới được gửi lên máy chủ; trạng thái đơn được cập nhật về máy khách.
  //  - Admin: đọc toàn bộ đơn từ máy chủ (mọi thiết bị) và ghi lại các thay đổi.
  // ===================================================================
  const CLOUD_API = '/api/orders';
  const TOKEN_KEY = 'tas_admin_token_v1';
  const SYNCED_KEY = 'tas_synced_orders_v1';   // mã đơn của khách đã gửi thành công lên máy chủ
  const FINAL_STATUSES = ['Đã giao', 'Đã hủy'];
  const SERVER_FIELDS = ['status', 'paymentStatus', 'paidAt', 'shippedAt', 'autoDispatched', 'timeline',
    'customerClaimedPaid', 'claimedAt', 'trackingCode', 'carrier', 'walletRefunded', 'refundedAt'];

  function getAdminToken() { try { return sessionStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; } }
  function setAdminToken(t) {
    try { if (t) sessionStorage.setItem(TOKEN_KEY, t); else sessionStorage.removeItem(TOKEN_KEY); } catch (e) { /* bỏ qua */ }
    adminSnapshot = null;
    if (t) cloudStart();
  }
  function cloudEnabled() { return window.location.protocol !== 'file:'; }
  function adminActive() { return cloudEnabled() && !!getAdminToken() && !!(window.Auth && Auth.isAdmin && Auth.isAdmin()); }
  function adminHeaders() { return { 'Content-Type': 'application/json', 'x-admin-token': getAdminToken() }; }
  function readSet(key) {
    try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')); } catch (e) { return new Set(); }
  }
  function writeSet(key, set) {
    try { localStorage.setItem(key, JSON.stringify(Array.from(set).slice(-500))); } catch (e) { /* bỏ qua */ }
  }

  // JSON có thứ tự khóa cố định (Postgres/jsonb xáo trộn thứ tự khóa nên không so sánh trực tiếp được)
  function stable(v) {
    if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
    if (v && typeof v === 'object') {
      return '{' + Object.keys(v).sort().filter(function (k) { return v[k] !== undefined; })
        .map(function (k) { return JSON.stringify(k) + ':' + stable(v[k]); }).join(',') + '}';
    }
    return JSON.stringify(v);
  }

  let adminSnapshot = null;   // id -> JSON đang có trên máy chủ (null = admin chưa tải lần đầu)
  let adminBusy = false;      // đang tải/ghi, tránh chồng chéo
  let adminPushQueued = false;
  let custBusy = false;

  // ---- Phía ADMIN ----
  async function adminLoadOrders() {
    if (!adminActive() || adminBusy) return;
    adminBusy = true;
    try {
      const r = await fetch(CLOUD_API, { headers: adminHeaders(), cache: 'no-store' });
      if (r.status === 401) {
        setAdminToken('');
        emit('toast:show', { message: 'Phiên quản trị hết hạn hoặc sai mật khẩu, vui lòng đăng nhập lại', type: 'error' });
        return;
      }
      if (!r.ok) return;
      const d = await r.json();
      const list = Array.isArray(d.orders) ? d.orders : [];
      // Nếu admin vừa sửa mà chưa kịp lưu lên máy chủ thì không ghi đè, lưu trước đã
      if (adminSnapshot !== null) {
        const ids = new Set(orders.map(function (o) { return o.id; }));
        const dirty = orders.some(function (o) { return adminSnapshot[o.id] !== stable(o); }) ||
          Object.keys(adminSnapshot).some(function (id) { return !ids.has(id); });
        if (dirty) { adminPushQueued = true; return; }
      }
      const snap = {};
      list.forEach(function (o) { snap[o.id] = stable(o); });
      const changed = adminSnapshot === null
        ? true
        : (Object.keys(snap).length !== Object.keys(adminSnapshot).length ||
           Object.keys(snap).some(function (id) { return adminSnapshot[id] !== snap[id]; }));
      orders = list;
      adminSnapshot = snap;
      try { localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders)); } catch (e) { /* bỏ qua */ }
      if (changed) { emit('orders:changed', orders); emit('orders:remote', orders); }
    } catch (e) { /* mất mạng: thử lại lần sau */ }
    finally {
      adminBusy = false;
      if (adminPushQueued) { adminPushQueued = false; adminPush(); }
    }
  }

  async function adminPush() {
    if (!adminActive() || adminSnapshot === null) return;
    if (adminBusy) { adminPushQueued = true; return; }
    const changed = orders.filter(function (o) { return adminSnapshot[o.id] !== stable(o); });
    const currentIds = new Set(orders.map(function (o) { return o.id; }));
    const removed = Object.keys(adminSnapshot).filter(function (id) { return !currentIds.has(id); });
    if (!changed.length && !removed.length) return;
    adminBusy = true;
    try {
      if (changed.length) {
        const r = await fetch(CLOUD_API, { method: 'PUT', headers: adminHeaders(), body: JSON.stringify({ orders: changed }) });
        if (r.ok) changed.forEach(function (o) { adminSnapshot[o.id] = stable(o); });
        else emit('toast:show', { message: 'Không lưu được thay đổi lên máy chủ, vui lòng thử lại', type: 'error' });
      }
      for (let i = 0; i < removed.length; i++) {
        const r = await fetch(CLOUD_API + '?id=' + encodeURIComponent(removed[i]), { method: 'DELETE', headers: adminHeaders() });
        if (r.ok) delete adminSnapshot[removed[i]];
      }
    } catch (e) {
      emit('toast:show', { message: 'Mất kết nối máy chủ, thay đổi chưa được lưu', type: 'error' });
    } finally { adminBusy = false; }
  }

  // ---- Phía KHÁCH ----
  function seedIds() { return new Set(INITIAL_ORDERS.map(function (o) { return o.id; })); }

  async function customerPush() {
    if (!cloudEnabled() || adminActive() || custBusy) return;
    const synced = readSet(SYNCED_KEY), seeds = seedIds();
    const pending = orders.filter(function (o) { return o.userId && !synced.has(o.id) && !seeds.has(o.id); });
    if (!pending.length) return;
    custBusy = true;
    try {
      for (let i = 0; i < pending.length; i++) {
        const o = pending[i];
        const r = await fetch(CLOUD_API, { method: 'POST', headers: userHeaders(), body: JSON.stringify({ order: o }) });
        if (r.status === 201 || r.status === 409 || r.status === 400) {
          if (r.status === 400) console.warn('Máy chủ từ chối đơn', o.id);
          synced.add(o.id);   // 400/409: không thử lại để khỏi lặp vô hạn
        } else break;         // lỗi mạng/máy chủ: thử lại sau
      }
      writeSet(SYNCED_KEY, synced);
    } catch (e) { /* mất mạng: thử lại sau */ }
    finally { custBusy = false; }
  }

  // Lấy trạng thái mới nhất (admin đã xác nhận/giao...) của các đơn khách đang theo dõi
  async function customerRefresh() {
    if (!cloudEnabled() || adminActive()) return;
    const user = currentUser();
    if (!user) return;
    const synced = readSet(SYNCED_KEY);
    const open = orders.filter(function (o) { return o.userId === user.id && synced.has(o.id) && FINAL_STATUSES.indexOf(o.status) === -1; });
    let changed = false;
    for (let i = 0; i < open.length; i++) {
      const o = open[i];
      try {
        const r = await fetch(CLOUD_API + '?id=' + encodeURIComponent(o.id) + '&phone=' + encodeURIComponent((o.customer && o.customer.phone) || ''), { cache: 'no-store' });
        if (!r.ok) continue;
        const srv = (await r.json()).order;
        if (!srv) continue;
        SERVER_FIELDS.forEach(function (k) {
          if (srv[k] !== undefined && stable(srv[k]) !== stable(o[k])) { o[k] = srv[k]; changed = true; }
        });
      } catch (e) { /* bỏ qua */ }
    }
    if (changed) {
      try { localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders)); } catch (e) { /* bỏ qua */ }
      emit('orders:changed', orders);
    }
  }

  // Tra cứu đơn theo mã + SĐT trực tiếp trên máy chủ (dùng cho trang "Tra cứu đơn hàng")
  async function lookupOrderRemote(id, phone) {
    if (!cloudEnabled()) return null;
    try {
      const r = await fetch(CLOUD_API + '?id=' + encodeURIComponent(id) + '&phone=' + encodeURIComponent(phone), { cache: 'no-store' });
      if (!r.ok) return null;
      return (await r.json()).order || null;
    } catch (e) { return null; }
  }

  async function cloudClaim(order) {
    if (!cloudEnabled() || adminActive() || !order) return;
    await customerPush();
    try {
      await fetch(CLOUD_API + '?action=claim', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id, phone: (order.customer && order.customer.phone) || '' })
      });
    } catch (e) { /* bỏ qua */ }
  }

  function cloudAfterSave() {
    if (!cloudEnabled()) return;
    if (adminActive()) adminPush(); else customerPush();
  }

  let cloudTimer = null;
  function cloudTick() {
    if (!cloudEnabled()) return;
    if (adminActive()) { adminLoadOrders(); refreshAdminTopups(); }
    else { customerPush().then(customerRefresh).then(refreshWallet); }
  }
  function cloudStart() {
    if (cloudTimer || !cloudEnabled()) return;
    cloudTick();
    cloudTimer = setInterval(cloudTick, 5000);
  }
  window.addEventListener('load', function () { setTimeout(cloudStart, 800); });

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

  async function createOrder({ customer, paymentMethod, notes }) {
    const summary = getCartSummary();
    if (summary.items.length === 0) {
      throw new Error('Giỏ hàng đang trống!');
    }

    const user = currentUser();
    if (!user) throw new Error('Vui lòng đăng nhập để đặt hàng');

    const isQR = !!paymentMethod && paymentMethod.includes('VietQR');
    const useWallet = paymentMethod === WALLET_METHOD;
    if (useWallet && !cloudEnabled()) throw new Error('Thanh toán bằng ví chỉ dùng được trên website đã deploy');
    if (cloudEnabled() && !userToken()) throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');

    function newId() {
      let id;
      do {
        id = 'TAS-2026-' + Math.floor(1000 + Math.random() * 9000);
      } while (orders.some(o => o.id === id));
      return id;
    }

    function build(orderId) {
      return {
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
    }

    // Chỉ khi mở trực tiếp file (không có máy chủ) mới lưu cục bộ
    if (!cloudEnabled()) {
      const newOrder = build(newId());
      orders.unshift(newOrder);
      saveOrders();
      clearCart();
      return newOrder;
    }

    // MỌI phương thức (COD, VietQR, Ví): gửi lên MÁY CHỦ trước; chỉ khi máy chủ nhận đơn mới báo thành công.
    // Với ví, máy chủ còn trừ tiền trong cùng một bước.
    for (let attempt = 0; attempt < 3; attempt++) {
      const draft = build(newId());
      let r;
      try {
        r = await fetch(CLOUD_API, { method: 'POST', headers: userHeaders(), body: JSON.stringify({ order: draft }) });
      } catch (e) {
        throw new Error(useWallet
          ? 'Mất kết nối khi đặt hàng. Vui lòng kiểm tra lại số dư ví và lịch sử đơn trước khi thử lại.'
          : 'Mất kết nối khi đặt hàng, đơn chưa được tạo. Vui lòng kiểm tra mạng và thử lại.');
      }
      const d = await r.json().catch(function () { return {}; });
      if (r.status === 409) continue;   // trùng mã đơn: tạo mã khác (chưa trừ tiền)
      if (r.status === 201 && d.order) {
        orders.unshift(d.order);
        const synced = readSet(SYNCED_KEY);
        synced.add(d.order.id);
        writeSet(SYNCED_KEY, synced);
        saveOrders();
        clearCart();
        refreshWallet();
        return d.order;
      }
      if (r.status === 401) throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
      throw new Error(d.error || 'Không tạo được đơn hàng, vui lòng thử lại');
    }
    throw new Error('Không tạo được mã đơn hàng, vui lòng thử lại');
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
    cloudClaim(order);
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
      order.status = newStatus;   // hoàn tiền ví (nếu có) do máy chủ xử lý khi lưu đơn
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
    // Đồng bộ máy chủ
    setAdminToken,
    getAdminToken,
    adminLoadOrders,
    lookupOrderRemote,
    cloudStart,
    // Wallet
    WALLET_METHOD,
    TOPUP_MIN,
    TOPUP_MAX,
    getWallet,
    getBalance,
    refreshWallet,
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
