/**
 * TranAnh Skin - Đăng ký / Đăng nhập tài khoản
 * Lưu tài khoản và phiên đăng nhập bằng LocalStorage (không cần máy chủ).
 *
 * Lưu ý bảo mật: vì toàn bộ web chạy ở trình duyệt nên đây chỉ là lớp bảo vệ giao diện.
 * Muốn bảo vệ thật sự trang Quản trị cần xác thực ở phía máy chủ.
 */

const Auth = (function () {
  'use strict';

  const KEYS = {
    USERS: 'tas_users_v1',
    SESSION: 'tas_session_v1'
  };

  // Tài khoản quản trị mặc định
  const ADMIN_SEED = {
    id: 'admin',
    username: 'TRANANH',
    password: '2005',
    name: 'Quản trị viên TranAnh',
    salt: 'tas-admin'
  };

  // --- Storage helpers ---
  function load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { /* bỏ qua */ }
  }

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function toast(message, type) {
    try {
      if (window.Store && Store.emit) Store.emit('toast:show', { message, type: type || 'success' });
    } catch (e) { /* bỏ qua */ }
  }

  function navigate(hash) {
    if (window.location.hash === hash) {
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    } else {
      window.location.hash = hash;
    }
  }

  // --- Băm mật khẩu (SHA-256 + salt, có dự phòng khi trình duyệt không hỗ trợ) ---
  async function hashPassword(password, salt) {
    const data = salt + ':' + password;
    if (window.crypto && crypto.subtle && window.TextEncoder) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
      return 's256:' + Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    let h1 = 5381, h2 = 52711;
    for (let i = 0; i < data.length; i++) {
      const c = data.charCodeAt(i);
      h1 = ((h1 << 5) + h1) ^ c;
      h2 = ((h2 << 5) + h2) ^ c;
    }
    return 'djb:' + (h1 >>> 0).toString(16) + (h2 >>> 0).toString(16);
  }

  function randomSalt() {
    try {
      const arr = new Uint8Array(12);
      crypto.getRandomValues(arr);
      return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      return Math.random().toString(36).slice(2) + Date.now().toString(36);
    }
  }

  // --- Dữ liệu người dùng ---
  function getUsers() {
    const users = load(KEYS.USERS, []);
    return Array.isArray(users) ? users : [];
  }

  function saveUsers(users) {
    save(KEYS.USERS, users);
  }

  // Luôn đảm bảo tài khoản admin tồn tại và đúng quyền
  const ready = (async function ensureAdmin() {
    const users = getUsers();
    const hash = await hashPassword(ADMIN_SEED.password, ADMIN_SEED.salt);
    const record = {
      id: ADMIN_SEED.id,
      name: ADMIN_SEED.name,
      username: ADMIN_SEED.username,
      email: '',
      role: 'admin',
      salt: ADMIN_SEED.salt,
      hash,
      createdAt: new Date().toISOString()
    };
    const idx = users.findIndex(u => u.id === ADMIN_SEED.id);
    if (idx >= 0) {
      record.createdAt = users[idx].createdAt || record.createdAt;
      users[idx] = record;
    } else {
      users.unshift(record);
    }
    saveUsers(users);
    updateAuthUI();
  })();

  function currentUser() {
    const session = load(KEYS.SESSION, null);
    if (!session || !session.userId) return null;
    return getUsers().find(u => u.id === session.userId) || null;
  }

  function isLoggedIn() {
    return !!currentUser();
  }

  function isAdmin() {
    const u = currentUser();
    return !!u && u.role === 'admin';
  }

  // --- Nghiệp vụ ---
  async function register({ name, email, password, confirm }) {
    await ready;
    name = (name || '').trim();
    email = (email || '').trim().toLowerCase();
    password = password || '';

    if (name.length < 2) return { success: false, message: 'Vui lòng nhập họ và tên' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { success: false, message: 'Email chưa đúng định dạng' };
    if (password.length < 6) return { success: false, message: 'Mật khẩu cần ít nhất 6 ký tự' };
    if (password !== confirm) return { success: false, message: 'Mật khẩu nhập lại không khớp' };

    const users = getUsers();
    if (users.some(u => (u.email || '').toLowerCase() === email || (u.username || '').toLowerCase() === email)) {
      return { success: false, message: 'Email này đã được đăng ký. Hãy đăng nhập.' };
    }

    const salt = randomSalt();
    const user = {
      id: 'u_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name,
      username: email,
      email,
      role: 'customer',
      salt,
      hash: await hashPassword(password, salt),
      createdAt: new Date().toISOString()
    };
    users.push(user);
    saveUsers(users);
    save(KEYS.SESSION, { userId: user.id, at: Date.now() });
    updateAuthUI();
    return { success: true, user };
  }

  async function login(identifier, password) {
    await ready;
    const id = (identifier || '').trim().toLowerCase();
    if (!id || !password) return { success: false, message: 'Vui lòng nhập đầy đủ thông tin đăng nhập' };

    const user = getUsers().find(u =>
      (u.username || '').toLowerCase() === id || (u.email || '').toLowerCase() === id
    );
    if (!user) return { success: false, message: 'Tên đăng nhập hoặc mật khẩu không đúng' };

    const hash = await hashPassword(password, user.salt);
    if (hash !== user.hash) return { success: false, message: 'Tên đăng nhập hoặc mật khẩu không đúng' };

    save(KEYS.SESSION, { userId: user.id, at: Date.now() });
    updateAuthUI();
    return { success: true, user };
  }

  function logout() {
    try { localStorage.removeItem(KEYS.SESSION); } catch (e) { /* bỏ qua */ }
    updateAuthUI();
    toast('Đã đăng xuất');
    navigate('#/');
  }

  // --- Cập nhật giao diện header / menu / footer ---
  function updateAuthUI() {
    const user = currentUser();
    const admin = !!user && user.role === 'admin';

    document.querySelectorAll('[data-auth="guest"]').forEach(el => {
      el.style.display = user ? 'none' : '';
    });
    document.querySelectorAll('[data-auth="user"]').forEach(el => {
      el.style.display = user ? '' : 'none';
    });
    document.querySelectorAll('[data-auth="admin"]').forEach(el => {
      el.style.display = admin ? '' : 'none';
    });
    document.querySelectorAll('[data-auth-name]').forEach(el => {
      el.textContent = user ? (user.name || user.username) : '';
    });
  }

  // --- Giao diện các trang ---
  const INPUT_CLASS =
    'w-full h-12 px-4 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-ring transition';

  function renderIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
  }

  function redirectTarget(params) {
    const r = params.get('redirect');
    const map = { admin: '#/admin', 'gio-hang': '#/gio-hang', 'tai-khoan': '#/tai-khoan' };
    return map[r] || '#/';
  }

  function shell(title, subtitle, body, switchHtml) {
    return `
      <div class="page-container py-12 sm:py-20">
        <div class="mx-auto w-full max-w-md">
          <div class="text-center mb-8">
            <p class="eyebrow mb-3">Tài khoản TranAnh Skin</p>
            <h1 class="font-heading text-[clamp(1.9rem,1.3rem+2.2vw,3rem)] leading-[1.12] text-foreground">${title}</h1>
            <p class="mt-3 text-sm text-muted-foreground font-light">${subtitle}</p>
          </div>
          <div class="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
            ${body}
          </div>
          <p class="mt-6 text-center text-sm text-muted-foreground">${switchHtml}</p>
        </div>
      </div>
    `;
  }

  function passwordField(id, name, label, placeholder, autocomplete) {
    return `
      <div>
        <label for="${id}" class="block text-xs font-medium text-foreground mb-1.5">${label}</label>
        <div class="relative">
          <input id="${id}" name="${name}" type="password" required autocomplete="${autocomplete}" placeholder="${placeholder}" class="${INPUT_CLASS} pr-12" />
          <button type="button" onclick="Auth.togglePassword('${id}', this)" class="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground" aria-label="Hiện/ẩn mật khẩu">
            <i data-lucide="eye" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `;
  }

  function renderLoginPage(params) {
    const el = document.getElementById('app-content');
    if (!el) return;
    const redirect = params.get('redirect') || '';
    const notice = redirect === 'admin'
      ? `<div class="mb-5 rounded-lg bg-secondary/60 border border-border/60 px-4 py-3 text-xs text-muted-foreground">Vui lòng đăng nhập bằng tài khoản quản trị để vào trang Quản trị.</div>`
      : '';

    el.innerHTML = shell(
      'Đăng nhập',
      'Chào mừng bạn quay lại với nghi thức chăm sóc da của mình.',
      `
        ${notice}
        <form onsubmit="return Auth.handleLogin(event)" class="space-y-4" novalidate>
          <input type="hidden" name="redirect" value="${esc(redirect)}" />
          <div>
            <label for="login-id" class="block text-xs font-medium text-foreground mb-1.5">Tên đăng nhập hoặc email</label>
            <input id="login-id" name="identifier" type="text" required autocomplete="username" placeholder="Tên đăng nhập hoặc email" class="${INPUT_CLASS}" />
          </div>
          ${passwordField('login-pw', 'password', 'Mật khẩu', 'Nhập mật khẩu', 'current-password')}
          <div id="auth-error" class="hidden rounded-lg bg-destructive/10 text-destructive text-xs px-4 py-3" role="alert"></div>
          <button type="submit" id="auth-submit" class="w-full py-4 px-6 rounded-full bg-foreground text-background text-xs uppercase tracking-widest font-semibold transition">
            Đăng nhập
          </button>
        </form>
      `,
      `Chưa có tài khoản? <a href="#/dang-ky${redirect ? '?redirect=' + encodeURIComponent(redirect) : ''}" class="text-foreground font-medium underline underline-offset-4 hover:text-primary">Đăng ký ngay</a>`
    );
    renderIcons();
    const first = document.getElementById('login-id');
    if (first) first.focus();
  }

  function renderRegisterPage(params) {
    const el = document.getElementById('app-content');
    if (!el) return;
    const redirect = params.get('redirect') || '';

    el.innerHTML = shell(
      'Tạo tài khoản',
      'Đăng ký để theo dõi đơn hàng và nhận tư vấn phác đồ da cá nhân hoá.',
      `
        <form onsubmit="return Auth.handleRegister(event)" class="space-y-4" novalidate>
          <input type="hidden" name="redirect" value="${esc(redirect)}" />
          <div>
            <label for="reg-name" class="block text-xs font-medium text-foreground mb-1.5">Họ và tên</label>
            <input id="reg-name" name="name" type="text" required autocomplete="name" placeholder="Nguyễn Văn A" class="${INPUT_CLASS}" />
          </div>
          <div>
            <label for="reg-email" class="block text-xs font-medium text-foreground mb-1.5">Email</label>
            <input id="reg-email" name="email" type="email" required autocomplete="email" placeholder="ban@example.com" class="${INPUT_CLASS}" />
          </div>
          ${passwordField('reg-pw', 'password', 'Mật khẩu (từ 6 ký tự)', 'Tạo mật khẩu', 'new-password')}
          ${passwordField('reg-pw2', 'confirm', 'Nhập lại mật khẩu', 'Nhập lại mật khẩu', 'new-password')}
          <div id="auth-error" class="hidden rounded-lg bg-destructive/10 text-destructive text-xs px-4 py-3" role="alert"></div>
          <button type="submit" id="auth-submit" class="w-full py-4 px-6 rounded-full bg-foreground text-background text-xs uppercase tracking-widest font-semibold transition">
            Đăng ký
          </button>
        </form>
      `,
      `Đã có tài khoản? <a href="#/dang-nhap${redirect ? '?redirect=' + encodeURIComponent(redirect) : ''}" class="text-foreground font-medium underline underline-offset-4 hover:text-primary">Đăng nhập</a>`
    );
    renderIcons();
    const first = document.getElementById('reg-name');
    if (first) first.focus();
  }

  function renderAccountPage() {
    const el = document.getElementById('app-content');
    const user = currentUser();
    if (!el) return;
    if (!user) {
      navigate('#/dang-nhap?redirect=tai-khoan');
      return;
    }
    const joined = user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '';
    const roleLabel = user.role === 'admin' ? 'Quản trị viên' : 'Khách hàng';

    el.innerHTML = `
      <div class="page-container py-12 sm:py-20">
        <div class="mx-auto w-full max-w-md">
          <div class="text-center mb-8">
            <p class="eyebrow mb-3">Tài khoản của tôi</p>
            <h1 class="font-heading text-[clamp(1.9rem,1.3rem+2.2vw,3rem)] leading-[1.12] text-foreground">Xin chào, ${esc(user.name)}</h1>
          </div>
          <div class="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
            <dl class="space-y-4 text-sm">
              <div class="flex items-center justify-between gap-4 border-b border-border/60 pb-3">
                <dt class="text-muted-foreground">Tên đăng nhập</dt>
                <dd class="font-medium text-foreground break-all text-right">${esc(user.username)}</dd>
              </div>
              ${user.email ? `
              <div class="flex items-center justify-between gap-4 border-b border-border/60 pb-3">
                <dt class="text-muted-foreground">Email</dt>
                <dd class="font-medium text-foreground break-all text-right">${esc(user.email)}</dd>
              </div>` : ''}
              <div class="flex items-center justify-between gap-4 border-b border-border/60 pb-3">
                <dt class="text-muted-foreground">Vai trò</dt>
                <dd class="font-medium text-foreground">${roleLabel}</dd>
              </div>
              ${joined ? `
              <div class="flex items-center justify-between gap-4">
                <dt class="text-muted-foreground">Ngày tạo</dt>
                <dd class="font-medium text-foreground">${joined}</dd>
              </div>` : ''}
            </dl>
            <div class="mt-8 space-y-3">
              ${user.role === 'admin' ? `
              <a href="#/admin" class="w-full py-4 px-6 rounded-full bg-foreground text-background text-xs uppercase tracking-widest font-semibold transition">
                Vào trang Quản trị
              </a>` : `
              <a href="#/san-pham" class="w-full py-4 px-6 rounded-full bg-foreground text-background text-xs uppercase tracking-widest font-semibold transition">
                Tiếp tục mua sắm
              </a>`}
              <button type="button" onclick="Auth.logout()" class="w-full py-4 px-6 rounded-full border border-border bg-background text-foreground text-xs uppercase tracking-widest font-semibold transition">
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    renderIcons();
  }

  // Router gọi hàm này cho #/dang-nhap, #/dang-ky, #/tai-khoan
  function renderPage(hash) {
    const [path, query] = hash.split('?');
    const params = new URLSearchParams(query || '');

    if ((path === '#/dang-nhap' || path === '#/dang-ky') && isLoggedIn()) {
      navigate(redirectTarget(params) === '#/' ? '#/tai-khoan' : redirectTarget(params));
      return;
    }
    if (path === '#/dang-nhap') return renderLoginPage(params);
    if (path === '#/dang-ky') return renderRegisterPage(params);
    if (path === '#/tai-khoan') return renderAccountPage();
  }

  // --- Xử lý form ---
  function showError(message) {
    const box = document.getElementById('auth-error');
    if (!box) return;
    box.textContent = message;
    box.classList.remove('hidden');
  }

  function setBusy(busy) {
    const btn = document.getElementById('auth-submit');
    if (!btn) return;
    btn.disabled = busy;
    btn.style.opacity = busy ? '.6' : '';
  }

  async function handleLogin(e) {
    e.preventDefault();
    const form = e.target;
    const data = new FormData(form);
    setBusy(true);
    const result = await login(data.get('identifier'), data.get('password'));
    setBusy(false);
    if (!result.success) return showError(result.message), false;

    toast('Đăng nhập thành công');
    const params = new URLSearchParams('redirect=' + encodeURIComponent(data.get('redirect') || ''));
    let target = redirectTarget(params);
    if (target === '#/admin' && result.user.role !== 'admin') target = '#/tai-khoan';
    if (target === '#/' && result.user.role === 'admin') target = '#/admin';
    navigate(target);
    return false;
  }

  async function handleRegister(e) {
    e.preventDefault();
    const form = e.target;
    const data = new FormData(form);
    setBusy(true);
    const result = await register({
      name: data.get('name'),
      email: data.get('email'),
      password: data.get('password'),
      confirm: data.get('confirm')
    });
    setBusy(false);
    if (!result.success) return showError(result.message), false;

    toast('Tạo tài khoản thành công');
    const params = new URLSearchParams('redirect=' + encodeURIComponent(data.get('redirect') || ''));
    const target = redirectTarget(params);
    navigate(target === '#/' ? '#/tai-khoan' : target);
    return false;
  }

  function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    if (btn) {
      btn.innerHTML = `<i data-lucide="${show ? 'eye-off' : 'eye'}" class="w-4 h-4"></i>`;
      renderIcons();
    }
  }

  window.addEventListener('DOMContentLoaded', updateAuthUI);

  return {
    register,
    login,
    logout,
    currentUser,
    isLoggedIn,
    isAdmin,
    renderPage,
    updateAuthUI,
    handleLogin,
    handleRegister,
    togglePassword
  };
})();

window.Auth = Auth;