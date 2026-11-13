/**
 * TranAnh Skin - Single Page Application Router & Controllers
 * Hoàn thiện giao diện chuẩn web dược mỹ phẩm lâm sàng cao cấp
 */

(function () {
  'use strict';

  // --- ICONS HELPER ---
  function renderIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  // --- TOAST NOTIFICATION ---
  function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl text-sm font-medium transition-all duration-300 transform translate-y-3 opacity-0 ${
      type === 'success'
        ? 'bg-foreground text-background border border-border'
        : 'bg-destructive text-destructive-foreground'
    }`;
    toast.innerHTML = `
      <i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}" class="w-4 h-4 text-primary shrink-0"></i>
      <span>${message}</span>
    `;
    container.appendChild(toast);
    renderIcons();

    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-3', 'opacity-0');
    });

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-3');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  Store.on('toast:show', e => showToast(e.message, e.type));

  // --- CART BADGE UPDATER ---
  function updateCartBadge() {
    const summary = Store.getCartSummary();
    const badges = document.querySelectorAll('.cart-count-badge');
    badges.forEach(badge => {
      badge.textContent = summary.count;
      if (summary.count > 0) {
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    });

    // Update Drawer if open
    updateCartDrawer();
  }

  Store.on('cart:changed', updateCartBadge);

  // --- CART DRAWER CONTROLLER ---
  function openCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const backdrop = document.getElementById('cart-drawer-backdrop');
    if (drawer && backdrop) {
      drawer.classList.remove('translate-x-full');
      backdrop.classList.remove('opacity-0', 'pointer-events-none');
      updateCartDrawer();
    }
  }

  function closeCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const backdrop = document.getElementById('cart-drawer-backdrop');
    if (drawer && backdrop) {
      drawer.classList.add('translate-x-full');
      backdrop.classList.add('opacity-0', 'pointer-events-none');
    }
  }

  function updateCartDrawer() {
    const drawerContent = document.getElementById('cart-drawer-items');
    const drawerFooter = document.getElementById('cart-drawer-footer');
    if (!drawerContent || !drawerFooter) return;

    const summary = Store.getCartSummary();
    if (summary.items.length === 0) {
      drawerContent.innerHTML = `
        <div class="py-16 text-center text-muted-foreground flex flex-col items-center">
          <div class="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
            <i data-lucide="shopping-bag" class="w-8 h-8 opacity-40"></i>
          </div>
          <p class="font-medium text-foreground">Giỏ hàng của bạn đang trống</p>
          <p class="text-xs mt-1">Chưa có sản phẩm nào được chọn</p>
          <a href="#/san-pham" onclick="App.closeCartDrawer()" class="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-foreground text-background text-xs uppercase tracking-widest rounded-full hover:bg-foreground/90 transition">
            Khám phá sản phẩm
          </a>
        </div>
      `;
      drawerFooter.classList.add('hidden');
    } else {
      drawerFooter.classList.remove('hidden');
      drawerContent.innerHTML = summary.items.map(item => `
        <div class="flex gap-4 py-4 border-b border-border/60">
          <img src="${item.image}" alt="${item.name}" class="w-16 h-20 object-cover rounded bg-secondary shrink-0 border border-border/40" />
          <div class="flex-1 min-w-0">
            <h4 class="text-sm font-medium text-foreground truncate">${item.name}</h4>
            <p class="text-xs text-muted-foreground mt-0.5">${item.volume || ''} · ${item.category || ''}</p>
            <p class="text-sm font-semibold text-foreground mt-1">${Store.formatMoney(item.price)}</p>
            
            <div class="flex items-center justify-between mt-2">
              <div class="flex items-center border border-border rounded">
                <button onclick="Store.updateQuantity('${item.id}', ${item.quantity - 1})" class="w-7 h-7 flex items-center justify-center hover:bg-secondary text-xs">
                  <i data-lucide="minus" class="w-3 h-3"></i>
                </button>
                <span class="w-8 text-center text-xs font-medium">${item.quantity}</span>
                <button onclick="Store.updateQuantity('${item.id}', ${item.quantity + 1})" class="w-7 h-7 flex items-center justify-center hover:bg-secondary text-xs">
                  <i data-lucide="plus" class="w-3 h-3"></i>
                </button>
              </div>
              <button onclick="Store.removeFromCart('${item.id}')" class="text-muted-foreground hover:text-destructive text-xs transition p-1">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
        </div>
      `).join('');

      document.getElementById('drawer-subtotal').textContent = Store.formatMoney(summary.subtotal);
      const freeshipNotice = document.getElementById('drawer-freeship-notice');
      if (freeshipNotice) {
        if (summary.subtotal >= 500000) {
          freeshipNotice.innerHTML = `<span class="text-emerald-600 flex items-center gap-1 font-medium"><i data-lucide="sparkles" class="w-3.5 h-3.5"></i> Đơn hàng đủ điều kiện MIỄN PHÍ vận chuyển!</span>`;
        } else {
          const needed = 500000 - summary.subtotal;
          freeshipNotice.innerHTML = `Mua thêm <strong class="text-foreground">${Store.formatMoney(needed)}</strong> để được Miễn phí vận chuyển`;
        }
      }
    }
    renderIcons();
  }

  // --- ROUTER & PAGE RENDERERS ---
  const routes = {
    '': renderHomePage,
    '#/': renderHomePage,
    '#/san-pham': renderShopPage,
    '#/gio-hang': renderCartPage,
    '#/chinh-sach': renderPoliciesPage,
    '#/admin': renderAdminPage
  };

  function router() {
    const hash = window.location.hash || '#/';
    const contentEl = document.getElementById('app-content');
    if (!contentEl) return;

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Các trang mới (Giới thiệu, Bài viết, FAQ, Liên hệ, Tra cứu đơn) nằm trong pages.js
    if (window.Pages && Pages.handle(hash)) {
      updateNavActive(hash.split('?')[0].replace(/^(#\/[^\/]+).*$/, '$1'));
      return;
    }

    // Handle #/san-pham/:slug
    if (hash.startsWith('#/san-pham/')) {
      const slug = hash.replace('#/san-pham/', '').split('?')[0];
      if (slug) {
        renderProductDetailPage(slug);
        updateNavActive('#/san-pham');
        return;
      }
    }

    // Handle #/san-pham with queries
    if (hash.startsWith('#/san-pham?')) {
      renderShopPage();
      updateNavActive('#/san-pham');
      return;
    }

    const hashPath = hash.split('?')[0];

    // Trang tài khoản: đăng nhập / đăng ký / thông tin tài khoản
    if (hashPath === '#/dang-nhap' || hashPath === '#/dang-ky' || hashPath === '#/tai-khoan' || hashPath === '#/vi') {
      if (window.Auth) {
        Auth.renderPage(hash);
      } else {
        renderHomePage();
      }
      updateNavActive('');
      return;
    }

    // Trang quản trị chỉ dành cho tài khoản admin
    if (hashPath === '#/admin' && !(window.Auth && Auth.isAdmin())) {
      window.location.hash = '#/dang-nhap?redirect=admin';
      return;
    }

    // Giỏ hàng & thanh toán chỉ dành cho tài khoản đã đăng nhập
    if (hashPath === '#/gio-hang' && !(window.Auth && Auth.isLoggedIn())) {
      showToast('Vui lòng đăng nhập hoặc đăng ký tài khoản để mua hàng', 'error');
      window.location.hash = '#/dang-nhap?redirect=gio-hang';
      return;
    }

    // Specific hash routes
    const handler = routes[hash] || routes[hash.split('?')[0]];
    if (handler) {
      handler();
      updateNavActive(hash);
    } else {
      renderHomePage();
      updateNavActive('#/');
    }
  }

  function updateNavActive(currentHash) {
    document.querySelectorAll('.nav-link').forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentHash || (currentHash.startsWith('#/san-pham') && href === '#/san-pham')) {
        link.classList.add('text-foreground', 'font-medium');
        link.classList.remove('text-foreground/70');
      } else {
        link.classList.remove('text-foreground', 'font-medium');
        link.classList.add('text-foreground/70');
      }
    });
  }

  // ==========================================
  // VIEW: HOME PAGE
  // ==========================================
  function renderHomePage() {
    const container = document.getElementById('app-content');
    const featuredProducts = Store.getProducts().filter(p => p.is_featured || ['tinh-chat-vitamin-c-15', 'kem-duong-phuc-hoi-ceramide', 'sua-rua-mat-amino-acid', 'kem-chong-nang-pho-rong-spf50'].includes(p.slug)).slice(0, 4);

    // 3 ảnh sản phẩm nổi bật cho khu vực hero
    const heroShowcase = (featuredProducts.length ? featuredProducts : Store.getProducts())
      .filter(p => p && p.image)
      .slice(0, 3)
      .map(p => ({ name: p.name, image: p.image, href: '#/san-pham/' + p.slug }));
    while (heroShowcase.length < 3) {
      heroShowcase.push({ name: 'TranAnh Skin', image: 'assets/images/hero-banner.png', href: '#/san-pham' });
    }

    container.innerHTML = `
      <!-- HERO SECTION -->
      <section class="home-hero">
        <div class="home-hero-inner page-container">
          <p class="home-eyebrow">Dược mỹ phẩm tuyển chọn · Từ 2026</p>
          <h1 class="home-title">Vẻ đẹp có cơ sở khoa học</h1>
          <p class="home-lead">
            TranAnh Skin tuyển chọn công thức dựa trên bằng chứng lâm sàng: nồng độ hoạt chất được công bố, thành phần minh bạch và hiệu quả kiểm chứng trên từng loại da.
          </p>
          <a href="#/san-pham" class="btn-seg">
            <span class="btn-seg-label">Xem tất cả</span>
            <span class="btn-seg-arrow"><i data-lucide="arrow-right" class="w-5 h-5"></i></span>
          </a>
        </div>

        <div class="home-hero-gallery page-container">
          ${heroShowcase.map(item => `
            <a href="${item.href}" class="home-hero-tile" aria-label="${item.name}">
              <img src="${item.image}" alt="${item.name}" loading="eager" />
            </a>
          `).join('')}
        </div>

        <!-- Trust strip -->
        <div class="home-trust-strip">
          <ul>
            <li>Công thức kiểm nghiệm lâm sàng</li>
            <li>Nồng độ hoạt chất công bố</li>
            <li>Không thử nghiệm trên động vật</li>
            <li>Tư vấn cùng chuyên viên da liễu</li>
          </ul>
        </div>
      </section>

      <!-- CATEGORIES SECTION -->
      <section class="py-16 sm:py-20 border-b border-border/60">
        <div class="page-container">
          <div class="sec-head">
            <h2>Chọn theo mục tiêu chăm sóc của làn da</h2>
            <a href="#/san-pham" class="sec-link">Xem tất cả sản phẩm <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i></a>
          </div>
          <div class="cat-grid">${renderCategoryCards()}</div>
        </div>
      </section>

      <!-- FEATURED PRODUCTS SECTION -->
      <section class="py-16 sm:py-24 border-b border-border/60 home-featured">
        <div class="page-container">
          <div class="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span class="inline-block px-3 py-1 rounded-full bg-secondary text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium mb-2">Công thức nổi bật</span>
            <h2 class="font-heading text-3xl sm:text-4xl text-foreground font-normal">
              Được chứng minh, được tin dùng
            </h2>
            <p class="text-sm text-muted-foreground mt-3 font-light">
              Những công thức có tỷ lệ quay lại cao nhất, được kiểm chứng thực tế qua hàng nghìn phác đồ điều trị.
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            ${featuredProducts.map(p => renderProductCard(p)).join('')}
          </div>

          <div class="text-center mt-12">
            <a href="#/san-pham" class="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border border-border bg-background hover:bg-secondary text-xs uppercase tracking-widest text-foreground font-medium transition shadow-sm">
              Xem toàn bộ 19 công thức
              <i data-lucide="arrow-right" class="w-4 h-4"></i>
            </a>
          </div>
        </div>
      </section>

      <!-- BRAND STORY SECTION -->
      <section id="cau-chuyen" class="story">
        <div class="page-container story-grid">
          <figure class="story-media">
            <div class="story-photo"><img src="assets/images/story.png" alt="Phòng khám TranAnh Skin" loading="lazy" /></div>
            <figcaption class="story-badge">
              <strong>2026</strong>
              <span>Phòng khám da liễu đầu tiên tại Sài Gòn</span>
            </figcaption>
          </figure>

          <div class="story-body">
            <h2>Mỗi công thức, một lý do khoa học</h2>
            <p class="story-lead">
              TranAnh Skin bắt đầu từ một phòng khám da liễu nhỏ, nơi các bác sĩ và dược sĩ lâm sàng nhận ra làn da người Việt cần những công thức được chứng minh trên chính nó, không phải những lời hứa quảng cáo.
            </p>

            <ul class="story-points">
              <li>
                <span class="story-ico"><i data-lucide="flask-conical" class="w-5 h-5"></i></span>
                <div><h3>Nồng độ hoạt chất công bố rõ</h3><p>Mỗi thành phần ghi cụ thể bao nhiêu phần trăm, bạn biết mình đang dùng gì.</p></div>
              </li>
              <li>
                <span class="story-ico"><i data-lucide="shield-check" class="w-5 h-5"></i></span>
                <div><h3>Dữ liệu an toàn đầy đủ</h3><p>Chỉ lên kệ khi có hồ sơ an toàn, phù hợp cả với da nhạy cảm.</p></div>
              </li>
              <li>
                <span class="story-ico"><i data-lucide="clipboard-check" class="w-5 h-5"></i></span>
                <div><h3>Kiểm nghiệm độc lập</h3><p>Danh mục được rà soát mỗi mùa, công thức nào không đạt sẽ rời kệ.</p></div>
              </li>
            </ul>

            <dl class="story-stats">
              <div><dt>100%</dt><dd>Minh bạch nồng độ</dd></div>
              <div><dt>5.5</dt><dd>Độ pH sinh lý</dd></div>
              <div><dt>24h</dt><dd>Tư vấn phản hồi</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <!-- 3-STEP ROUTINE SECTION -->
      <section id="nghi-thuc" class="py-16 sm:py-24 border-b border-border/60 bg-secondary/20">
        <div class="page-container">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div class="lg:col-span-6 space-y-8">
              <div>
                <span class="text-[11px] uppercase tracking-[0.25em] text-muted-foreground font-medium">Nghi thức hàng ngày</span>
                <h2 class="font-heading text-3xl sm:text-4xl text-foreground font-normal mt-1">
                  Ba bước, mỗi ngày, trên nền tảng khoa học
                </h2>
                <p class="text-sm text-muted-foreground mt-2 font-light">
                  Chăm sóc da không cần 10 bước phức tạp. Chỉ cần đúng hoạt chất, đúng thứ tự và đủ kiên trì.
                </p>
              </div>

              <div class="space-y-6">
                <!-- Step 1 -->
                <div class="flex gap-4 p-5 rounded-xl bg-background border border-border/70 shadow-sm transition hover:border-primary/50">
                  <span class="w-8 h-8 rounded-full bg-secondary text-foreground text-xs font-semibold flex items-center justify-center shrink-0">01</span>
                  <div>
                    <h3 class="text-base font-medium text-foreground">Làm sạch dịu nhẹ</h3>
                    <p class="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                      Sữa rửa mặt pH 5.5 giữ nguyên màng hydrolipid tự nhiên của da. Massage 60 giây với nước ấm, sáng và tối.
                    </p>
                  </div>
                </div>

                <!-- Step 2 -->
                <div class="flex gap-4 p-5 rounded-xl bg-background border border-border/70 shadow-sm transition hover:border-primary/50">
                  <span class="w-8 h-8 rounded-full bg-secondary text-foreground text-xs font-semibold flex items-center justify-center shrink-0">02</span>
                  <div>
                    <h3 class="text-base font-medium text-foreground">Điều trị chuyên sâu</h3>
                    <p class="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                      Hoạt chất đặc trị (Vitamin C, Retinal, BHA, Peptide) thoa trước, kem dưỡng phục hồi thoa sau. Chờ 30 giây giữa các lớp để da ổn định bề mặt.
                    </p>
                  </div>
                </div>

                <!-- Step 3 -->
                <div class="flex gap-4 p-5 rounded-xl bg-background border border-border/70 shadow-sm transition hover:border-primary/50">
                  <span class="w-8 h-8 rounded-full bg-secondary text-foreground text-xs font-semibold flex items-center justify-center shrink-0">03</span>
                  <div>
                    <h3 class="text-base font-medium text-foreground">Bảo vệ toàn diện</h3>
                    <p class="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                      Chống nắng phổ rộng SPF50+ PA++++ mỗi sáng, kể cả ngày râm mát hoặc làm việc trong phòng máy tính. Thoa lại sau mỗi 2–3 giờ khi ở ngoài trời.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div class="lg:col-span-6">
              <figure class="routine-media">
                <div class="routine-photo"><img src="assets/images/routine.png" alt="Nghi thức chăm sóc 3 bước" loading="lazy" /></div>
                <figcaption class="story-badge routine-badge">
                  <strong>3 bước</strong>
                  <span>Sáng và tối, chỉ cần đúng hoạt chất và đúng thứ tự</span>
                </figcaption>
              </figure>
            </div>
          </div>
        </div>
      </section>

      <!-- POSTS SECTION -->
      <section class="py-16 sm:py-24 border-b border-border/60">
        <div class="page-container">
          <div class="sec-head">
            <h2>Góc kiến thức da liễu</h2>
            <p>Bài viết ngắn gọn từ chuyên viên, giúp bạn hiểu hoạt chất trước khi chọn sản phẩm.</p>
          </div>
          <div class="post-grid">${renderHomePosts()}</div>
        </div>
      </section>

      <!-- TESTIMONIALS SECTION -->
      <section class="py-16 sm:py-24 border-b border-border/60">
        <div class="page-container">
          <div class="text-center max-w-xl mx-auto mb-12">
            <span class="text-[11px] uppercase tracking-[0.25em] text-muted-foreground font-medium">Đánh giá đã xác thực</span>
            <h2 class="font-heading text-3xl sm:text-4xl text-foreground font-normal mt-1">
              Kết quả trên làn da thật
            </h2>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="rv-card">
              <div class="space-y-3">
                <div class="flex text-amber-500 gap-1 text-xs">
                  <i data-lucide="star" class="w-4 h-4 fill-current"></i>
                  <i data-lucide="star" class="w-4 h-4 fill-current"></i>
                  <i data-lucide="star" class="w-4 h-4 fill-current"></i>
                  <i data-lucide="star" class="w-4 h-4 fill-current"></i>
                  <i data-lucide="star" class="w-4 h-4 fill-current"></i>
                </div>
                <p class="text-sm text-foreground/90 italic leading-relaxed">
                  “Da mình nhạy cảm và rất khó chiều, nhưng kem dưỡng ceramide của TranAnh Skin là thứ duy nhất không gây châm chích. Ba tuần là da ổn hẳn, mềm mịn không còn bong tróc.”
                </p>
              </div>
              <div class="pt-4 border-t border-border/60 rv-who"><img src="${(Store.getProducts().find(p=>p.slug==='kem-duong-phuc-hoi-ceramide')||{}).image||'assets/images/logo.png'}" alt="Sản phẩm Ngọc Anh đã dùng" loading="lazy" /><div><b>Ngọc Anh</b><span>Da khô, nhạy cảm · 28 tuổi</span></div></div>
            </div>

            <div class="rv-card">
              <div class="space-y-3">
                <div class="flex text-amber-500 gap-1 text-xs">
                  <i data-lucide="star" class="w-4 h-4 fill-current"></i>
                  <i data-lucide="star" class="w-4 h-4 fill-current"></i>
                  <i data-lucide="star" class="w-4 h-4 fill-current"></i>
                  <i data-lucide="star" class="w-4 h-4 fill-current"></i>
                  <i data-lucide="star" class="w-4 h-4 fill-current"></i>
                </div>
                <p class="text-sm text-foreground/90 italic leading-relaxed">
                  “Tinh chất vitamin C thấm nhanh, không dính, mùi rất nhẹ. Sáng hôm sau da đã thấy căng và sáng hơn rõ. Dùng được gần 1 lọ vết thâm mờ hẳn.”
                </p>
              </div>
              <div class="pt-4 border-t border-border/60 rv-who"><img src="${(Store.getProducts().find(p=>p.slug==='tinh-chat-vitamin-c-15')||{}).image||'assets/images/logo.png'}" alt="Sản phẩm Minh Thư đã dùng" loading="lazy" /><div><b>Minh Thư</b><span>Da hỗn hợp thiên dầu · 32 tuổi</span></div></div>
            </div>

            <div class="rv-card">
              <div class="space-y-3">
                <div class="flex text-amber-500 gap-1 text-xs">
                  <i data-lucide="star" class="w-4 h-4 fill-current"></i>
                  <i data-lucide="star" class="w-4 h-4 fill-current"></i>
                  <i data-lucide="star" class="w-4 h-4 fill-current"></i>
                  <i data-lucide="star" class="w-4 h-4 fill-current"></i>
                  <i data-lucide="star" class="w-4 h-4 fill-current"></i>
                </div>
                <p class="text-sm text-foreground/90 italic leading-relaxed">
                  “Đóng gói tinh tế, giao nhanh, và điều mình thích nhất là bảng thành phần ghi rõ ràng từng thứ, nồng độ bao nhiêu %. Rất đáng tin cậy.”
                </p>
              </div>
              <div class="pt-4 border-t border-border/60 rv-who"><img src="${(Store.getProducts().find(p=>p.slug==='sua-rua-mat-salicylic-acid-2')||{}).image||'assets/images/logo.png'}" alt="Sản phẩm Hà Linh đã dùng" loading="lazy" /><div><b>Hà Linh</b><span>Da dầu mụn · 25 tuổi</span></div></div>
            </div>
          </div>
        </div>
      </section>
    `;

    renderIcons();
  }

  function renderCategoryCards() {
    const all = Store.getProducts();
    const categories = [
      { name: 'Chăm sóc da', subtitle: 'Tinh chất · Kem dưỡng · Mặt nạ', query: 'Chăm sóc da' },
      { name: 'Làm sạch', subtitle: 'Sữa rửa mặt · Tẩy trang', query: 'Làm sạch' },
      { name: 'Chống nắng', subtitle: 'Bảo vệ phổ rộng mỗi ngày', query: 'Chống nắng' },
      { name: 'Trang điểm', subtitle: 'Son · Nền · Má', query: 'Trang điểm' }
    ];
    return categories.map(cat => {
      const items = all.filter(p => p.category === cat.query && p.image);
      const cover = items.length ? items[0].image : 'assets/images/hero-banner.png';
      return `
      <a href="#/san-pham?category=${encodeURIComponent(cat.query)}" class="cat-card">
        <img src="${cover}" alt="${cat.name}" loading="lazy" />
        <span class="cat-count">${items.length} sản phẩm</span>
        <div class="cat-card-body"><h3>${cat.name}</h3><p>${cat.subtitle}</p></div>
      </a>`;
    }).join('');
  }

  function renderHomePosts() {
    const all = Store.getProducts();
    const pick = (slug, i) => (all.find(p => p.slug === slug) || all[i] || {}).image || 'assets/images/hero-banner.png';
    const posts = [
      { slug: 'vitamin-c-sang-hay-toi', img: pick('tinh-chat-vitamin-c-15', 0), meta: 'Hoạt chất · 5 phút đọc', title: 'Vitamin C 15%: dùng sáng hay tối để da sáng đều hơn?', text: 'Thứ tự thoa, nồng độ phù hợp và lý do vitamin C luôn đi cùng chống nắng.' },
      { slug: 'ceramide-phuc-hoi-hang-rao', img: pick('kem-duong-phuc-hoi-ceramide', 1), meta: 'Da nhạy cảm · 4 phút đọc', title: 'Ceramide giúp phục hồi hàng rào bảo vệ da như thế nào', text: 'Dấu hiệu da tổn thương và cách xây lại nền da trong ba tuần.' },
      { slug: 'spf50-trong-nha', img: pick('kem-chong-nang-pho-rong-spf50', 2), meta: 'Chống nắng · 3 phút đọc', title: 'SPF50+ PA++++ có cần thoa lại khi ngồi trong nhà?', text: 'Ánh sáng xanh, cửa kính và lượng kem chống nắng đúng cho cả khuôn mặt.' }
    ];
    return posts.map(p => `
      <a href="#/bai-viet/${p.slug}" class="post-card">
        <div class="post-img"><img src="${p.img}" alt="${p.title}" loading="lazy" /></div>
        <div><p class="post-meta">${p.meta}</p><h3>${p.title}</h3><p style="margin-top:.5rem">${p.text}</p></div>
      </a>`).join('');
  }

  function renderProductCard(p) {
    return `
      <div class="group relative rounded-xl border border-border/70 bg-background overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all duration-300 hover:border-border">
        <a href="#/san-pham/${p.slug}" class="block relative aspect-[4/5] bg-secondary/30 overflow-hidden">
          <img src="${p.image}" alt="${p.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
          
          <!-- Badges -->
          <div class="absolute top-3 left-3 flex flex-col gap-1">
            ${p.is_new ? '<span class="px-2 py-0.5 rounded bg-foreground text-background text-[10px] font-medium uppercase tracking-wider">Mới</span>' : ''}
            ${p.compare_price ? '<span class="px-2 py-0.5 rounded bg-primary text-foreground text-[10px] font-medium tracking-wider">Ưu đãi</span>' : ''}
          </div>

          <!-- Quick Add Button -->
          <button onclick="event.preventDefault(); Store.addToCart(Store.getProductById('${p.id}'), 1)" title="Thêm vào giỏ" class="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-background/90 text-foreground border border-border shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-foreground hover:text-background">
            <i data-lucide="plus" class="w-4 h-4"></i>
          </button>
        </a>

        <div class="p-4 flex-1 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between gap-2 text-[11px] text-muted-foreground mb-1">
              <span class="uppercase tracking-wider truncate">${p.category}</span>
              <span class="flex items-center gap-1 text-amber-500 font-medium">
                <i data-lucide="star" class="w-3 h-3 fill-current"></i>
                ${p.rating}
              </span>
            </div>

            <a href="#/san-pham/${p.slug}" class="font-heading text-lg text-foreground font-medium hover:text-primary transition line-clamp-1">
              ${p.name}
            </a>

            <p class="text-xs text-muted-foreground line-clamp-1 mt-0.5">${p.tagline || ''}</p>

            <!-- Ingredients pill -->
            ${p.ingredients && p.ingredients.length > 0 ? `
              <div class="mt-2 flex flex-wrap gap-1">
                <span class="inline-block text-[10px] px-1.5 py-0.5 bg-secondary text-muted-foreground rounded">${p.ingredients[0]}</span>
                ${p.ingredients[1] ? `<span class="inline-block text-[10px] px-1.5 py-0.5 bg-secondary text-muted-foreground rounded">${p.ingredients[1]}</span>` : ''}
              </div>
            ` : ''}
          </div>

          <div class="pt-3 mt-3 border-t border-border/50 flex items-center justify-between">
            <div>
              <span class="text-sm font-semibold text-foreground">${Store.formatMoney(p.price)}</span>
              ${p.compare_price ? `<span class="text-xs text-muted-foreground line-through ml-1.5">${Store.formatMoney(p.compare_price)}</span>` : ''}
            </div>
            <span class="text-[11px] text-muted-foreground">${p.volume || ''}</span>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================
  // VIEW: SHOP / CATALOG PAGE
  // ==========================================
  function renderShopPage() {
    const container = document.getElementById('app-content');
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const activeCategory = urlParams.get('category') || 'all';
    const searchQuery = urlParams.get('search') || '';
    const skinFilter = urlParams.get('skin') || 'all';
    const sortBy = urlParams.get('sort') || 'default';

    let allProducts = Store.getProducts();

    // Filter by Category
    if (activeCategory !== 'all') {
      allProducts = allProducts.filter(p => p.category.toLowerCase() === activeCategory.toLowerCase());
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      allProducts = allProducts.filter(p => 
        p.name.toLowerCase().includes(q) ||
        (p.tagline && p.tagline.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.ingredients && p.ingredients.some(ing => ing.toLowerCase().includes(q)))
      );
    }

    // Filter by Skin Type
    if (skinFilter !== 'all') {
      allProducts = allProducts.filter(p => 
        p.skin_types && (p.skin_types.includes(skinFilter) || p.skin_types.includes('Mọi loại da'))
      );
    }

    // Sort
    if (sortBy === 'price-asc') {
      allProducts.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      allProducts.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      allProducts.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'new') {
      allProducts.sort((a, b) => (b.is_new ? 1 : 0) - (a.is_new ? 1 : 0));
    }

    const categories = ['all', 'Chăm sóc da', 'Làm sạch', 'Chống nắng', 'Trang điểm'];

    container.innerHTML = `
      <div class="page-container py-10 sm:py-16">
        <!-- Breadcrumb -->
        <nav class="flex items-center gap-2 text-xs text-muted-foreground mb-6">
          <a href="#/" class="hover:text-foreground transition">Trang chủ</a>
          <span>/</span>
          <span class="text-foreground font-medium">Bộ sưu tập sản phẩm</span>
        </nav>

        <!-- Page Header -->
        <div class="max-w-2xl mb-10">
          <p class="text-[11px] uppercase tracking-[0.25em] text-muted-foreground font-medium">Danh mục tuyển chọn</p>
          <h1 class="font-heading text-3xl sm:text-5xl text-foreground font-normal mt-1">
            Mọi thứ làn da bạn cần, trong một nơi
          </h1>
          <p class="text-sm text-muted-foreground mt-2 font-light">
            Tuyển chọn 19 công thức với nồng độ hoạt chất công bố rõ ràng, được kiểm chứng lâm sàng cho khí hậu và làn da Việt.
          </p>
        </div>

        <!-- Filter Controls -->
        <div class="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center py-4 border-y border-border/60 mb-8">
          <!-- Category Tabs -->
          <div class="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 scrollbar-none">
            ${categories.map(cat => {
              const label = cat === 'all' ? 'Tất cả' : cat;
              const isActive = activeCategory === cat;
              return `
                <button onclick="App.setShopFilter('category', '${cat}')" class="px-4 py-2 rounded-full text-xs font-medium tracking-wide whitespace-nowrap transition ${
                  isActive
                    ? 'bg-foreground text-background shadow-sm'
                    : 'bg-secondary hover:bg-secondary/80 text-foreground border border-border/60'
                }">
                  ${label}
                </button>
              `;
            }).join('')}
          </div>

          <!-- Secondary Filters & Search -->
          <div class="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <!-- Search Input -->
            <div class="relative flex-1 sm:w-64">
              <input type="text" id="shop-search-input" value="${searchQuery}" placeholder="Tìm theo tên, hoạt chất..." onkeydown="if(event.key==='Enter') App.setShopFilter('search', this.value)" class="w-full pl-9 pr-8 py-2 rounded-full border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary" />
              <i data-lucide="search" class="w-4 h-4 text-muted-foreground absolute left-3 top-2.5"></i>
              ${searchQuery ? `<button onclick="App.setShopFilter('search', '')" class="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"><i data-lucide="x" class="w-3.5 h-3.5"></i></button>` : ''}
            </div>

            <!-- Skin Type Filter -->
            <select onchange="App.setShopFilter('skin', this.value)" class="px-3.5 py-2 rounded-full border border-border bg-background text-xs text-foreground focus:outline-none">
              <option value="all" ${skinFilter === 'all' ? 'selected' : ''}>Mọi loại da</option>
              <option value="Da dầu" ${skinFilter === 'Da dầu' ? 'selected' : ''}>Da dầu</option>
              <option value="Da khô" ${skinFilter === 'Da khô' ? 'selected' : ''}>Da khô</option>
              <option value="Da mụn" ${skinFilter === 'Da mụn' ? 'selected' : ''}>Da mụn</option>
              <option value="Da nhạy cảm" ${skinFilter === 'Da nhạy cảm' ? 'selected' : ''}>Da nhạy cảm</option>
              <option value="Da hỗn hợp" ${skinFilter === 'Da hỗn hợp' ? 'selected' : ''}>Da hỗn hợp</option>
            </select>

            <!-- Sort Select -->
            <select onchange="App.setShopFilter('sort', this.value)" class="px-3.5 py-2 rounded-full border border-border bg-background text-xs text-foreground focus:outline-none">
              <option value="default" ${sortBy === 'default' ? 'selected' : ''}>Thứ tự mặc định</option>
              <option value="price-asc" ${sortBy === 'price-asc' ? 'selected' : ''}>Giá: Thấp đến Cao</option>
              <option value="price-desc" ${sortBy === 'price-desc' ? 'selected' : ''}>Giá: Cao đến Thấp</option>
              <option value="rating" ${sortBy === 'rating' ? 'selected' : ''}>Đánh giá cao nhất</option>
              <option value="new" ${sortBy === 'new' ? 'selected' : ''}>Sản phẩm mới</option>
            </select>
          </div>
        </div>

        <!-- Result Info -->
        <div class="flex items-center justify-between text-xs text-muted-foreground mb-6">
          <span>Tìm thấy <strong>${allProducts.length}</strong> sản phẩm phù hợp</span>
          ${(activeCategory !== 'all' || searchQuery || skinFilter !== 'all') ? `
            <button onclick="window.location.hash='#/san-pham'" class="text-primary hover:underline flex items-center gap-1">
              <i data-lucide="rotate-ccw" class="w-3 h-3"></i>
              Xoá bộ lọc
            </button>
          ` : ''}
        </div>

        <!-- Products Grid -->
        ${allProducts.length === 0 ? `
          <div class="py-20 text-center border rounded-2xl bg-secondary/20">
            <i data-lucide="search-x" class="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40"></i>
            <h3 class="text-base font-medium text-foreground">Không tìm thấy sản phẩm nào</h3>
            <p class="text-xs text-muted-foreground mt-1">Vui lòng thử tìm kiếm với từ khoá khác hoặc xoá bộ lọc</p>
            <button onclick="window.location.hash='#/san-pham'" class="mt-4 px-5 py-2 rounded-full bg-foreground text-background text-xs uppercase tracking-widest font-medium">
              Xem tất cả sản phẩm
            </button>
          </div>
        ` : `
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            ${allProducts.map(p => renderProductCard(p)).join('')}
          </div>
        `}
      </div>
    `;

    renderIcons();
  }

  function setShopFilter(key, value) {
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    if (value && value !== 'all') {
      urlParams.set(key, value);
    } else {
      urlParams.delete(key);
    }
    const query = urlParams.toString();
    window.location.hash = query ? `#/san-pham?${query}` : '#/san-pham';
  }

  // ==========================================
  // VIEW: PRODUCT DETAIL PAGE
  // ==========================================
  function renderProductDetailPage(slug) {
    const container = document.getElementById('app-content');
    const product = Store.getProductBySlug(slug);

    if (!product) {
      container.innerHTML = `
        <div class="page-container py-24 text-center">
          <h2 class="text-2xl font-heading text-foreground">Không tìm thấy sản phẩm</h2>
          <p class="text-sm text-muted-foreground mt-2">Sản phẩm này không tồn tại hoặc đã ngừng kinh doanh.</p>
          <a href="#/san-pham" class="mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-foreground text-background text-xs uppercase tracking-widest">
            Quay lại cửa hàng
          </a>
        </div>
      `;
      return;
    }

    const reviews = Store.getReviews(product.slug);
    const relatedProducts = Store.getProducts().filter(p => p.category === product.category && p.slug !== product.slug).slice(0, 4);

    container.innerHTML = `
      <div class="page-container py-10 sm:py-16">
        <!-- Breadcrumb -->
        <nav class="flex items-center gap-2 text-xs text-muted-foreground mb-8">
          <a href="#/" class="hover:text-foreground transition">Trang chủ</a>
          <span>/</span>
          <a href="#/san-pham" class="hover:text-foreground transition">Bộ sưu tập</a>
          <span>/</span>
          <a href="#/san-pham?category=${encodeURIComponent(product.category)}" class="hover:text-foreground transition">${product.category}</a>
          <span>/</span>
          <span class="text-foreground font-medium truncate max-w-[200px] sm:max-w-none">${product.name}</span>
        </nav>

        <!-- Product Hero Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-20">
          <!-- Left: Big Product Image -->
          <div class="lg:col-span-6">
            <div class="sticky top-24">
              <div class="relative overflow-hidden rounded-2xl border border-border/80 bg-secondary/30 aspect-[4/5] shadow-sm">
                <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover" />
                
                <div class="absolute top-4 left-4 flex flex-col gap-1.5">
                  ${product.is_new ? '<span class="px-2.5 py-1 rounded bg-foreground text-background text-[11px] font-medium uppercase tracking-wider">Mới</span>' : ''}
                  ${product.compare_price ? `<span class="px-2.5 py-1 rounded bg-primary text-foreground text-[11px] font-medium tracking-wider">Giảm ${Math.round((1 - product.price / product.compare_price) * 100)}%</span>` : ''}
                </div>
              </div>

              <!-- Product Features Highlights -->
              <div class="grid grid-cols-3 gap-3 mt-4 text-center">
                <div class="p-3 rounded-xl bg-secondary/40 border border-border/60">
                  <i data-lucide="shield-check" class="w-4 h-4 mx-auto text-primary mb-1"></i>
                  <p class="text-[11px] font-medium text-foreground">Chính hãng 100%</p>
                  <p class="text-[10px] text-muted-foreground">Có tem kiểm định</p>
                </div>
                <div class="p-3 rounded-xl bg-secondary/40 border border-border/60">
                  <i data-lucide="truck" class="w-4 h-4 mx-auto text-primary mb-1"></i>
                  <p class="text-[11px] font-medium text-foreground">Giao toàn quốc</p>
                  <p class="text-[10px] text-muted-foreground">Freeship từ 500k</p>
                </div>
                <div class="p-3 rounded-xl bg-secondary/40 border border-border/60">
                  <i data-lucide="rotate-ccw" class="w-4 h-4 mx-auto text-primary mb-1"></i>
                  <p class="text-[11px] font-medium text-foreground">Đổi trả 7 ngày</p>
                  <p class="text-[10px] text-muted-foreground">Nếu kích ứng da</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Right: Product Info & Buy Controls -->
          <div class="lg:col-span-6 space-y-6">
            <div>
              <span class="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">${product.category} · ${product.volume || ''}</span>
              <h1 class="font-heading text-3xl sm:text-4xl text-foreground font-normal mt-1 leading-tight">
                ${product.name}
              </h1>
              ${product.tagline ? `<p class="text-sm text-primary font-medium mt-1">${product.tagline}</p>` : ''}
              
              <!-- Rating & Reviews Count -->
              <div class="flex items-center gap-3 mt-3">
                <div class="flex items-center gap-1 text-amber-500 text-sm">
                  <i data-lucide="star" class="w-4 h-4 fill-current"></i>
                  <span class="font-semibold text-foreground">${product.rating}</span>
                </div>
                <span class="text-xs text-muted-foreground">(${product.reviews_count || reviews.length} đánh giá kiểm chứng)</span>
                <span class="text-xs text-muted-foreground">·</span>
                <span class="text-xs ${product.stock > 0 ? 'text-emerald-600' : 'text-destructive'} font-medium">
                  ${product.stock > 0 ? `Còn hàng (${product.stock} sản phẩm)` : 'Tạm hết hàng'}
                </span>
              </div>
            </div>

            <!-- Price -->
            <div class="p-4 rounded-xl bg-secondary/30 border border-border/60 flex items-baseline gap-3">
              <span class="text-2xl sm:text-3xl font-bold text-foreground">${Store.formatMoney(product.price)}</span>
              ${product.compare_price ? `
                <span class="text-sm text-muted-foreground line-through">${Store.formatMoney(product.compare_price)}</span>
                <span class="text-xs font-semibold text-destructive">Tiết kiệm ${Store.formatMoney(product.compare_price - product.price)}</span>
              ` : ''}
            </div>

            <!-- Description -->
            <div class="text-sm text-muted-foreground leading-relaxed font-light">
              <p>${product.description}</p>
            </div>

            <!-- Skin Types Tags -->
            ${product.skin_types && product.skin_types.length > 0 ? `
              <div>
                <label class="block text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">Loại da khuyên dùng:</label>
                <div class="flex flex-wrap gap-2">
                  ${product.skin_types.map(st => `<span class="px-3 py-1 rounded-full bg-secondary text-xs text-foreground font-medium border border-border/60">${st}</span>`).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Quantity & Actions -->
            <div class="space-y-4 pt-4 border-t border-border/60">
              <div class="flex items-center gap-4">
                <label class="text-xs uppercase tracking-wider text-muted-foreground font-medium">Số lượng:</label>
                <div class="flex items-center border border-border rounded-lg bg-background">
                  <button onclick="App.adjustDetailQty(-1)" class="w-9 h-9 flex items-center justify-center hover:bg-secondary transition text-sm">
                    <i data-lucide="minus" class="w-3.5 h-3.5"></i>
                  </button>
                  <input type="number" id="detail-qty" value="1" min="1" max="${product.stock || 99}" class="w-12 text-center text-sm font-semibold border-none focus:outline-none bg-transparent" readonly />
                  <button onclick="App.adjustDetailQty(1)" class="w-9 h-9 flex items-center justify-center hover:bg-secondary transition text-sm">
                    <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button onclick="App.addDetailToCart('${product.id}', false)" class="w-full py-3.5 px-6 rounded-full border border-foreground bg-transparent hover:bg-secondary text-foreground text-xs uppercase tracking-widest font-semibold transition flex items-center justify-center gap-2">
                  <i data-lucide="shopping-bag" class="w-4 h-4"></i>
                  Thêm vào giỏ
                </button>
                <button onclick="App.addDetailToCart('${product.id}', true)" class="w-full py-3.5 px-6 rounded-full bg-foreground hover:bg-foreground/90 text-background text-xs uppercase tracking-widest font-semibold transition shadow-md flex items-center justify-center gap-2">
                  <i data-lucide="credit-card" class="w-4 h-4"></i>
                  Mua ngay
                </button>
              </div>
            </div>

            <!-- Accordion Details (Ingredients, How to Use, Policies) -->
            <div class="pt-6 border-t border-border/60 space-y-3">
              <!-- Active Ingredients -->
              <details class="group border border-border/70 rounded-xl p-4 bg-background transition" open>
                <summary class="flex items-center justify-between font-medium text-sm text-foreground cursor-pointer list-none">
                  <span class="flex items-center gap-2">
                    <i data-lucide="flask-conical" class="w-4 h-4 text-primary"></i>
                    Bảng hoạt chất chính (Active Ingredients)
                  </span>
                  <i data-lucide="chevron-down" class="w-4 h-4 text-muted-foreground group-open:rotate-180 transition-transform"></i>
                </summary>
                <div class="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed pt-2 border-t border-border/40">
                  <div class="flex flex-wrap gap-1.5 mb-2">
                    ${(product.ingredients || []).map(ing => `<span class="px-2.5 py-1 rounded bg-secondary text-foreground text-xs font-medium border border-border/50">${ing}</span>`).join('')}
                  </div>
                  <p class="text-xs text-muted-foreground mt-2">
                    Mọi nồng độ hoạt chất đều được kiểm định độc lập, không chứa cồn khô gây hại, không hương liệu nhân tạo gây kích ứng.
                  </p>
                </div>
              </details>

              <!-- How to Use -->
              <details class="group border border-border/70 rounded-xl p-4 bg-background transition">
                <summary class="flex items-center justify-between font-medium text-sm text-foreground cursor-pointer list-none">
                  <span class="flex items-center gap-2">
                    <i data-lucide="sparkles" class="w-4 h-4 text-primary"></i>
                    Cách sử dụng chuẩn phác đồ
                  </span>
                  <i data-lucide="chevron-down" class="w-4 h-4 text-muted-foreground group-open:rotate-180 transition-transform"></i>
                </summary>
                <div class="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed pt-2 border-t border-border/40">
                  <p>${product.how_to_use || 'Dùng sau bước làm sạch, massage nhẹ nhàng để dưỡng chất thẩm thấu hoàn toàn vào da.'}</p>
                </div>
              </details>

              <!-- Shipping & Returns -->
              <details class="group border border-border/70 rounded-xl p-4 bg-background transition">
                <summary class="flex items-center justify-between font-medium text-sm text-foreground cursor-pointer list-none">
                  <span class="flex items-center gap-2">
                    <i data-lucide="package-check" class="w-4 h-4 text-primary"></i>
                    Vận chuyển & Đổi trả bảo hành
                  </span>
                  <i data-lucide="chevron-down" class="w-4 h-4 text-muted-foreground group-open:rotate-180 transition-transform"></i>
                </summary>
                <div class="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed pt-2 border-t border-border/40 space-y-1">
                  <p>• Giao hàng hỏa tốc trong 2-4h tại Hà Nội & TP. Hồ Chí Minh.</p>
                  <p>• Miễn phí vận chuyển cho tất cả đơn hàng từ 500.000 đ.</p>
                  <p>• Hỗ trợ đổi trả miễn phí trong 7 ngày nếu sản phẩm gây kích ứng da có xác nhận chuyên viên.</p>
                </div>
              </details>
            </div>
          </div>
        </div>

        <!-- Reviews Section -->
        <div class="py-12 border-t border-border/60">
          <div class="max-w-4xl mx-auto">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h3 class="font-heading text-2xl sm:text-3xl text-foreground font-normal">Đánh giá từ khách hàng</h3>
                <p class="text-xs text-muted-foreground mt-0.5">${reviews.length} đánh giá thực tế trên làn da người dùng</p>
              </div>
              <button onclick="document.getElementById('write-review-box').classList.toggle('hidden')" class="px-5 py-2.5 rounded-full border border-border bg-background hover:bg-secondary text-xs font-medium uppercase tracking-wider text-foreground transition">
                Viết đánh giá của bạn
              </button>
            </div>

            <!-- Write Review Form (Collapsible) -->
            <div id="write-review-box" class="hidden p-6 rounded-2xl border border-border bg-secondary/30 mb-8 space-y-4">
              <h4 class="text-sm font-semibold text-foreground">Chia sẻ cảm nhận về ${product.name}</h4>
              <form onsubmit="App.handleReviewSubmit(event, '${product.slug}')" class="space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label class="block text-xs font-medium mb-1">Họ tên của bạn *</label>
                    <input type="text" name="name" required placeholder="Ví dụ: Hoàng Yến" class="w-full px-3.5 py-2 rounded-lg border border-border bg-background text-xs focus:outline-none" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium mb-1">Loại da & Độ tuổi</label>
                    <input type="text" name="skin_type" placeholder="Ví dụ: Da dầu · 26 tuổi" class="w-full px-3.5 py-2 rounded-lg border border-border bg-background text-xs focus:outline-none" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium mb-1">Số sao đánh giá</label>
                    <select name="rating" class="w-full px-3.5 py-2 rounded-lg border border-border bg-background text-xs focus:outline-none">
                      <option value="5">5 sao - Rất hài lòng</option>
                      <option value="4">4 sao - Hài lòng</option>
                      <option value="3">3 sao - Bình thường</option>
                      <option value="2">2 sao - Chưa ưng ý</option>
                      <option value="1">1 sao - Không hài lòng</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-medium mb-1">Tiêu đề nhận xét</label>
                  <input type="text" name="title" placeholder="Tóm tắt cảm nhận chính của bạn..." class="w-full px-3.5 py-2 rounded-lg border border-border bg-background text-xs focus:outline-none" />
                </div>
                <div>
                  <label class="block text-xs font-medium mb-1">Chi tiết nhận xét *</label>
                  <textarea name="comment" required rows="3" placeholder="Chia sẻ về độ thẩm thấu, mùi hương, cảm giác trên da sau vài tuần sử dụng..." class="w-full px-3.5 py-2 rounded-lg border border-border bg-background text-xs focus:outline-none"></textarea>
                </div>
                <div class="flex justify-end gap-2">
                  <button type="button" onclick="document.getElementById('write-review-box').classList.add('hidden')" class="px-4 py-2 rounded-full border border-border text-xs">Huỷ</button>
                  <button type="submit" class="px-6 py-2 rounded-full bg-foreground text-background text-xs font-medium uppercase tracking-wider">Gửi đánh giá</button>
                </div>
              </form>
            </div>

            <!-- Reviews List -->
            <div class="space-y-4">
              ${reviews.length === 0 ? `
                <p class="text-sm text-muted-foreground text-center py-8">Chưa có đánh giá nào cho sản phẩm này. Hãy là người đầu tiên chia sẻ cảm nhận!</p>
              ` : reviews.map(rev => `
                <div class="p-5 rounded-xl border border-border/60 bg-background space-y-2">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-semibold text-foreground">${rev.name}</span>
                      <span class="text-xs text-muted-foreground">· ${rev.skin_type || ''}</span>
                    </div>
                    <span class="text-[11px] text-muted-foreground">${rev.date || ''}</span>
                  </div>
                  <div class="flex items-center text-amber-500 text-xs gap-1">
                    ${Array.from({ length: rev.rating || 5 }).map(() => '<i data-lucide="star" class="w-3.5 h-3.5 fill-current"></i>').join('')}
                    ${rev.title ? `<strong class="text-foreground ml-2">${rev.title}</strong>` : ''}
                  </div>
                  <p class="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1 font-light">${rev.comment}</p>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Related Products -->
        ${relatedProducts.length > 0 ? `
          <div class="pt-16 border-t border-border/60">
            <div class="text-center mb-10">
              <span class="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">Gợi ý phác đồ</span>
              <h3 class="font-heading text-2xl sm:text-3xl text-foreground font-normal mt-1">Sản phẩm cùng danh mục</h3>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              ${relatedProducts.map(p => renderProductCard(p)).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;

    renderIcons();
  }

  function adjustDetailQty(delta) {
    const input = document.getElementById('detail-qty');
    if (input) {
      const current = parseInt(input.value) || 1;
      const next = Math.max(1, current + delta);
      input.value = next;
    }
  }

  function addDetailToCart(productId, buyNow = false) {
    const product = Store.getProductById(productId);
    const qtyInput = document.getElementById('detail-qty');
    const qty = qtyInput ? parseInt(qtyInput.value) || 1 : 1;

    if (product) {
      if (!Store.addToCart(product, qty)) return;
      if (buyNow) {
        window.location.hash = '#/gio-hang';
      } else {
        openCartDrawer();
      }
    }
  }

  function handleReviewSubmit(e, productSlug) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    Store.addReview({
      product_slug: productSlug,
      name: formData.get('name'),
      skin_type: formData.get('skin_type'),
      rating: parseInt(formData.get('rating')),
      title: formData.get('title'),
      comment: formData.get('comment')
    });

    renderProductDetailPage(productSlug);
  }

  // ==========================================
  // VIEW: CART & CHECKOUT PAGE
  // ==========================================
  function renderCartPage() {
    const container = document.getElementById('app-content');
    const summary = Store.getCartSummary();

    if (summary.items.length === 0) {
      container.innerHTML = `
        <div class="page-container py-24 text-center">
          <div class="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-5">
            <i data-lucide="shopping-bag" class="w-10 h-10 text-muted-foreground opacity-40"></i>
          </div>
          <h1 class="font-heading text-3xl text-foreground">Giỏ hàng đang trống</h1>
          <p class="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
            Bạn chưa chọn công thức dược mỹ phẩm nào. Hãy khám phá danh mục để tìm sản phẩm phù hợp với làn da của bạn.
          </p>
          <a href="#/san-pham" class="mt-8 inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-foreground text-background text-xs uppercase tracking-widest font-medium hover:bg-foreground/90 transition shadow-sm">
            Xem sản phẩm
            <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </a>
        </div>
      `;
      renderIcons();
      return;
    }

    const cartUser = window.Auth ? Auth.currentUser() : null;
    const walletBalance = cartUser ? Store.getBalance(cartUser.id) : 0;
    // Thanh toán bằng Ví TranAnh tạm tắt: số dư ví lưu trên trình duyệt nên chưa an toàn khi bán đa thiết bị
    const walletEnough = false;
    const prefillName = cartUser && cartUser.role !== 'admin'
      ? String(cartUser.name || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
      : '';

    container.innerHTML = `
      <div class="page-container py-10 sm:py-16">
        <!-- Breadcrumb -->
        <nav class="flex items-center gap-2 text-xs text-muted-foreground mb-8">
          <a href="#/" class="hover:text-foreground transition">Trang chủ</a>
          <span>/</span>
          <span class="text-foreground font-medium">Giỏ hàng & Thanh toán</span>
        </nav>

        <h1 class="font-heading text-3xl sm:text-4xl text-foreground font-normal mb-8">
          Giỏ hàng & Đặt hàng (${summary.count} sản phẩm)
        </h1>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <!-- Left: Cart Items List & Customer Form -->
          <div class="lg:col-span-7 space-y-8">
            <!-- Items Table -->
            <div class="border border-border/70 rounded-2xl bg-background overflow-hidden p-6 shadow-sm">
              <h2 class="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                <i data-lucide="package" class="w-4 h-4 text-primary"></i>
                Danh sách sản phẩm đã chọn
              </h2>

              <div class="divide-y divide-border/60">
                ${summary.items.map(item => `
                  <div class="py-4 flex gap-4 items-center">
                    <img src="${item.image}" alt="${item.name}" class="w-16 h-20 object-cover rounded-lg bg-secondary shrink-0 border border-border/40" />
                    <div class="flex-1 min-w-0">
                      <a href="#/san-pham/${item.slug}" class="text-sm font-medium text-foreground hover:text-primary transition truncate block">${item.name}</a>
                      <p class="text-xs text-muted-foreground mt-0.5">${item.volume || ''} · ${item.category || ''}</p>
                      <p class="text-sm font-semibold text-foreground mt-1">${Store.formatMoney(item.price)}</p>
                    </div>

                    <!-- Quantity controls -->
                    <div class="flex items-center border border-border rounded-lg bg-secondary/30">
                      <button onclick="Store.updateQuantity('${item.id}', ${item.quantity - 1})" class="w-8 h-8 flex items-center justify-center hover:bg-secondary transition text-xs">
                        <i data-lucide="minus" class="w-3 h-3"></i>
                      </button>
                      <span class="w-8 text-center text-xs font-semibold">${item.quantity}</span>
                      <button onclick="Store.updateQuantity('${item.id}', ${item.quantity + 1})" class="w-8 h-8 flex items-center justify-center hover:bg-secondary transition text-xs">
                        <i data-lucide="plus" class="w-3 h-3"></i>
                      </button>
                    </div>

                    <!-- Subtotal & Delete -->
                    <div class="text-right pl-2">
                      <p class="text-sm font-bold text-foreground">${Store.formatMoney(item.price * item.quantity)}</p>
                      <button onclick="Store.removeFromCart('${item.id}')" class="text-xs text-muted-foreground hover:text-destructive transition mt-1">
                        Xoá
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Customer Shipping Info Form -->
            <div class="border border-border/70 rounded-2xl bg-background p-6 shadow-sm">
              <h2 class="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                <i data-lucide="map-pin" class="w-4 h-4 text-primary"></i>
                Thông tin nhận hàng
              </h2>

              <form id="checkout-form" onsubmit="App.handleCheckout(event)" class="space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-medium text-foreground mb-1.5">Họ và tên người nhận <span class="text-destructive">*</span></label>
                    <input type="text" id="cust-name" required value="${prefillName}" placeholder="Nguyễn Văn A" class="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-foreground mb-1.5">Số điện thoại <span class="text-destructive">*</span></label>
                    <input type="tel" id="cust-phone" required placeholder="0912 345 678" class="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-medium text-foreground mb-1.5">Địa chỉ giao hàng (Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/TP) <span class="text-destructive">*</span></label>
                  <input type="text" id="cust-address" required placeholder="Ví dụ: 123 Nguyễn Thị Minh Khai, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh" class="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>

                <div>
                  <label class="block text-xs font-medium text-foreground mb-1.5">Ghi chú giao hàng (tuỳ chọn)</label>
                  <textarea id="cust-notes" rows="2" placeholder="Ví dụ: Giao giờ hành chính, gọi điện trước khi đến..." class="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"></textarea>
                </div>

                <!-- Payment Method Selection -->
                <div class="pt-4 border-t border-border/60">
                  <label class="block text-xs font-medium text-foreground mb-2">Phương thức thanh toán <span class="text-destructive">*</span></label>
                  <div class="grid grid-cols-1 gap-3">
                    <label style="display:none" class="flex items-start gap-3 p-3.5 rounded-xl border ${walletEnough ? 'border-2 border-primary bg-primary/5' : 'border-border/80 bg-secondary/30 opacity-80'} cursor-pointer hover:border-primary transition">
                      <input type="radio" name="payment_method" value="Wallet" ${walletEnough ? 'checked' : 'disabled'} class="text-primary focus:ring-0 mt-0.5" />
                      <div class="flex-1">
                        <div class="flex items-center justify-between gap-2">
                          <p class="text-xs font-semibold text-foreground">Ví TranAnh</p>
                          <span class="text-xs font-semibold text-foreground">${Store.formatMoney(walletBalance)}</span>
                        </div>
                        ${walletEnough
                          ? '<p class="text-[10px] text-muted-foreground mt-0.5">Trừ trực tiếp vào số dư ví của tài khoản bạn, đơn được xác nhận ngay.</p>'
                          : `<p class="text-[10px] text-destructive mt-0.5">Số dư chưa đủ (thiếu ${Store.formatMoney(summary.total - walletBalance)}). <a href="#/vi" class="underline font-medium">Nạp thêm vào ví</a></p>`}
                      </div>
                    </label>

                    <label class="flex items-start gap-3 p-3.5 rounded-xl border ${walletEnough ? 'border-border/80 bg-secondary/30' : 'border-2 border-primary bg-primary/5'} cursor-pointer hover:border-primary transition">
                      <input type="radio" name="payment_method" value="VietQR" ${walletEnough ? '' : 'checked'} class="text-primary focus:ring-0 mt-0.5" />
                      <div>
                        <div class="flex items-center gap-1.5">
                          <p class="text-xs font-semibold text-foreground">Chuyển khoản QR Ngân hàng</p>
                        </div>
                        <p class="text-[10px] text-muted-foreground mt-0.5">Hiện mã QR STK của shop. Cửa hàng đối chiếu và xác nhận đơn sau khi nhận tiền.</p>
                      </div>
                    </label>

                    <label class="flex items-start gap-3 p-3.5 rounded-xl border border-border/80 bg-secondary/30 cursor-pointer hover:border-primary transition">
                      <input type="radio" name="payment_method" value="COD" class="text-primary focus:ring-0 mt-0.5" />
                      <div>
                        <p class="text-xs font-semibold text-foreground">Thanh toán khi nhận hàng (COD)</p>
                        <p class="text-[10px] text-muted-foreground mt-0.5">Nhận hàng, kiểm tra trước khi thanh toán tiền mặt.</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div class="pt-4">
                  <button type="submit" class="w-full py-4 px-6 rounded-full bg-foreground text-background text-xs uppercase tracking-widest font-semibold hover:bg-foreground/90 transition shadow-lg flex items-center justify-center gap-2">
                    <i data-lucide="check" class="w-4 h-4"></i>
                    Xác nhận đặt hàng · ${Store.formatMoney(summary.total)}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- Right: Order Summary & Coupon -->
          <div class="lg:col-span-5 space-y-6">
            <div class="sticky top-24 border border-border/70 rounded-2xl bg-secondary/30 p-6 shadow-sm space-y-5">
              <h2 class="text-base font-semibold text-foreground flex items-center gap-2">
                <i data-lucide="receipt" class="w-4 h-4 text-primary"></i>
                Tóm tắt đơn hàng
              </h2>

              <!-- Promo Code Input -->
              <div class="p-3.5 rounded-xl bg-background border border-border/70 space-y-2">
                <label class="block text-xs font-medium text-foreground">Mã ưu đãi / Voucher</label>
                <div class="flex gap-2">
                  <input type="text" id="promo-input" value="${summary.appliedPromo ? summary.appliedPromo.code : ''}" placeholder="Nhập mã: TRANANH10, GLOW50..." class="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-xs uppercase font-medium focus:outline-none" />
                  <button onclick="App.applyCoupon()" class="px-4 py-2 rounded-lg bg-foreground text-background text-xs font-medium uppercase tracking-wider hover:bg-foreground/90 transition">
                    Áp dụng
                  </button>
                </div>
                ${summary.appliedPromo ? `
                  <div class="flex items-center justify-between text-xs text-emerald-600 font-medium pt-1">
                    <span>Đã áp dụng: ${summary.appliedPromo.label}</span>
                    <button onclick="Store.applyPromoCode('')" class="text-muted-foreground hover:text-destructive underline text-[11px]">Gỡ bỏ</button>
                  </div>
                ` : `
                  <p class="text-[11px] text-muted-foreground">Thử nhập: <code class="bg-secondary px-1 py-0.5 rounded text-foreground font-semibold">TRANANH10</code> (-10%) hoặc <code class="bg-secondary px-1 py-0.5 rounded text-foreground font-semibold">GLOW50</code> (-50k)</p>
                `}
              </div>

              <!-- Price Breakdown -->
              <div class="space-y-3 pt-2 text-sm border-t border-border/60">
                <div class="flex justify-between text-muted-foreground">
                  <span>Tạm tính</span>
                  <span class="text-foreground font-medium">${Store.formatMoney(summary.subtotal)}</span>
                </div>

                ${summary.discount > 0 ? `
                  <div class="flex justify-between text-emerald-600 font-medium">
                    <span>Giảm giá ưu đãi</span>
                    <span>-${Store.formatMoney(summary.discount)}</span>
                  </div>
                ` : ''}

                <div class="flex justify-between text-muted-foreground">
                  <span>Phí vận chuyển</span>
                  <span>${summary.shippingFee === 0 ? '<strong class="text-emerald-600 font-medium">Miễn phí</strong>' : Store.formatMoney(summary.shippingFee)}</span>
                </div>

                <div class="pt-3 border-t border-border flex justify-between items-baseline">
                  <span class="text-base font-medium text-foreground">Tổng thanh toán</span>
                  <span class="text-2xl font-bold text-foreground">${Store.formatMoney(summary.total)}</span>
                </div>
                <p class="text-[11px] text-muted-foreground text-right">Đã bao gồm VAT và bảo hiểm vận chuyển</p>
              </div>

              <!-- Guarantee Box -->
              <div class="p-3.5 rounded-xl bg-background/80 border border-border/60 text-xs text-muted-foreground space-y-1.5">
                <div class="flex items-center gap-2 font-medium text-foreground">
                  <i data-lucide="shield-check" class="w-4 h-4 text-primary"></i>
                  Cam kết dịch vụ TranAnh Skin
                </div>
                <p>• 100% sản phẩm có tem chống hàng giả và số lô sản xuất.</p>
                <p>• Dược sĩ theo dõi phác đồ và hỗ trợ chăm sóc trọn vòng đời sản phẩm.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    renderIcons();
  }

  function applyCoupon() {
    const input = document.getElementById('promo-input');
    if (input) {
      const res = Store.applyPromoCode(input.value);
      showToast(res.message, res.success ? 'success' : 'error');
      renderCartPage();
    }
  }

  function handleCheckout(e) {
    e.preventDefault();
    const name = document.getElementById('cust-name').value.trim();
    const phone = document.getElementById('cust-phone').value.trim();
    const address = document.getElementById('cust-address').value.trim();
    const notes = document.getElementById('cust-notes').value.trim();
    const paymentMethodEl = document.querySelector('input[name="payment_method"]:checked');
    const paymentMethod = paymentMethodEl ? paymentMethodEl.value : 'COD';

    if (!(window.Auth && Auth.isLoggedIn())) {
      showToast('Vui lòng đăng nhập để đặt hàng', 'error');
      window.location.hash = '#/dang-nhap?redirect=gio-hang';
      return;
    }

    if (!name || !phone || !address) {
      showToast('Vui lòng điền đầy đủ họ tên, SĐT và địa chỉ nhận hàng', 'error');
      return;
    }

    try {
      const order = Store.createOrder({
        customer: { name, phone, address, notes },
        paymentMethod: paymentMethod === 'Wallet'
          ? Store.WALLET_METHOD
          : (paymentMethod === 'VietQR' ? 'Chuyển khoản VietQR' : 'COD (Thanh toán khi nhận hàng)')
      });

      if (paymentMethod === 'VietQR') {
        showVietQRModal(order);
      } else {
        showOrderSuccessModal(order);
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function playSuccessChime() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const now = ctx.currentTime;

      // Note 1 (523.25 Hz - C5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0.01, now);
      gain1.gain.exponentialRampToValueAtTime(0.25, now + 0.04);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);

      // Note 2 (783.99 Hz - G5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(783.99, now + 0.12);
      gain2.gain.setValueAtTime(0.01, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.3, now + 0.16);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.55);
    } catch (e) {
      console.log('Audio notification bypassed', e);
    }
  }

  function copyToClipboard(text, label = 'nội dung') {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(`Đã sao chép ${label}: ${text}`);
      }).catch(() => {
        fallbackCopyText(text, label);
      });
    } else {
      fallbackCopyText(text, label);
    }
  }

  function fallbackCopyText(text, label) {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    showToast(`Đã sao chép ${label}: ${text}`);
  }

  function showOrderSuccessModal(order) {
    const modal = document.createElement('div');
    modal.id = 'order-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-sm';
    modal.innerHTML = `
      <div class="max-w-md w-full bg-background rounded-3xl p-6 sm:p-8 shadow-2xl border border-border text-center space-y-4 animate-in fade-in zoom-in duration-200">
        <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
          <i data-lucide="check" class="w-8 h-8"></i>
        </div>
        <h3 class="font-heading text-2xl text-foreground">Đặt hàng thành công!</h3>
        <p class="text-xs text-muted-foreground">Mã đơn hàng của bạn: <strong class="text-foreground">${order.id}</strong></p>
        <div class="p-4 rounded-xl bg-secondary/40 text-left text-xs space-y-2 border border-border/60">
          <p><strong>Người nhận:</strong> ${order.customer.name} - ${order.customer.phone}</p>
          <p><strong>Địa chỉ:</strong> ${order.customer.address}</p>
          <p><strong>Thanh toán:</strong> ${order.paymentMethod}</p>
          ${order.walletPaid ? `<p><strong>Số dư ví còn lại:</strong> ${Store.formatMoney(Store.getBalance(order.userId))}</p>` : ''}
          <p><strong>Tổng tiền:</strong> <span class="font-bold text-foreground text-sm">${Store.formatMoney(order.total)}</span></p>
        </div>
        <p class="text-[11px] text-muted-foreground">Chuyên viên TranAnh Skin sẽ liên hệ xác nhận đơn và gửi hàng trong vòng 24h.</p>
        <div class="pt-2">
          <button onclick="document.getElementById('order-modal').remove(); window.location.hash='#/';" class="w-full py-3 rounded-full bg-foreground text-background text-xs uppercase tracking-widest font-semibold hover:bg-foreground/90 transition">
            Về trang chủ
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    renderIcons();
  }

  function showVietQRModal(order) {
    const bankAccount = '0379949095';
    const bankName = 'MB Bank (Quân Đội)';
    const accountName = 'TRAN THI NGOC ANH';
    const memo = order.id;
    const qrUrl = `https://img.vietqr.io/image/MB-${bankAccount}-compact.png?amount=${order.total}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(accountName)}`;

    // >>> VIETQR-LOCAL-START
    // Tạo mã VietQR (chuẩn EMVCo/NAPAS) ngay trên trình duyệt, không phụ thuộc dịch vụ ảnh bên ngoài
    function buildVietQRPayload(bin, account, amount, info) {
      const tlv = (id, val) => id + String(val.length).padStart(2, '0') + val;
      const crc16 = (str) => {
        let crc = 0xFFFF;
        for (let i = 0; i < str.length; i++) {
          crc ^= str.charCodeAt(i) << 8;
          for (let b = 0; b < 8; b++) {
            crc = (crc & 0x8000) ? (((crc << 1) ^ 0x1021) & 0xFFFF) : ((crc << 1) & 0xFFFF);
          }
        }
        return crc.toString(16).toUpperCase().padStart(4, '0');
      };
      const cleanInfo = String(info).replace(/[^A-Za-z0-9 \-]/g, '').slice(0, 23);
      const merchant = tlv('00', 'A000000727') + tlv('01', tlv('00', bin) + tlv('01', account)) + tlv('02', 'QRIBFTTA');
      const body =
        tlv('00', '01') + tlv('01', '12') + tlv('38', merchant) + tlv('53', '704') +
        (amount > 0 ? tlv('54', String(Math.round(amount))) : '') +
        tlv('58', 'VN') + tlv('62', tlv('08', cleanInfo)) + '6304';
      return body + crc16(body);
    }
    // <<< VIETQR-LOCAL-END

    let qrMarkup;
    try {
      if (typeof qrcode !== 'function') throw new Error('Thiếu thư viện qrcode.js');
      const qr = qrcode(0, 'M');
      qr.addData(buildVietQRPayload('970422', bankAccount, order.total, memo));
      qr.make();
      const svg = qr.createSvgTag({ cellSize: 4, margin: 8, scalable: true })
        .replace('<svg ', '<svg style="display:block;width:100%;height:100%" ');
      qrMarkup = `<div role="img" aria-label="Mã VietQR thanh toán đơn ${memo}" style="width:16rem;height:16rem;max-width:100%;margin:0 auto">${svg}</div>`;
    } catch (err) {
      console.warn('Không tạo được QR cục bộ, dùng ảnh trực tuyến:', err);
      qrMarkup = `<img src="${qrUrl}" alt="VietQR TranAnh Skin" style="width:16rem;height:16rem;max-width:100%;object-fit:contain;margin:0 auto" onerror="this.outerHTML='<p class=&quot;text-xs text-destructive p-6&quot;>Không tải được mã QR. Vui lòng chuyển khoản thủ công theo thông tin bên dưới.</p>'" />`;
    }

    // Mã QR chỉ có hiệu lực 3 phút, sau đó tự đóng
    const QR_TTL_SECONDS = 180;
    let countdownSeconds = QR_TTL_SECONDS;
    let timerId = null;
    let settled = false; // đã xử lý xong thanh toán (tránh hiện 2 màn hình thành công)

    // --- Tự động xác nhận khi máy chủ báo đã nhận tiền (cấu hình window.PAYMENT_API trong index.html) ---
    const PAY_API = getPayApiBase();
    const autoMode = !!PAY_API;
    let pollId = null;
    function stopPolling() { if (pollId) { clearInterval(pollId); pollId = null; } }
    function setWatchStatus(html) {
      const el = document.getElementById('qr-watch-status');
      if (el) el.innerHTML = html;
    }
    const WATCH_IDLE_HTML = '<span class="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0"></span><span>Đang chờ nhận tiền, đơn sẽ tự xác nhận trong vài giây sau khi bạn chuyển khoản.</span>';
    // Báo cho admin khi khách bấm "Tôi đã thanh toán" (chỉ gửi 1 lần cho mỗi đơn)
    let claimSent = false;
    function notifyAdminPaid() {
      if (claimSent) return;
      claimSent = true;
      Store.markCustomerClaimedPaid(order.id); // admin cùng trình duyệt nhận ngay qua sự kiện storage
      if (PAY_API) {
        fetch(PAY_API + '/api/payments/' + encodeURIComponent(order.id) + '/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: order.id, amount: order.total, customerName: (order.customer && order.customer.name) || '' })
        }).catch(() => { /* máy chủ chưa hỗ trợ /claim hoặc đang tắt: bỏ qua */ });
      }
    }
    let checking = false;
    window.checkPaymentNow = async function () {
      if (checking) return;
      checking = true;
      notifyAdminPaid();
      const btn = document.getElementById('btn-check-paid');
      if (btn) { btn.disabled = true; btn.style.opacity = '.6'; }
      try {
        const r = await fetch(PAY_API + '/api/payments/' + encodeURIComponent(order.id), { cache: 'no-store' });
        const d = r.ok ? await r.json() : null;
        if (d && d.status === 'paid') { stopPolling(); window.triggerAutoConfirm(); return; }
        setWatchStatus('<span>Đã báo cho cửa hàng. Chưa nhận được tiền cho đơn <strong>' + order.id + '</strong>. Ngân hàng có thể mất vài giây đến một phút, vui lòng chờ rồi bấm lại. Nếu đã trừ tiền quá lâu, hãy gọi <strong>1900 6789</strong> kèm mã đơn.</span>');
      } catch (err) {
        console.warn('Không kết nối được máy chủ xác nhận:', err);
      }
      setTimeout(() => { if (modal.isConnected) setWatchStatus(WATCH_IDLE_HTML); }, 8000);
      if (btn) { btn.disabled = false; btn.style.opacity = ''; }
      checking = false;
    };
    async function startPaymentWatch() {
      try {
        const r = await fetch(PAY_API + '/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: order.id, amount: order.total })
        });
        if (!r.ok) throw new Error('register failed');
      } catch (err) {
        console.warn('Không kết nối được máy chủ thanh toán:', err);
        return;
      }
      let busy = false;
      pollId = setInterval(async () => {
        if (!modal.isConnected) { stopPolling(); return; }
        if (busy) return;
        busy = true;
        try {
          const r = await fetch(PAY_API + '/api/payments/' + encodeURIComponent(order.id), { cache: 'no-store' });
          if (r.ok) {
            const d = await r.json();
            if (d.status === 'paid') { stopPolling(); window.triggerAutoConfirm(); }
          }
        } catch (err) { /* mạng chập chờn: thử lại lần sau */ }
        busy = false;
      }, 3000);
    }

    function formatClock(sec) {
      const m = Math.floor(sec / 60);
      const r = sec % 60;
      return String(m).padStart(2, '0') + ':' + String(r).padStart(2, '0');
    }

    const modal = document.createElement('div');
    modal.id = 'order-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/70 backdrop-blur-sm overflow-y-auto';

    // RENDER INITIAL WAITING SCREEN
    function renderWaitingScreen() {
      modal.innerHTML = `
        <div class="max-w-lg w-full bg-background rounded-3xl p-6 sm:p-7 shadow-2xl border border-border space-y-4 my-8 animate-in fade-in zoom-in duration-200">
          <!-- Header -->
          <div class="flex items-center justify-between pb-3 border-b border-border/70">
            <div>
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                Chờ chuyển khoản
              </span>
              <h3 class="font-heading text-xl sm:text-2xl text-foreground font-semibold mt-1">Quét mã QR để thanh toán</h3>
            </div>
            <div class="text-right">
              <span class="text-[10px] text-muted-foreground">Số tiền:</span>
              <p class="text-lg font-bold text-primary font-mono">${Store.formatMoney(order.total)}</p>
            </div>
          </div>

          <!-- Dynamic VietQR Image Container -->
          <div class="p-4 bg-gradient-to-b from-secondary/40 to-background rounded-2xl border border-border text-center relative overflow-hidden">
            <div class="bg-white p-3 rounded-xl border border-border/80 inline-block shadow-md">
              ${qrMarkup}
            </div>

            <!-- Auto-detecting Radar Pulse -->
            <div class="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground font-medium">
              <span class="relative flex h-2.5 w-2.5">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>Mã QR hết hạn sau <strong id="qr-countdown" class="text-foreground font-mono">${formatClock(countdownSeconds)}</strong></span>
            </div>
          </div>

          <!-- Shop Bank Account Details with Copy Buttons -->
          <div class="p-4 rounded-xl bg-secondary/40 border border-border/70 text-xs space-y-2.5">
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Ngân hàng:</span>
              <strong class="text-foreground">${bankName}</strong>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Chủ tài khoản:</span>
              <strong class="text-foreground">${accountName}</strong>
            </div>

            <div class="flex items-center justify-between pt-1 border-t border-border/40">
              <span class="text-muted-foreground">Số tài khoản:</span>
              <div class="flex items-center gap-2">
                <code class="font-mono text-sm font-bold text-foreground bg-background px-2 py-0.5 rounded border border-border">${bankAccount}</code>
                <button type="button" onclick="App.copyToClipboard('${bankAccount}', 'Số tài khoản')" class="px-2 py-0.5 rounded bg-background border border-border text-[11px] font-medium hover:bg-secondary transition flex items-center gap-1">
                  <i data-lucide="copy" class="w-3 h-3"></i> Chép
                </button>
              </div>
            </div>

            <div class="flex items-center justify-between pt-1 border-t border-border/40">
              <span class="text-muted-foreground">Số tiền chính xác:</span>
              <div class="flex items-center gap-2">
                <code class="font-mono text-sm font-bold text-primary bg-background px-2 py-0.5 rounded border border-border">${order.total}</code>
                <button type="button" onclick="App.copyToClipboard('${order.total}', 'Số tiền')" class="px-2 py-0.5 rounded bg-background border border-border text-[11px] font-medium hover:bg-secondary transition flex items-center gap-1">
                  <i data-lucide="copy" class="w-3 h-3"></i> Chép
                </button>
              </div>
            </div>

            <div class="flex items-center justify-between pt-1 border-t border-border/40">
              <span class="text-muted-foreground">Nội dung chuyển khoản (Memo):</span>
              <div class="flex items-center gap-2">
                <code class="font-mono text-sm font-bold text-foreground bg-background px-2 py-0.5 rounded border border-primary/40">${memo}</code>
                <button type="button" onclick="App.copyToClipboard('${memo}', 'Nội dung chuyển khoản')" class="px-2 py-0.5 rounded bg-primary text-foreground text-[11px] font-semibold hover:bg-primary/90 transition flex items-center gap-1">
                  <i data-lucide="copy" class="w-3 h-3"></i> Chép
                </button>
              </div>
            </div>
          </div>

          <!-- Bottom Actions -->
          <div class="pt-2 space-y-2">
            ${autoMode ? `
            <div id="qr-watch-status" class="w-full py-3.5 px-4 rounded-2xl bg-secondary/60 border border-border/70 text-xs text-foreground text-center flex items-center justify-center gap-2.5">
              <span class="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0"></span>
              <span>Đang chờ nhận tiền, đơn sẽ tự xác nhận trong vài giây sau khi bạn chuyển khoản.</span>
            </div>
            <button type="button" id="btn-check-paid" onclick="checkPaymentNow()" class="w-full py-3.5 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs uppercase tracking-widest font-semibold shadow-lg transition flex items-center justify-center gap-2">
              <i data-lucide="check" class="w-4 h-4"></i>
              Tôi đã thanh toán
            </button>
            <p class="text-[10px] text-muted-foreground text-center">
              * Mã QR theo chuẩn VietQR (Napas 247): quét bằng ứng dụng của <strong class="text-foreground">bất kỳ ngân hàng hoặc ví điện tử nào</strong> có hỗ trợ quét QR (Vietcombank, VietinBank, BIDV, Agribank, Techcombank, ACB, MB, VPBank, TPBank, Sacombank, MoMo...). Chuyển khoản liên ngân hàng vẫn nhận được.<br>
              * Vui lòng giữ nguyên nội dung chuyển khoản <strong class="text-foreground">${order.id}</strong> và số tiền đúng như trên mã QR.
            </p>` : `
            <button id="btn-manual-confirm" onclick="triggerAutoConfirm()" class="w-full py-3.5 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs uppercase tracking-widest font-semibold shadow-lg transition flex items-center justify-center gap-2 animate-bounce">
              <i data-lucide="zap" class="w-4 h-4"></i>
              Tôi đã chuyển khoản xong — Xác nhận & Giao hàng ngay
            </button>
            <p class="text-[10px] text-muted-foreground text-center">
              * Chế độ thử nghiệm: chưa kết nối máy chủ xác nhận thanh toán tự động.
            </p>`}
          </div>
        </div>
      `;
      renderIcons();
    }

    // ADMIN ĐÃ XÁC NHẬN THANH TOÁN: hiện "Thanh toán thành công" rồi tự đóng modal
    function showPaidByAdmin() {
      if (settled || !modal.isConnected) return;
      settled = true;
      if (timerId) { clearInterval(timerId); timerId = null; }
      stopPolling();
      playSuccessChime();

      modal.innerHTML = `
        <div class="max-w-sm w-full bg-background rounded-3xl p-8 shadow-2xl border border-border text-center space-y-4 my-8 animate-in zoom-in-95 duration-300">
          <div class="relative w-20 h-20 mx-auto">
            <div class="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping"></div>
            <div class="relative w-20 h-20 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xl">
              <i data-lucide="check" class="w-10 h-10 stroke-[2.5]"></i>
            </div>
          </div>
          <div>
            <h3 class="font-heading text-2xl text-foreground font-semibold">Thanh toán thành công</h3>
            <p class="text-xs text-muted-foreground mt-1">
              Cửa hàng đã nhận <strong class="text-foreground">${Store.formatMoney(order.total)}</strong> cho đơn
              <strong class="text-foreground font-mono">${order.id}</strong>. Cảm ơn bạn!
            </p>
          </div>
        </div>
      `;
      renderIcons();

      setTimeout(() => {
        if (modal.isConnected) {
          modal.remove();
          window.location.hash = '#/';
        }
      }, 3000);
    }

    // Lắng nghe đơn hàng thay đổi (admin bấm xác nhận ở tab khác) -> đóng QR
    function onOrdersChanged() {
      if (settled || !modal.isConnected) return;
      const current = Store.getOrders().find(o => o.id === order.id);
      if (current && current.paymentStatus && current.paymentStatus.includes('Đã thanh toán')) {
        showPaidByAdmin();
      }
    }
    Store.on('orders:changed', onOrdersChanged);

    // TRIGGER AUTO CONFIRMATION & AUTO DISPATCH
    window.triggerAutoConfirm = function () {
      settled = true;
      if (timerId) clearInterval(timerId);
      stopPolling();

      // Play chime
      playSuccessChime();

      // Update in Store
      const updatedOrder = Store.markOrderPaidAndShipped(order.id);

      // RENDER AUTO-CONFIRMED & AUTO-SHIPPING SUCCESS SCREEN
      modal.innerHTML = `
        <div class="max-w-lg w-full bg-background rounded-3xl p-6 sm:p-8 shadow-2xl border border-border space-y-5 my-8 text-center animate-in zoom-in-95 duration-300">
          
          <!-- Big Checkmark Celebration -->
          <div class="relative w-20 h-20 mx-auto">
            <div class="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping"></div>
            <div class="relative w-20 h-20 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xl">
              <i data-lucide="check" class="w-10 h-10 stroke-[2.5]"></i>
            </div>
          </div>

          <div>
            <span class="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
              ✓ Thanh toán & Đối soát thành công
            </span>
            <h3 class="font-heading text-2xl sm:text-3xl text-foreground font-semibold">
              Đơn hàng đã tự động xác nhận!
            </h3>
            <p class="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Hệ thống đã nhận đủ <strong class="text-foreground">${Store.formatMoney(order.total)}</strong>. Đơn hàng đang được tự động đóng gói và bàn giao vận chuyển.
            </p>
          </div>

          <!-- Shipping Status Card -->
          <div class="p-5 rounded-2xl bg-secondary/30 border border-border text-left space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-border/60">
              <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <i data-lucide="truck" class="w-5 h-5"></i>
                </div>
                <div>
                  <p class="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Đơn vị vận chuyển</p>
                  <p class="text-xs font-bold text-foreground">Giao Hàng Tiết Kiệm (GHTK Express)</p>
                </div>
              </div>
              <span class="px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-bold text-[11px] animate-pulse">
                🚚 Đang vận chuyển
              </span>
            </div>

            <div class="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span class="text-muted-foreground">Mã đơn hàng:</span>
                <p class="font-mono font-bold text-foreground">${order.id}</p>
              </div>
              <div>
                <span class="text-muted-foreground">Mã vận đơn:</span>
                <p class="font-mono font-bold text-blue-700 flex items-center gap-1">
                  ${updatedOrder.trackingCode}
                  <button type="button" onclick="App.copyToClipboard('${updatedOrder.trackingCode}', 'Mã vận đơn')" class="text-muted-foreground hover:text-foreground">
                    <i data-lucide="copy" class="w-3 h-3"></i>
                  </button>
                </p>
              </div>
            </div>

            <!-- Real-time 4-Step Animated Delivery Tracking -->
            <div class="pt-2 border-t border-border/50 space-y-3">
              <p class="text-[11px] font-semibold text-foreground uppercase tracking-wider">Hành trình đơn hàng:</p>
              
              <div class="relative pl-6 space-y-3.5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-500">
                <div class="relative">
                  <span class="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px]">✓</span>
                  <p class="text-xs font-medium text-foreground">Khách hàng đặt hàng</p>
                  <p class="text-[10px] text-muted-foreground">Đơn ${order.id} tạo thành công trên hệ thống</p>
                </div>

                <div class="relative">
                  <span class="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px]">✓</span>
                  <p class="text-xs font-medium text-foreground">Đã nhận thanh toán qua Ví / VietQR</p>
                  <p class="text-[10px] text-muted-foreground">Khớp đúng ${Store.formatMoney(order.total)} vào tài khoản MB Bank</p>
                </div>

                <div class="relative">
                  <span class="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px]">✓</span>
                  <p class="text-xs font-medium text-foreground">Hệ thống tự động duyệt đơn & in phiếu xuất kho</p>
                  <p class="text-[10px] text-muted-foreground">Kho TranAnh Skin hoàn tất đóng hộp niêm phong</p>
                </div>

                <div class="relative">
                  <span class="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] animate-ping">🚚</span>
                  <p class="text-xs font-bold text-blue-700">Đã bàn giao bưu tá GHTK — Đang vận chuyển</p>
                  <p class="text-[10px] text-muted-foreground">Đang trên đường giao đến: ${order.customer.address}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button onclick="document.getElementById('order-modal').remove(); window.location.hash='#/admin';" class="w-full py-3 px-4 rounded-full bg-foreground text-background text-xs uppercase tracking-wider font-semibold hover:bg-foreground/90 transition shadow-md flex items-center justify-center gap-1.5">
              <i data-lucide="layout-dashboard" class="w-4 h-4"></i>
              Xem đơn trong Quản trị (Admin)
            </button>
            <button onclick="document.getElementById('order-modal').remove(); window.location.hash='#/';" class="w-full py-3 px-4 rounded-full border border-border bg-background hover:bg-secondary text-xs uppercase tracking-wider font-semibold text-foreground transition">
              Về trang chủ
            </button>
          </div>
        </div>
      `;
      renderIcons();
    };

    // QR HẾT HẠN: tự đóng mã QR, đơn vẫn giữ trạng thái "Chờ thanh toán"
    function expireQR() {
      if (timerId) clearInterval(timerId);
      stopPolling();
      timerId = null;
      modal.innerHTML = `
        <div class="max-w-md w-full bg-background rounded-3xl p-6 sm:p-8 shadow-2xl border border-border space-y-5 my-8 text-center">
          <div class="w-16 h-16 mx-auto rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
            <i data-lucide="clock" class="w-8 h-8"></i>
          </div>
          <div>
            <h3 class="font-heading text-2xl text-foreground font-semibold">Mã QR đã hết hạn</h3>
            <p class="text-xs text-muted-foreground mt-2 leading-relaxed">
              Mã QR chỉ có hiệu lực trong 3 phút. Đơn <strong class="text-foreground font-mono">${order.id}</strong> vẫn được giữ ở trạng thái chờ thanh toán.
              Nếu bạn đã chuyển khoản, vui lòng liên hệ shop kèm mã đơn để được xác nhận.
            </p>
          </div>
          <div class="grid grid-cols-1 gap-3">
            <button type="button" id="btn-qr-regenerate" class="w-full py-3 px-4 rounded-full bg-foreground text-background text-xs uppercase tracking-wider font-semibold hover:bg-foreground/90 transition shadow-md">
              Tạo lại mã QR
            </button>
            <button type="button" id="btn-qr-home" class="w-full py-3 px-4 rounded-full border border-border bg-background hover:bg-secondary text-xs uppercase tracking-wider font-semibold text-foreground transition">
              Về trang chủ
            </button>
          </div>
        </div>
      `;
      renderIcons();
      const regen = document.getElementById('btn-qr-regenerate');
      const home = document.getElementById('btn-qr-home');
      if (regen) regen.addEventListener('click', function () {
        modal.remove();
        showVietQRModal(order);
      });
      if (home) home.addEventListener('click', function () {
        modal.remove();
        window.location.hash = '#/';
      });
    }

    renderWaitingScreen();
    document.body.appendChild(modal);
    if (autoMode) startPaymentWatch();

    // Đếm ngược 3 phút (mm:ss); tự dừng nếu modal đã bị đóng
    timerId = setInterval(() => {
      if (!modal.isConnected) {
        clearInterval(timerId);
        timerId = null;
        return;
      }
      countdownSeconds--;
      const el = document.getElementById('qr-countdown');
      if (el) el.textContent = formatClock(Math.max(countdownSeconds, 0));
      if (countdownSeconds <= 0) expireQR();
    }, 1000);
  }

  // ==========================================
  // WALLET: NẠP TIỀN (QR) & DUYỆT CỦA QUẢN TRỊ
  // ==========================================
  const TOPUP_BANK = { bin: '970422', code: 'MB', account: '0379949095', name: 'MB Bank (Quân Đội)', holder: 'TRAN THI NGOC ANH' };

  function walletEsc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function buildTopupQr(amount, memo) {
    function tlv(id, val) { return id + String(val.length).padStart(2, '0') + val; }
    function crc16(str) {
      let crc = 0xFFFF;
      for (let i = 0; i < str.length; i++) {
        crc ^= str.charCodeAt(i) << 8;
        for (let b = 0; b < 8; b++) {
          crc = (crc & 0x8000) ? (((crc << 1) ^ 0x1021) & 0xFFFF) : ((crc << 1) & 0xFFFF);
        }
      }
      return crc.toString(16).toUpperCase().padStart(4, '0');
    }
    try {
      if (typeof qrcode !== 'function') throw new Error('Thiếu thư viện qrcode.js');
      const cleanInfo = String(memo).replace(/[^A-Za-z0-9 \-]/g, '').slice(0, 23);
      const merchant = tlv('00', 'A000000727') + tlv('01', tlv('00', TOPUP_BANK.bin) + tlv('01', TOPUP_BANK.account)) + tlv('02', 'QRIBFTTA');
      const body = tlv('00', '01') + tlv('01', '12') + tlv('38', merchant) + tlv('53', '704') +
        tlv('54', String(Math.round(amount))) + tlv('58', 'VN') + tlv('62', tlv('08', cleanInfo)) + '6304';
      const qr = qrcode(0, 'M');
      qr.addData(body + crc16(body));
      qr.make();
      const svg = qr.createSvgTag({ cellSize: 4, margin: 8, scalable: true })
        .replace('<svg ', '<svg style="display:block;width:100%;height:100%" ');
      return `<div role="img" aria-label="Mã VietQR nạp ví ${walletEsc(memo)}" style="width:14rem;height:14rem;max-width:100%;margin:0 auto">${svg}</div>`;
    } catch (err) {
      const url = `https://img.vietqr.io/image/${TOPUP_BANK.code}-${TOPUP_BANK.account}-compact.png?amount=${Math.round(amount)}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(TOPUP_BANK.holder)}`;
      return `<img src="${url}" alt="VietQR nạp ví" style="width:14rem;height:14rem;max-width:100%;object-fit:contain;margin:0 auto" onerror="this.outerHTML='<p class=&quot;text-xs text-destructive p-6&quot;>Không tải được mã QR. Vui lòng chuyển khoản thủ công theo thông tin bên dưới.</p>'" />`;
    }
  }

  function showTopupModal(requestId) {
    const user = window.Auth ? Auth.currentUser() : null;
    if (!user) return;
    const req = Store.getTopups(user.id).find(t => t.id === requestId);
    if (!req) return;
    const old = document.getElementById('topup-modal');
    if (old) old.remove();

    const modal = document.createElement('div');
    modal.id = 'topup-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-sm overflow-y-auto';

    function row(label, value, copyValue) {
      return `
        <div class="flex items-center justify-between gap-2">
          <span class="text-muted-foreground">${label}</span>
          <span class="flex items-center gap-2">
            <strong class="text-foreground font-mono">${walletEsc(value)}</strong>
            ${copyValue ? `<button type="button" onclick="App.copyToClipboard('${walletEsc(copyValue)}', '${label}')" class="px-2 py-0.5 rounded bg-background border border-border text-[11px] font-medium hover:bg-secondary transition">Sao chép</button>` : ''}
          </span>
        </div>`;
    }

    modal.innerHTML = `
      <div class="max-w-md w-full bg-background rounded-3xl p-6 sm:p-8 shadow-2xl border border-border space-y-4 my-8 text-center">
        <div class="flex items-center justify-between">
          <h3 class="font-heading text-2xl text-foreground">Nạp tiền vào ví</h3>
          <button type="button" id="topup-close" class="text-muted-foreground hover:text-foreground" aria-label="Đóng"><i data-lucide="x" class="w-5 h-5"></i></button>
        </div>
        ${buildTopupQr(req.amount, req.id)}
        <div class="p-4 rounded-xl bg-secondary/40 text-left text-xs space-y-2 border border-border/60">
          ${row('Ngân hàng', TOPUP_BANK.name, '')}
          ${row('Số tài khoản', TOPUP_BANK.account, TOPUP_BANK.account)}
          ${row('Chủ tài khoản', TOPUP_BANK.holder, '')}
          ${row('Số tiền', Store.formatMoney(req.amount), String(req.amount))}
          ${row('Nội dung', req.id, req.id)}
        </div>
        <p class="text-[11px] text-muted-foreground">
          Quét bằng ứng dụng của <strong class="text-foreground">bất kỳ ngân hàng hoặc ví điện tử nào</strong> hỗ trợ VietQR, hoặc chuyển liên ngân hàng theo thông tin trên.
          Vui lòng giữ nguyên <strong class="text-foreground">nội dung chuyển khoản</strong> và đúng số tiền.
          Sau khi cửa hàng đối chiếu sao kê, tiền sẽ được cộng vào ví của bạn (trang này tự cập nhật).
        </p>
        <button type="button" id="topup-done" class="w-full py-3 rounded-full bg-foreground text-background text-xs uppercase tracking-widest font-semibold hover:bg-foreground/90 transition">
          Tôi đã chuyển khoản, đóng
        </button>
      </div>
    `;
    document.body.appendChild(modal);
    renderIcons();

    const close = () => { if (modal.isConnected) modal.remove(); };
    modal.querySelector('#topup-close').addEventListener('click', close);
    modal.querySelector('#topup-done').addEventListener('click', close);

    // Khi quản trị viên cộng tiền: báo thành công rồi tự đóng
    Store.on('wallet:changed', function () {
      if (!modal.isConnected) return;
      const cur = Store.getTopups(user.id).find(t => t.id === req.id);
      if (!cur || cur.status === 'Chờ xác nhận') return;
      if (cur.status === 'Đã cộng tiền') {
        modal.innerHTML = `
          <div class="max-w-sm w-full bg-background rounded-3xl p-8 shadow-2xl border border-border text-center space-y-3 my-8">
            <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto"><i data-lucide="check" class="w-8 h-8"></i></div>
            <h3 class="font-heading text-2xl text-foreground">Nạp tiền thành công</h3>
            <p class="text-xs text-muted-foreground">Đã cộng <strong class="text-foreground">${Store.formatMoney(cur.amount)}</strong> vào ví. Số dư hiện tại: <strong class="text-foreground">${Store.formatMoney(Store.getBalance(user.id))}</strong></p>
          </div>`;
        renderIcons();
        setTimeout(close, 2500);
      } else {
        close();
      }
    });
  }

  function approveTopup(id) {
    if (!(window.Auth && Auth.isAdmin())) {
      showToast('Chỉ quản trị viên mới được cộng tiền vào ví', 'error');
      return;
    }
    const req = Store.getTopups().find(t => t.id === id);
    if (!req) return;
    if (!confirm('Cộng ' + Store.formatMoney(req.amount) + ' vào ví của ' + req.userName + ' (mã ' + id + ')?\nHãy đối chiếu với sao kê ngân hàng (đúng số tiền và nội dung ' + id + ') trước khi xác nhận.')) return;
    if (Store.approveTopup(id)) {
      renderAdminPage();
      switchAdminTab('wallet');
    }
  }

  function rejectTopup(id) {
    if (!(window.Auth && Auth.isAdmin())) {
      showToast('Chỉ quản trị viên mới được từ chối yêu cầu nạp', 'error');
      return;
    }
    if (!confirm('Từ chối yêu cầu nạp ' + id + '?')) return;
    if (Store.rejectTopup(id)) {
      showToast('Đã từ chối yêu cầu nạp ' + id);
      renderAdminPage();
      switchAdminTab('wallet');
    }
  }

  // ==========================================
  // VIEW: POLICIES PAGE
  // ==========================================
  function renderPoliciesPage() {
    const container = document.getElementById('app-content');
    container.innerHTML = `
      <div class="page-container py-12 sm:py-20 max-w-4xl">
        <nav class="flex items-center gap-2 text-xs text-muted-foreground mb-8">
          <a href="#/" class="hover:text-foreground transition">Trang chủ</a>
          <span>/</span>
          <span class="text-foreground font-medium">Chính sách & Cam kết</span>
        </nav>

        <div class="space-y-2 mb-12">
          <span class="text-[11px] uppercase tracking-[0.25em] text-muted-foreground font-medium">Quy chuẩn dịch vụ</span>
          <h1 class="font-heading text-3xl sm:text-5xl text-foreground font-normal">
            Mua hàng tại TranAnh Skin, minh bạch từ đầu
          </h1>
          <p class="text-sm text-muted-foreground font-light leading-relaxed">
            Chúng tôi tin rằng sự tin tưởng bắt nguồn từ sự minh bạch tuyệt đối trong chất lượng sản phẩm, chính sách giao nhận và quyền lợi khách hàng.
          </p>
        </div>

        <div class="space-y-8">
          <!-- Policy 1 -->
          <div class="p-8 rounded-2xl border border-border/80 bg-background shadow-sm space-y-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary">
                <i data-lucide="truck" class="w-5 h-5"></i>
              </div>
              <h2 class="text-lg font-semibold text-foreground">1. Chính sách Vận chuyển & Giao hàng</h2>
            </div>
            <div class="text-sm text-muted-foreground font-light leading-relaxed space-y-2 pl-13">
              <p>• <strong>Nội thành Hà Nội & TP. Hồ Chí Minh:</strong> Giao hàng hỏa tốc trong 2–4 giờ hoặc tiêu chuẩn 24 giờ kể từ khi xác nhận đơn.</p>
              <p>• <strong>Các tỉnh thành khác:</strong> Giao hàng chuyển phát nhanh đường bay từ 2–3 ngày làm việc.</p>
              <p>• <strong>Cước phí:</strong> Miễn phí vận chuyển (FREESHIP) cho mọi đơn hàng từ <strong>500.000 đ</strong> trở lên. Với đơn hàng dưới 500.000 đ, phí ship đồng giá toàn quốc là 30.000 đ.</p>
              <p>• <strong>Quy cách đóng gói:</strong> Hộp carton chuyên dụng, túi đệm khí chống sốc 100% tái chế, niêm phong tem vỡ đảm bảo tính nguyên vẹn.</p>
            </div>
          </div>

          <!-- Policy 2 -->
          <div class="p-8 rounded-2xl border border-border/80 bg-background shadow-sm space-y-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary">
                <i data-lucide="credit-card" class="w-5 h-5"></i>
              </div>
              <h2 class="text-lg font-semibold text-foreground">2. Phương thức Thanh toán</h2>
            </div>
            <div class="text-sm text-muted-foreground font-light leading-relaxed space-y-2 pl-13">
              <p>• <strong>Thanh toán tiền mặt khi nhận hàng (COD):</strong> Quý khách được quyền kiểm tra sản phẩm trước khi thanh toán cho nhân viên giao hàng.</p>
              <p>• <strong>Chuyển khoản VietQR:</strong> Quét mã QR tự động điền sẵn số tiền và mã đơn hàng, tích hợp với hơn 40 ngân hàng và ví điện tử tại Việt Nam.</p>
            </div>
          </div>

          <!-- Policy 3 -->
          <div class="p-8 rounded-2xl border border-border/80 bg-background shadow-sm space-y-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary">
                <i data-lucide="rotate-ccw" class="w-5 h-5"></i>
              </div>
              <h2 class="text-lg font-semibold text-foreground">3. Chính sách Đổi trả & Hoàn tiền</h2>
            </div>
            <div class="text-sm text-muted-foreground font-light leading-relaxed space-y-2 pl-13">
              <p>• <strong>Đổi trả trong vòng 7 ngày:</strong> Áp dụng cho các sản phẩm còn nguyên tem niêm phong hoặc trường hợp khách hàng gặp kích ứng da đã được chuyên viên da liễu của TranAnh Skin tư vấn phác đồ trước đó.</p>
              <p>• <strong>Lỗi do nhà sản xuất:</strong> Đổi mới 100% miễn phí vận chuyển nếu sản phẩm bị lỗi vòi pump, biến chất, rò rỉ trong quá trình vận chuyển.</p>
              <p>• <strong>Thời gian hoàn tiền:</strong> Trong vòng 24–48 giờ làm việc sau khi nhận lại sản phẩm.</p>
            </div>
          </div>

          <!-- Policy 4 -->
          <div class="p-8 rounded-2xl border border-border/80 bg-background shadow-sm space-y-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary">
                <i data-lucide="shield-check" class="w-5 h-5"></i>
              </div>
              <h2 class="text-lg font-semibold text-foreground">4. Cam kết Chất lượng & Bảo mật Thông tin</h2>
            </div>
            <div class="text-sm text-muted-foreground font-light leading-relaxed space-y-2 pl-13">
              <p>• Cam kết 100% nguồn gốc xuất xứ rõ ràng, phiếu công bố mỹ phẩm của Bộ Y tế.</p>
              <p>• Thông tin cá nhân, tiền sử da liễu và lịch sử đơn hàng của khách hàng được bảo mật tuyệt đối, chỉ dùng để phục vụ quá trình tư vấn và giao hàng.</p>
            </div>
          </div>
        </div>
      </div>
    `;

    renderIcons();
  }

  // ==========================================
  // VIEW: ADMIN DASHBOARD
  // ==========================================
  function renderAdminPage() {
    try {
      if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    } catch (e) { /* bỏ qua */ }
    const container = document.getElementById('app-content');
    const orders = Store.getOrders();
    const products = Store.getProducts(true);
    const consultations = Store.getConsultations();
    const topups = Store.getTopups();
    const pendingTopups = topups.filter(t => t.status === 'Chờ xác nhận').length;

    const totalRevenue = orders.filter(o => o.status !== 'Đã hủy').reduce((sum, o) => sum + o.total, 0);
    const completedOrdersCount = orders.filter(o => o.status === 'Đã giao').length;

    container.innerHTML = `
      <div class="page-container py-10 sm:py-16">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded bg-primary text-foreground text-[10px] font-bold uppercase tracking-wider">Admin</span>
              <h1 class="font-heading text-3xl sm:text-4xl text-foreground font-normal">Quản trị Cửa hàng TranAnh Skin</h1>
            </div>
            <p class="text-xs text-muted-foreground mt-1">Hệ thống theo dõi đơn hàng, quản lý sản phẩm và tư vấn phác đồ da</p>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="App.openAddProductModal()" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-foreground text-background text-xs font-semibold hover:bg-foreground/90 transition">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i>
              Thêm sản phẩm mới
            </button>
            <button onclick="if(confirm('Khôi phục toàn bộ 19 sản phẩm về mặc định?')) { Store.resetProducts(); App.renderAdminPage(); }" class="px-3 py-2 rounded-full border border-border bg-background text-xs text-muted-foreground hover:text-foreground transition" title="Khôi phục dữ liệu gốc">
              <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>

        <!-- Metric Stat Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div class="p-5 rounded-2xl bg-secondary/40 border border-border/80">
            <p class="text-xs text-muted-foreground font-medium">Tổng doanh thu</p>
            <p class="font-heading text-2xl sm:text-3xl font-bold text-foreground mt-1">${Store.formatMoney(totalRevenue)}</p>
            <p class="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
              <i data-lucide="trending-up" class="w-3 h-3"></i> Tích lũy thực tế
            </p>
          </div>

          <div class="p-5 rounded-2xl bg-secondary/40 border border-border/80">
            <p class="text-xs text-muted-foreground font-medium">Tổng số đơn hàng</p>
            <p class="font-heading text-2xl sm:text-3xl font-bold text-foreground mt-1">${orders.length}</p>
            <p class="text-[11px] text-muted-foreground mt-1">${completedOrdersCount} đơn đã giao thành công</p>
          </div>

          <div class="p-5 rounded-2xl bg-secondary/40 border border-border/80">
            <p class="text-xs text-muted-foreground font-medium">Sản phẩm đang bán</p>
            <p class="font-heading text-2xl sm:text-3xl font-bold text-foreground mt-1">${products.filter(p => p.is_active !== false).length} / ${products.length}</p>
            <p class="text-[11px] text-muted-foreground mt-1">4 nhóm danh mục</p>
          </div>

          <div class="p-5 rounded-2xl bg-secondary/40 border border-border/80">
            <p class="text-xs text-muted-foreground font-medium">Yêu cầu tư vấn da</p>
            <p class="font-heading text-2xl sm:text-3xl font-bold text-foreground mt-1">${consultations.length}</p>
            <p class="text-[11px] text-primary mt-1">${consultations.filter(c => c.status === 'Chưa xử lý').length} yêu cầu cần phản hồi</p>
          </div>
        </div>

        <!-- Admin Tabs -->
        <div class="border-b border-border/60 mb-6">
          <div class="flex gap-4">
            <button onclick="App.switchAdminTab('orders')" id="adm-tab-orders" class="admin-tab-btn pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 border-foreground text-foreground">
              Quản lý Đơn hàng (${orders.length})
            </button>
            <button onclick="App.switchAdminTab('products')" id="adm-tab-products" class="admin-tab-btn pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 border-transparent text-muted-foreground hover:text-foreground">
              Quản lý Sản phẩm (${products.length})
            </button>
            <button onclick="App.switchAdminTab('consultations')" id="adm-tab-consultations" class="admin-tab-btn pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 border-transparent text-muted-foreground hover:text-foreground">
              Yêu cầu Tư vấn da (${consultations.length})
            </button>
            <button onclick="App.switchAdminTab('wallet')" id="adm-tab-wallet" class="admin-tab-btn pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 border-transparent text-muted-foreground hover:text-foreground">
              Nạp ví (${pendingTopups} chờ)
            </button>
          </div>
        </div>

        <!-- TAB CONTENT: ORDERS -->
        <div id="adm-content-orders" class="admin-tab-pane space-y-4">
          <div class="border border-border/70 rounded-2xl bg-background overflow-hidden shadow-sm">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-secondary/40 border-b border-border text-muted-foreground uppercase tracking-wider text-[10px]">
                  <tr>
                    <th class="py-3.5 px-4 font-semibold">Mã đơn</th>
                    <th class="py-3.5 px-4 font-semibold">Khách hàng</th>
                    <th class="py-3.5 px-4 font-semibold">Sản phẩm</th>
                    <th class="py-3.5 px-4 font-semibold">Tổng tiền</th>
                    <th class="py-3.5 px-4 font-semibold">Thanh toán</th>
                    <th class="py-3.5 px-4 font-semibold">Trạng thái</th>
                    <th class="py-3.5 px-4 font-semibold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border/60">
                  ${orders.length === 0 ? '<tr><td colspan="7" class="py-10 px-4 text-center text-muted-foreground">Chưa có đơn hàng nào.</td></tr>' : ''}
                  ${orders.map(o => `
                    <tr class="hover:bg-secondary/20 transition">
                      <td class="py-3.5 px-4 font-mono font-medium text-foreground">
                        <div>${o.id}</div>
                        ${o.autoDispatched ? '<span class="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">⚡ Tự động xuất kho</span>' : ''}
                        ${o.trackingCode ? `<div class="font-mono text-[10px] text-blue-700 mt-0.5 font-semibold">${o.trackingCode}</div>` : ''}
                      </td>
                      <td class="py-3.5 px-4">
                        <p class="font-medium text-foreground">${o.customer.name}</p>
                        <p class="text-muted-foreground text-[11px]">${o.customer.phone}</p>
                        <p class="text-muted-foreground text-[10px] truncate max-w-xs">${o.customer.address}</p>
                      </td>
                      <td class="py-3.5 px-4">
                        ${o.items.map(it => `
                          <div class="text-[11px] text-foreground/90 truncate max-w-xs">• ${it.name} <span class="text-muted-foreground">x${it.quantity}</span></div>
                        `).join('')}
                      </td>
                      <td class="py-3.5 px-4 font-semibold text-foreground">${Store.formatMoney(o.total)}</td>
                      <td class="py-3.5 px-4 text-xs">
                        <p class="text-foreground/90">${o.paymentMethod}</p>
                        ${o.paymentStatus ? `<span class="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold ${o.paymentStatus.includes('Đã thanh toán') ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">${o.paymentStatus}</span>` : ''}
                        ${(o.customerClaimedPaid && !(o.paymentStatus && o.paymentStatus.includes('Đã thanh toán')) && o.status !== 'Đã hủy') ? `<span class="block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 animate-pulse">🔔 Khách báo đã chuyển khoản</span>` : ''}
                        ${(!(o.paymentStatus && o.paymentStatus.includes('Đã thanh toán')) && o.status !== 'Đã hủy') ? `
                          <button type="button" onclick="App.confirmOrderPaid('${o.id}')" class="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-semibold transition">
                            <i data-lucide="check" class="w-3 h-3"></i> Xác nhận đã thanh toán
                          </button>` : ''}
                      </td>
                      <td class="py-3.5 px-4">
                        <select onchange="Store.updateOrderStatus('${o.id}', this.value); App.renderAdminPage();" class="px-2.5 py-1 rounded-md border border-border text-[11px] font-medium ${
                          o.status === 'Đã giao' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          o.status === 'Đang giao' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          o.status === 'Đã hủy' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }">
                          <option value="Chờ xác nhận" ${o.status === 'Chờ xác nhận' ? 'selected' : ''}>Chờ xác nhận</option>
                          <option value="Đang chuẩn bị" ${o.status === 'Đang chuẩn bị' ? 'selected' : ''}>Đang chuẩn bị</option>
                          <option value="Đang giao" ${o.status === 'Đang giao' ? 'selected' : ''}>🚚 Đang giao (GHTK)</option>
                          <option value="Đã giao" ${o.status === 'Đã giao' ? 'selected' : ''}>Đã giao</option>
                          <option value="Đã hủy" ${o.status === 'Đã hủy' ? 'selected' : ''}>Đã hủy</option>
                        </select>
                      </td>
                      <td class="py-3.5 px-4 text-right">
                        <button type="button" onclick="App.deleteOrder('${o.id}')" class="text-muted-foreground hover:text-destructive transition p-1" title="Xóa đơn hàng" aria-label="Xóa đơn hàng ${o.id}">
                          <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- TAB CONTENT: PRODUCTS -->
        <div id="adm-content-products" class="admin-tab-pane hidden space-y-4">
          <div class="border border-border/70 rounded-2xl bg-background overflow-hidden shadow-sm">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-secondary/40 border-b border-border text-muted-foreground uppercase tracking-wider text-[10px]">
                  <tr>
                    <th class="py-3.5 px-4 font-semibold">Ảnh</th>
                    <th class="py-3.5 px-4 font-semibold">Tên sản phẩm</th>
                    <th class="py-3.5 px-4 font-semibold">Danh mục</th>
                    <th class="py-3.5 px-4 font-semibold">Giá bán (đ)</th>
                    <th class="py-3.5 px-4 font-semibold">Tồn kho</th>
                    <th class="py-3.5 px-4 font-semibold">Đánh giá</th>
                    <th class="py-3.5 px-4 font-semibold">Bán</th>
                    <th class="py-3.5 px-4 font-semibold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border/60">
                  ${products.map(p => `
                    <tr class="hover:bg-secondary/20 transition">
                      <td class="py-2.5 px-4">
                        <img src="${p.image}" alt="${p.name}" class="w-10 h-12 object-cover rounded bg-secondary border border-border/40" />
                      </td>
                      <td class="py-2.5 px-4 font-medium text-foreground">
                        <a href="#/san-pham/${p.slug}" class="hover:text-primary transition">${p.name}</a>
                        <p class="text-[10px] text-muted-foreground">${p.volume || ''}</p>
                      </td>
                      <td class="py-2.5 px-4 text-muted-foreground">${p.category}</td>
                      <td class="py-2.5 px-4">
                        <input type="number" step="10000" value="${p.price}" onchange="Store.updateProduct('${p.id}', { price: Number(this.value) })" class="w-24 px-2 py-1 rounded border border-border bg-background text-xs font-semibold focus:outline-none" />
                      </td>
                      <td class="py-2.5 px-4">
                        <input type="number" value="${p.stock}" onchange="Store.updateProduct('${p.id}', { stock: Number(this.value) })" class="w-16 px-2 py-1 rounded border border-border bg-background text-xs text-center focus:outline-none" />
                      </td>
                      <td class="py-2.5 px-4 text-muted-foreground">${p.rating} ★ (${p.reviews_count})</td>
                      <td class="py-2.5 px-4">
                        <input type="checkbox" ${p.is_active !== false ? 'checked' : ''} onchange="Store.updateProduct('${p.id}', { is_active: this.checked })" class="rounded text-primary focus:ring-0" />
                      </td>
                      <td class="py-2.5 px-4 text-right">
                        <button onclick="if(confirm('Xoá sản phẩm này?')) { Store.deleteProduct('${p.id}'); App.renderAdminPage(); }" class="text-muted-foreground hover:text-destructive transition p-1" title="Xoá">
                          <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- TAB CONTENT: CONSULTATIONS -->
        <div id="adm-content-consultations" class="admin-tab-pane hidden space-y-4">
          <div class="border border-border/70 rounded-2xl bg-background overflow-hidden shadow-sm">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-secondary/40 border-b border-border text-muted-foreground uppercase tracking-wider text-[10px]">
                  <tr>
                    <th class="py-3.5 px-4 font-semibold">Khách hàng</th>
                    <th class="py-3.5 px-4 font-semibold">Loại da</th>
                    <th class="py-3.5 px-4 font-semibold">Tình trạng & Vấn đề da</th>
                    <th class="py-3.5 px-4 font-semibold">Sản phẩm đang dùng</th>
                    <th class="py-3.5 px-4 font-semibold">Trạng thái</th>
                    <th class="py-3.5 px-4 font-semibold text-right">Xóa</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border/60">
                  ${consultations.length === 0 ? '<tr><td colspan="6" class="py-10 text-center text-muted-foreground">Chưa có yêu cầu tư vấn nào.</td></tr>' : ''}
                  ${consultations.map(c => `
                    <tr class="hover:bg-secondary/20 transition">
                      <td class="py-3.5 px-4">
                        <p class="font-medium text-foreground">${c.name}</p>
                        <p class="text-muted-foreground text-[11px]">${c.phone}</p>
                        ${c.email ? `<p class="text-muted-foreground text-[10px]">${c.email}</p>` : ''}
                      </td>
                      <td class="py-3.5 px-4 font-medium text-foreground">${c.skin_type}</td>
                      <td class="py-3.5 px-4 text-muted-foreground max-w-sm leading-relaxed">${c.concerns}</td>
                      <td class="py-3.5 px-4 text-muted-foreground max-w-xs">${c.current_routine || 'Chưa ghi rõ'}</td>
                      <td class="py-3.5 px-4">
                        <select onchange="Store.updateConsultationStatus('${c.id}', this.value); App.renderAdminPage();" class="px-2.5 py-1 rounded-md border border-border text-[11px] font-medium ${
                          c.status === 'Đã tư vấn' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                        }">
                          <option value="Chưa xử lý" ${c.status === 'Chưa xử lý' ? 'selected' : ''}>Chưa xử lý</option>
                          <option value="Đã liên hệ" ${c.status === 'Đã liên hệ' ? 'selected' : ''}>Đã liên hệ</option>
                          <option value="Đã tư vấn" ${c.status === 'Đã tư vấn' ? 'selected' : ''}>Đã tư vấn</option>
                        </select>
                      </td>
                      <td class="py-3.5 px-4 text-right">
                        <button type="button" onclick="App.deleteConsultation('${c.id}')" class="text-muted-foreground hover:text-destructive transition p-1" title="Xóa yêu cầu này" aria-label="Xóa yêu cầu tư vấn của ${String(c.name).replace(/"/g,'&quot;')}">
                          <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- TAB CONTENT: WALLET TOPUPS -->
        <div id="adm-content-wallet" class="admin-tab-pane hidden space-y-4">
          <div class="border border-border/70 rounded-2xl bg-background overflow-hidden shadow-sm">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-secondary/40 border-b border-border text-muted-foreground uppercase tracking-wider text-[10px]">
                  <tr>
                    <th class="py-3.5 px-4 font-semibold">Mã nạp</th>
                    <th class="py-3.5 px-4 font-semibold">Khách hàng</th>
                    <th class="py-3.5 px-4 font-semibold">Số tiền</th>
                    <th class="py-3.5 px-4 font-semibold">Thời gian</th>
                    <th class="py-3.5 px-4 font-semibold">Trạng thái</th>
                    <th class="py-3.5 px-4 font-semibold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border/60">
                  ${topups.length === 0 ? '<tr><td colspan="6" class="py-10 text-center text-muted-foreground">Chưa có yêu cầu nạp ví nào.</td></tr>' : ''}
                  ${topups.map(t => `
                    <tr class="hover:bg-secondary/20 transition">
                      <td class="py-3.5 px-4 font-mono font-medium text-foreground">${walletEsc(t.id)}</td>
                      <td class="py-3.5 px-4">
                        <p class="font-medium text-foreground">${walletEsc(t.userName)}</p>
                        <p class="text-muted-foreground text-[11px]">${walletEsc(t.userEmail)} · ví hiện có ${Store.formatMoney(Store.getBalance(t.userId))}</p>
                      </td>
                      <td class="py-3.5 px-4 font-semibold text-foreground">${Store.formatMoney(t.amount)}</td>
                      <td class="py-3.5 px-4 text-muted-foreground">${walletEsc(new Date(t.createdAt).toLocaleString('vi-VN'))}</td>
                      <td class="py-3.5 px-4">
                        <span class="px-2.5 py-1 rounded-md border text-[11px] font-medium ${
                          t.status === 'Đã cộng tiền' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : t.status === 'Chờ xác nhận' ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-secondary text-muted-foreground border-border'
                        }">${walletEsc(t.status)}</span>
                      </td>
                      <td class="py-3.5 px-4 text-right whitespace-nowrap">
                        ${t.status === 'Chờ xác nhận' ? `
                          <button type="button" onclick="App.approveTopup('${walletEsc(t.id)}')" class="px-3 py-1.5 rounded-full bg-foreground text-background text-[11px] font-semibold hover:bg-foreground/90 transition">Đã nhận tiền · Cộng ví</button>
                          <button type="button" onclick="App.rejectTopup('${walletEsc(t.id)}')" class="ml-1 px-3 py-1.5 rounded-full border border-border text-[11px] font-medium hover:bg-secondary transition">Từ chối</button>` : ''}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;

    renderIcons();
  }

  function switchAdminTab(tabKey) {
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
      btn.classList.remove('border-foreground', 'text-foreground');
      btn.classList.add('border-transparent', 'text-muted-foreground');
    });
    document.querySelectorAll('.admin-tab-pane').forEach(pane => {
      pane.classList.add('hidden');
    });

    const activeBtn = document.getElementById(`adm-tab-${tabKey}`);
    const activePane = document.getElementById(`adm-content-${tabKey}`);
    if (activeBtn) {
      activeBtn.classList.add('border-foreground', 'text-foreground');
      activeBtn.classList.remove('border-transparent', 'text-muted-foreground');
    }
    if (activePane) {
      activePane.classList.remove('hidden');
    }
  }

  function openAddProductModal() {
    const modal = document.createElement('div');
    modal.id = 'add-product-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-sm';
    modal.innerHTML = `
      <div class="max-w-lg w-full bg-background rounded-3xl p-6 sm:p-8 shadow-2xl border border-border space-y-4 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-2 border-b border-border/60">
          <h3 class="font-heading text-2xl text-foreground">Thêm công thức sản phẩm mới</h3>
          <button onclick="document.getElementById('add-product-modal').remove()" class="text-muted-foreground hover:text-foreground">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form onsubmit="App.handleAddProductSubmit(event)" class="space-y-4 text-xs">
          <div>
            <label class="block font-medium mb-1">Tên sản phẩm *</label>
            <input type="text" name="name" required placeholder="Ví dụ: Tinh Chất Phục Hồi B5 10%" class="w-full px-3.5 py-2 rounded-lg border border-border bg-background focus:outline-none" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-medium mb-1">Danh mục *</label>
              <select name="category" required class="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none">
                <option value="Chăm sóc da">Chăm sóc da</option>
                <option value="Làm sạch">Làm sạch</option>
                <option value="Chống nắng">Chống nắng</option>
                <option value="Trang điểm">Trang điểm</option>
              </select>
            </div>
            <div>
              <label class="block font-medium mb-1">Dung tích</label>
              <input type="text" name="volume" placeholder="Ví dụ: 30ml, 50ml" class="w-full px-3.5 py-2 rounded-lg border border-border bg-background focus:outline-none" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-medium mb-1">Giá bán (đ) *</label>
              <input type="number" name="price" required step="1000" placeholder="850000" class="w-full px-3.5 py-2 rounded-lg border border-border bg-background focus:outline-none" />
            </div>
            <div>
              <label class="block font-medium mb-1">Số lượng kho</label>
              <input type="number" name="stock" value="50" class="w-full px-3.5 py-2 rounded-lg border border-border bg-background focus:outline-none" />
            </div>
          </div>

          <div>
            <label class="block font-medium mb-1">Khẩu hiệu / Tagline</label>
            <input type="text" name="tagline" placeholder="Làm dịu tức thì, tái tạo hàng rào bảo vệ" class="w-full px-3.5 py-2 rounded-lg border border-border bg-background focus:outline-none" />
          </div>

          <div>
            <label class="block font-medium mb-1">Thành phần hoạt chất (cách nhau bởi dấu phẩy)</label>
            <input type="text" name="ingredients" placeholder="Panthenol 10%, Centella Asiatica, Madecassoside" class="w-full px-3.5 py-2 rounded-lg border border-border bg-background focus:outline-none" />
          </div>

          <div>
            <label class="block font-medium mb-1">Mô tả sản phẩm</label>
            <textarea name="description" rows="3" placeholder="Mô tả công dụng và cơ chế hoạt chất..." class="w-full px-3.5 py-2 rounded-lg border border-border bg-background focus:outline-none"></textarea>
          </div>

          <div class="pt-3 flex justify-end gap-2">
            <button type="button" onclick="document.getElementById('add-product-modal').remove()" class="px-4 py-2 rounded-full border border-border text-xs">Huỷ</button>
            <button type="submit" class="px-6 py-2 rounded-full bg-foreground text-background text-xs font-semibold uppercase tracking-wider">Lưu sản phẩm</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
    renderIcons();
  }

  function handleAddProductSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    const ingString = formData.get('ingredients') || '';
    const ingredients = ingString.split(',').map(s => s.trim()).filter(Boolean);

    Store.addProduct({
      name: formData.get('name'),
      category: formData.get('category'),
      volume: formData.get('volume') || '30ml',
      price: Number(formData.get('price')),
      stock: Number(formData.get('stock')) || 50,
      tagline: formData.get('tagline'),
      description: formData.get('description'),
      ingredients: ingredients.length > 0 ? ingredients : ['Hoạt chất tiêu chuẩn'],
      image: 'assets/images/logo.png',
      how_to_use: 'Sử dụng hàng ngày sau bước làm sạch.'
    });

    document.getElementById('add-product-modal')?.remove();
    showToast('Đã thêm sản phẩm mới thành công!');
    renderAdminPage();
  }

  // --- CONSULTATION FORM SUBMISSION ---
  function handleConsultationSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    Store.addConsultation({
      name: formData.get('name'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      skin_type: formData.get('skin_type'),
      concerns: formData.get('concerns'),
      current_routine: formData.get('current_routine')
    });

    form.reset();
  }

  // Xóa đơn hàng (chỉ quản trị viên)
  function deleteOrder(orderId) {
    if (!(window.Auth && Auth.isAdmin())) {
      showToast('Chỉ quản trị viên mới được xóa đơn hàng', 'error');
      return;
    }
    const order = Store.getOrders().find(o => o.id === orderId);
    if (!order) return;
    const who = order.customer && order.customer.name ? ' của ' + order.customer.name : '';
    if (!confirm('Xóa vĩnh viễn đơn ' + orderId + who + '?\nThao tác này không thể hoàn tác.')) return;
    if (Store.deleteOrder(orderId)) {
      showToast('Đã xóa đơn ' + orderId);
      renderAdminPage();
    }
  }

  // Admin xác nhận thủ công đã nhận tiền cho đơn
  function confirmOrderPaid(orderId) {
    if (!(window.Auth && Auth.isAdmin())) {
      showToast('Chỉ quản trị viên mới được xác nhận thanh toán', 'error');
      return;
    }
    const order = Store.getOrders().find(o => o.id === orderId);
    if (!order) return;
    if (!confirm('Xác nhận đã nhận ' + Store.formatMoney(order.total) + ' cho đơn ' + orderId + '?\nHãy đối chiếu với sao kê ngân hàng trước khi xác nhận.')) return;
    if (Store.confirmOrderPaidManual(orderId)) {
      // Báo máy chủ để máy của khách tự hiện "Thanh toán thành công" và đóng mã QR
      const payBase = getPayApiBase();
      if (payBase) {
        fetch(payBase + '/api/payments/' + encodeURIComponent(orderId) + '/paid', { method: 'POST' }).catch(() => { /* máy chủ tắt: bỏ qua */ });
      }
      showToast('Đã xác nhận thanh toán đơn ' + orderId);
      renderAdminPage();
    }
  }

  // Xóa yêu cầu tư vấn (chỉ quản trị viên)
  function deleteConsultation(id) {
    if (!(window.Auth && Auth.isAdmin())) {
      showToast('Chỉ quản trị viên mới được xóa yêu cầu tư vấn', 'error');
      return;
    }
    const item = Store.getConsultations().find(c => c.id === id);
    if (!item) return;
    if (!confirm('Xóa vĩnh viễn yêu cầu tư vấn của ' + item.name + '?\nThao tác này không thể hoàn tác.')) return;
    if (Store.deleteConsultation(id)) {
      showToast('Đã xóa yêu cầu tư vấn của ' + item.name);
      renderAdminPage();
      switchAdminTab('consultations');
    }
  }

  // Địa chỉ payment-server: nếu cấu hình là localhost nhưng trang đang mở bằng IP/tên miền khác (điện thoại, máy khác) thì dùng đúng host đó
  function getPayApiBase() {
    const raw = String(window.PAYMENT_API || '').replace(/\/+$/, '');
    if (!raw) return '';
    try {
      const u = new URL(raw);
      const local = ['localhost', '127.0.0.1'];
      if (local.includes(u.hostname) && !local.includes(window.location.hostname)) u.hostname = window.location.hostname;
      return u.origin;
    } catch (e) { return raw; }
  }

  // --- THÔNG BÁO CHO ADMIN KHI KHÁCH BẤM "TÔI ĐÃ THANH TOÁN" ---
  const seenClaims = new Set(
    Store.getOrders().filter(o => o.customerClaimedPaid).map(o => o.id)
  );
  function announceClaim(orderId, total, customerName) {
    if (seenClaims.has(orderId)) return false;
    seenClaims.add(orderId);
    showToast('🔔 Khách báo đã chuyển khoản ' + Store.formatMoney(total) + ' cho đơn ' + orderId);
    playSuccessChime();
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('TranAnh Skin - Khách đã thanh toán', {
          body: 'Đơn ' + orderId + ' · ' + Store.formatMoney(total) + (customerName ? ' · ' + customerName : ''),
          tag: 'claim-' + orderId
        });
      }
    } catch (e) { /* trình duyệt không cho phép thông báo hệ thống */ }
    return true;
  }
  function refreshOrdersPaneIfOpen() {
    if (/^#\/admin/.test(window.location.hash)) {
      const pane = document.getElementById('adm-content-orders');
      if (pane && !pane.classList.contains('hidden')) renderAdminPage();
    }
  }
  function notifyAdminOfClaims() {
    if (!(window.Auth && Auth.isAdmin())) return;
    let fresh = false;
    Store.getOrders().forEach(o => {
      if (!o.customerClaimedPaid) return;
      if (o.paymentStatus && o.paymentStatus.includes('Đã thanh toán')) { seenClaims.add(o.id); return; }
      if (announceClaim(o.id, o.total, o.customer && o.customer.name)) fresh = true;
    });
    if (fresh) refreshOrdersPaneIfOpen();
  }
  // Admin đăng nhập ở máy nào cũng hỏi payment-server mỗi 4 giây để biết khách vừa bấm "Tôi đã thanh toán"
  let claimsPolling = false;
  async function pollClaimsFromServer() {
    if (claimsPolling) return;
    if (!(window.Auth && Auth.isAdmin())) return;
    const base = getPayApiBase();
    if (!base) return;
    claimsPolling = true;
    try {
      const r = await fetch(base + '/api/claims', { cache: 'no-store' });
      if (!r.ok) return;
      const d = await r.json();
      let fresh = false;
      (d.claims || []).forEach(c => {
        if (!c || !c.orderId) return;
        const local = Store.getOrders().find(o => o.id === c.orderId);
        if (local && local.paymentStatus && local.paymentStatus.includes('Đã thanh toán')) { seenClaims.add(c.orderId); return; }
        if (announceClaim(c.orderId, Number(c.amount) || (local && local.total) || 0, c.customerName || (local && local.customer && local.customer.name))) fresh = true;
      });
      if (fresh) refreshOrdersPaneIfOpen();
    } catch (e) { /* máy chủ tắt hoặc chưa hỗ trợ /api/claims: bỏ qua */ }
    finally { claimsPolling = false; }
  }
  setInterval(pollClaimsFromServer, 4000);
  Store.on('orders:changed', notifyAdminOfClaims);

  // Đơn mới từ khách (mọi thiết bị) vừa về máy chủ: tự làm mới trang quản trị, giữ nguyên tab đang xem
  Store.on('orders:remote', function () {
    if (!/^#\/admin/.test(window.location.hash)) return;
    if (!(window.Auth && Auth.isAdmin())) return;
    if (document.querySelector('#add-product-modal, [id^="edit-product"]')) return; // đang sửa sản phẩm: không làm gián đoạn
    const active = document.querySelector('.admin-tab-btn.border-foreground');
    const key = active && active.id ? active.id.replace('adm-tab-', '') : 'orders';
    const y = window.scrollY;
    renderAdminPage();
    switchAdminTab(key);
    window.scrollTo(0, y);
    if (window.lucide && lucide.createIcons) lucide.createIcons();
  });

  // --- GLOBAL EXPORTS ---
  window.App = {
    confirmOrderPaid,
    deleteConsultation,
    deleteOrder,
    openCartDrawer,
    closeCartDrawer,
    setShopFilter,
    adjustDetailQty,
    addDetailToCart,
    handleReviewSubmit,
    applyCoupon,
    handleCheckout,
    showTopupModal,
    approveTopup,
    rejectTopup,
    handleConsultationSubmit,
    renderAdminPage,
    switchAdminTab,
    openAddProductModal,
    handleAddProductSubmit,
    copyToClipboard
  };

  // --- INIT LISTENERS ---
  window.addEventListener('hashchange', router);
  window.addEventListener('DOMContentLoaded', () => {
    router();
    updateCartBadge();
    renderIcons();
  });

})();
