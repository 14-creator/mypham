/**
 * TranAnh Skin — Các trang mới (song ngữ Vi/En)
 *   #/gioi-thieu      Giới thiệu thương hiệu
 *   #/bai-viet        Danh sách bài viết  |  #/bai-viet/:slug  Chi tiết bài viết
 *   #/faq             Câu hỏi thường gặp
 *   #/lien-he         Liên hệ (gửi vào mục "Yêu cầu tư vấn" của Admin)
 *   #/tra-cuu-don     Tra cứu đơn hàng bằng mã đơn + số điện thoại
 * Router của app.js gọi Pages.handle(hash); trả về true nếu hash thuộc trang mới.
 */
(function () {
  'use strict';

  var t = function (x) { return window.I18n ? I18n.t(x) : (x && typeof x === 'object' ? x.vi : x); };
  var L = function (vi, en) { return { vi: vi, en: en }; };
  var current = null;                       // { render: fn } của trang đang mở

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function icons() { if (window.lucide && lucide.createIcons) lucide.createIcons(); }
  function money(n) { return window.Store ? Store.formatMoney(n) : String(n); }
  function mount(html) {
    var el = document.getElementById('app-content');
    if (el) { el.innerHTML = html; icons(); }
  }
  function crumb(label) {
    return '<nav class="pg-crumb"><a href="#/">' + t(L('Trang chủ', 'Home')) + '</a><span>/</span><b>' + label + '</b></nav>';
  }
  function productImage(slug) {
    var all = window.Store ? Store.getProducts() : [];
    var p = all.filter(function (x) { return x.slug === slug; })[0];
    return (p && p.image) || 'assets/images/hero-banner.png';
  }

  /* =====================================================  DỮ LIỆU  ===================================================== */

  var POSTS = [
    {
      slug: 'vitamin-c-sang-hay-toi', img: 'tinh-chat-vitamin-c-15', min: 5,
      tag: L('Hoạt chất', 'Actives'),
      title: L('Vitamin C 15%: dùng sáng hay tối để da sáng đều hơn?', 'Vitamin C 15%: morning or evening for brighter, more even skin?'),
      ex: L('Thứ tự thoa, nồng độ phù hợp và lý do vitamin C luôn đi cùng chống nắng.', 'Application order, the right concentration and why vitamin C always goes with sunscreen.'),
      body: [
        { p: L('Vitamin C là chất chống oxy hóa. Dùng vào buổi sáng, nó hỗ trợ da trước các gốc tự do sinh ra do tia UV và ô nhiễm; dùng buổi tối, da vẫn hưởng lợi nếu bạn dung nạp tốt. Điều quan trọng hơn thời điểm là dùng đều đặn mỗi ngày.', 'Vitamin C is an antioxidant. In the morning it helps the skin against free radicals produced by UV and pollution; in the evening the skin still benefits if you tolerate it well. Consistency matters more than timing.') },
        { h: L('Thứ tự thoa', 'Order of application'), p: L('Sau bước làm sạch, thoa vài giọt lên da khô, chờ khoảng 30 giây rồi mới đến kem dưỡng. Ban ngày luôn kết thúc bằng kem chống nắng: vitamin C bổ trợ chứ không thay thế chống nắng.', 'After cleansing, apply a few drops to dry skin, wait about 30 seconds, then moisturise. In the daytime always finish with sunscreen: vitamin C complements sunscreen, it does not replace it.') },
        { h: L('Nếu da hay châm chích', 'If your skin stings easily'), p: L('Bắt đầu cách ngày, tăng dần khi da quen. Nếu đỏ rát kéo dài, hãy giảm tần suất hoặc tạm dừng và hỏi ý kiến chuyên viên da liễu.', 'Start every other day and increase as your skin adapts. If redness or burning persists, reduce frequency or pause and ask a dermatology specialist.') },
        { h: L('Bảo quản', 'Storage'), p: L('Đậy kín nắp, tránh nắng và nhiệt. Dung dịch chuyển sang màu nâu sẫm là dấu hiệu đã oxy hóa mạnh, nên thay lọ mới.', 'Keep the cap tightly closed, away from sun and heat. A solution that turns dark brown has oxidised heavily and should be replaced.') }
      ],
      product: 'tinh-chat-vitamin-c-15'
    },
    {
      slug: 'ceramide-phuc-hoi-hang-rao', img: 'kem-duong-phuc-hoi-ceramide', min: 4,
      tag: L('Da nhạy cảm', 'Sensitive skin'),
      title: L('Ceramide giúp phục hồi hàng rào bảo vệ da như thế nào', 'How ceramides help repair the skin barrier'),
      ex: L('Dấu hiệu da tổn thương và cách xây lại nền da trong vài tuần.', 'Signs of a damaged barrier and how to rebuild it over a few weeks.'),
      body: [
        { p: L('Lớp sừng ngoài cùng của da giống như bức tường gạch: tế bào là gạch, còn ceramide, cholesterol và acid béo là vữa gắn kết. Khi lớp “vữa” này thiếu hụt, da mất nước nhanh và dễ kích ứng.', 'The outermost layer of skin works like a brick wall: cells are the bricks, while ceramides, cholesterol and fatty acids are the mortar. When the mortar runs short, skin loses water quickly and irritates easily.') },
        { h: L('Dấu hiệu hàng rào da yếu', 'Signs of a weak barrier'), p: L('Da căng rát sau khi rửa mặt, châm chích khi thoa sản phẩm quen thuộc, đỏ, bong tróc nhẹ hoặc phản ứng với nhiều thứ cùng lúc.', 'Tightness after washing, stinging with products you used to tolerate, redness, mild flaking, or reacting to many things at once.') },
        { h: L('Cách xây lại nền da', 'How to rebuild'), p: L('Tạm dừng các hoạt chất mạnh (acid, retinoid) trong một thời gian, dùng sữa rửa mặt dịu nhẹ, thoa kem dưỡng chứa ceramide sáng và tối, và chống nắng mỗi sáng. Da thường cải thiện sau vài tuần; nếu không đỡ, hãy gặp bác sĩ da liễu.', 'Pause strong actives (acids, retinoids) for a while, use a gentle cleanser, apply a ceramide moisturiser morning and night, and wear sunscreen every morning. Skin usually improves within a few weeks; if it does not, see a dermatologist.') }
      ],
      product: 'kem-duong-phuc-hoi-ceramide'
    },
    {
      slug: 'spf50-trong-nha', img: 'kem-chong-nang-pho-rong-spf50', min: 3,
      tag: L('Chống nắng', 'Sun care'),
      title: L('SPF50+ PA++++ có cần thoa lại khi ngồi trong nhà?', 'Do you need to reapply SPF50+ PA++++ indoors?'),
      ex: L('Cửa kính, ánh sáng trong nhà và lượng kem chống nắng đúng cho cả khuôn mặt.', 'Window glass, indoor light and the right amount of sunscreen for the whole face.'),
      body: [
        { p: L('Kính cửa sổ chặn phần lớn UVB nhưng vẫn để lọt một phần UVA, loại tia góp phần gây lão hóa và sạm da. Vì vậy nếu bạn ngồi gần cửa sổ nhiều giờ, thoa chống nắng buổi sáng vẫn rất cần thiết.', 'Window glass blocks most UVB but lets some UVA through, the rays that contribute to ageing and pigmentation. So if you sit near a window for hours, a morning layer of sunscreen is still important.') },
        { h: L('Lượng thoa', 'How much to apply'), p: L('Khoảng hai đốt ngón tay (quy tắc hai ngón) cho mặt và cổ. Thoa quá mỏng sẽ không đạt mức bảo vệ ghi trên nhãn.', 'About two finger-lengths (the two-finger rule) for face and neck. Applying too thinly will not reach the protection stated on the label.') },
        { h: L('Khi nào cần thoa lại', 'When to reapply'), p: L('Ngoài trời: sau mỗi 2–3 giờ, và sau khi đổ mồ hôi nhiều hoặc bơi. Trong nhà, xa cửa sổ: lớp thoa buổi sáng thường là đủ.', 'Outdoors: every 2–3 hours, and after heavy sweating or swimming. Indoors and away from windows: the morning layer is usually enough.') }
      ],
      product: 'kem-chong-nang-pho-rong-spf50'
    },
    {
      slug: 'retinal-bat-dau-nhu-the-nao', img: 'tinh-chat-retinal-01', min: 5,
      tag: L('Hoạt chất', 'Actives'),
      title: L('Retinal 0.1%: bắt đầu thế nào để da không bị kích ứng', 'Retinal 0.1%: how to start without irritating your skin'),
      ex: L('Tần suất, lượng dùng và những lưu ý quan trọng khi mới làm quen với retinoid.', 'Frequency, amount and key precautions when you are new to retinoids.'),
      body: [
        { p: L('Retinal là dạng retinoid chỉ cách axit retinoic một bước chuyển hóa nên thường cho tác dụng nhanh hơn retinol, nhưng da cũng cần thời gian làm quen.', 'Retinal is a retinoid only one conversion step away from retinoic acid, so it usually acts faster than retinol, but skin also needs time to adapt.') },
        { h: L('Lộ trình gợi ý', 'Suggested ramp-up'), p: L('Tuần đầu 2 tối, lượng bằng hạt đậu cho cả mặt, thoa lên da khô sau khi làm sạch, rồi dưỡng ẩm. Nếu da ổn, tăng dần lên cách đêm rồi mỗi tối.', 'In week one use 2 nights, a pea-sized amount for the whole face, on dry skin after cleansing, then moisturise. If your skin is comfortable, move up to every other night, then nightly.') },
        { h: L('Lưu ý', 'Precautions'), p: L('Một chút khô hoặc bong nhẹ lúc đầu là thường gặp. Dùng chống nắng mỗi sáng. Không tự ý dùng khi mang thai hoặc cho con bú, hãy hỏi bác sĩ.', 'Slight dryness or peeling at the start is common. Wear sunscreen every morning. Do not use it on your own during pregnancy or breastfeeding; ask your doctor.') }
      ],
      product: 'tinh-chat-retinal-01'
    },
    {
      slug: 'sua-rua-mat-ph-5-5', img: 'sua-rua-mat-amino-acid', min: 3,
      tag: L('Làm sạch', 'Cleansing'),
      title: L('Vì sao sữa rửa mặt pH 5.5 quan trọng với làn da', 'Why a pH 5.5 cleanser matters for your skin'),
      ex: L('Màng hydrolipid, độ pH và cách rửa mặt đúng trong 60 giây.', 'The hydrolipid film, pH and how to cleanse properly in 60 seconds.'),
      body: [
        { p: L('Bề mặt da khỏe mạnh có tính axit nhẹ, khoảng pH 4.5–5.5. Sữa rửa mặt có độ pH gần mức này ít làm xáo trộn màng hydrolipid, giúp da bớt khô căng sau khi rửa.', 'Healthy skin is mildly acidic, around pH 4.5–5.5. A cleanser close to this level disturbs the hydrolipid film less and leaves skin less tight after washing.') },
        { h: L('Rửa mặt đúng cách', 'Cleansing the right way'), p: L('Dùng nước ấm, massage nhẹ khoảng 60 giây rồi xả sạch. Rửa hai lần mỗi ngày là đủ; rửa quá nhiều sẽ làm da yếu đi.', 'Use lukewarm water, massage gently for about 60 seconds, then rinse thoroughly. Twice a day is enough; over-washing weakens the skin.') }
      ],
      product: 'sua-rua-mat-amino-acid'
    },
    {
      slug: 'nghi-thuc-3-buoc', img: null, min: 4,
      tag: L('Nghi thức', 'Routine'),
      title: L('Nghi thức 3 bước: làm sạch, điều trị, bảo vệ', 'The 3-step routine: cleanse, treat, protect'),
      ex: L('Một nền tảng đơn giản và cách thêm hoạt chất mới an toàn.', 'A simple foundation and how to add new actives safely.'),
      body: [
        { p: L('Chăm sóc da hiệu quả không cần nhiều bước. Sáng: làm sạch dịu nhẹ, hoạt chất (ví dụ vitamin C), dưỡng ẩm, chống nắng. Tối: làm sạch, hoạt chất (retinal hoặc BHA theo nhu cầu), dưỡng ẩm.', 'Effective skincare does not need many steps. Morning: gentle cleanse, an active (for example vitamin C), moisturiser, sunscreen. Evening: cleanse, an active (retinal or BHA as needed), moisturiser.') },
        { h: L('Thêm hoạt chất mới', 'Adding a new active'), p: L('Chỉ thêm một sản phẩm mới mỗi lần. Thử trước ở vùng da nhỏ (sau tai hoặc mặt trong cẳng tay) trong 24–48 giờ, và chờ 2–4 tuần mới đánh giá kết quả.', 'Add only one new product at a time. Patch-test first on a small area (behind the ear or inner forearm) for 24–48 hours, and wait 2–4 weeks before judging results.') }
      ],
      product: null
    }
  ];

  var FAQ = [
    { g: L('Đặt hàng & thanh toán', 'Orders & payment'), items: [
      { q: L('Tôi có thể thanh toán bằng những cách nào?', 'How can I pay?'), a: L('Ví TranAnh, chuyển khoản QR ngân hàng (VietQR) hoặc thanh toán khi nhận hàng (COD). Bạn cần có tài khoản để đặt hàng.', 'TranAnh Wallet, bank transfer via QR (VietQR) or cash on delivery (COD). You need an account to place an order.') },
      { q: L('Các mã giảm giá hiện có?', 'Which promo codes are available?'), a: L('TRANANH10 giảm 10% tổng đơn, GLOW50 giảm trực tiếp 50.000 đ, FREESHIP miễn phí vận chuyển.', 'TRANANH10 gives 10% off the order, GLOW50 gives 50,000 đ off, FREESHIP gives free shipping.') },
      { q: L('Làm sao để theo dõi đơn hàng?', 'How do I track my order?'), a: L('Vào trang <a href="#/tra-cuu-don">Tra cứu đơn hàng</a>, nhập mã đơn (dạng TAS-2026-xxxx) và số điện thoại nhận hàng.', 'Go to the <a href="#/tra-cuu-don">Track order</a> page and enter your order code (like TAS-2026-xxxx) and the delivery phone number.') }
    ]},
    { g: L('Vận chuyển & đổi trả', 'Shipping & returns'), items: [
      { q: L('Phí và thời gian giao hàng như thế nào?', 'What are the shipping fees and times?'), a: L('Miễn phí cho đơn từ 500.000 đ; dưới mức này phí đồng giá 30.000 đ. Nội thành Hà Nội và TP.HCM giao trong 2–4 giờ (hỏa tốc) hoặc 24 giờ; tỉnh khác 2–3 ngày làm việc.', 'Free for orders from 500,000 đ; below that a flat fee of 30,000 đ applies. Inner Hanoi and HCMC: 2–4 hours (express) or 24 hours; other provinces 2–3 working days.') },
      { q: L('Tôi có thể đổi trả không?', 'Can I return a product?'), a: L('Có, trong 7 ngày với sản phẩm còn nguyên tem niêm phong hoặc khi da kích ứng đã được chuyên viên tư vấn. Hoàn tiền trong 24–48 giờ làm việc sau khi nhận lại hàng. Chi tiết tại <a href="#/chinh-sach">trang chính sách</a>.', 'Yes, within 7 days for products with intact seals, or when irritation has been reviewed by a specialist. Refunds within 24–48 working hours after we receive the item. Details on the <a href="#/chinh-sach">policy page</a>.') }
    ]},
    { g: L('Sản phẩm & cách dùng', 'Products & usage'), items: [
      { q: L('Tôi nên bắt đầu với sản phẩm nào?', 'Which product should I start with?'), a: L('Bắt đầu với nền tảng 3 bước: sữa rửa mặt dịu nhẹ, một hoạt chất phù hợp mục tiêu da, và kem chống nắng. Nếu chưa chắc, hãy gửi yêu cầu ở <a href="#/lien-he">trang liên hệ</a> để được tư vấn.', 'Start with the 3-step foundation: a gentle cleanser, one active matched to your goal, and sunscreen. If unsure, send a request on the <a href="#/lien-he">contact page</a> for advice.') },
      { q: L('Có nên thử sản phẩm mới trước khi dùng toàn mặt?', 'Should I patch-test a new product?'), a: L('Nên. Thoa một lượng nhỏ ở sau tai hoặc mặt trong cẳng tay trong 24–48 giờ. Chỉ thêm một sản phẩm mới mỗi lần.', 'Yes. Apply a small amount behind the ear or on the inner forearm for 24–48 hours. Add only one new product at a time.') },
      { q: L('Sản phẩm có thay thế tư vấn y tế không?', 'Do products replace medical advice?'), a: L('Không. Thông tin trên website mang tính tham khảo. Với bệnh lý da, mang thai hoặc cho con bú, hãy hỏi bác sĩ trước khi dùng hoạt chất mới.', 'No. Information on this website is for reference. For skin conditions, pregnancy or breastfeeding, ask your doctor before using new actives.') }
    ]}
  ];

  var STATUS_EN = { 'Chờ xác nhận': 'Pending confirmation', 'Đang chuẩn bị': 'Preparing', 'Đang giao': 'Shipping', 'Đã giao': 'Delivered', 'Đã hủy': 'Cancelled' };
  var FLOW = ['Chờ xác nhận', 'Đang chuẩn bị', 'Đang giao', 'Đã giao'];

  /* =====================================================  TRANG  ===================================================== */

  function renderAbout() {
    I18n.setTitle(L('Giới thiệu — TranAnh Skin', 'About — TranAnh Skin'));
    var values = [
      ['flask-conical', L('Minh bạch nồng độ', 'Concentration transparency'), L('Mỗi hoạt chất ghi rõ bao nhiêu phần trăm để bạn biết mình đang dùng gì.', 'Every active lists its exact percentage so you know what you are using.')],
      ['shield-check', L('An toàn là điều kiện', 'Safety comes first'), L('Công thức chỉ lên kệ khi có đầy đủ dữ liệu an toàn, phù hợp cả với da nhạy cảm.', 'Formulas are listed only with complete safety data, suitable even for sensitive skin.')],
      ['heart', L('Không thử nghiệm trên động vật', 'No animal testing'), L('Chúng tôi chọn đối tác và công thức theo tiêu chuẩn cruelty-free.', 'We choose partners and formulas that meet cruelty-free standards.')]
    ];
    var steps = [
      [L('Lắng nghe làn da', 'Listen to the skin'), L('Bắt đầu từ nhu cầu thực của làn da người Việt, không phải xu hướng nhất thời.', 'We start from the real needs of Vietnamese skin, not passing trends.')],
      [L('Chọn hoạt chất', 'Choose the active'), L('Ưu tiên hoạt chất có bằng chứng khoa học và nồng độ hiệu quả.', 'Priority goes to actives with scientific evidence and effective concentrations.')],
      [L('Rà soát an toàn', 'Safety review'), L('Kiểm tra hồ sơ an toàn, độ pH và khả năng dung nạp.', 'We check the safety file, pH and tolerability.')],
      [L('Rà soát mỗi mùa', 'Seasonal review'), L('Danh mục được xem xét định kỳ; công thức không đạt sẽ rời kệ.', 'The range is reviewed regularly; formulas that fall short leave the shelf.')]
    ];
    mount(
      '<div class="page-container pg">' + crumb(t(L('Giới thiệu', 'About'))) +
      '<div class="about-hero"><div>' +
        '<span class="pg-eyebrow">' + t(L('Câu chuyện thương hiệu', 'Our story')) + '</span>' +
        '<h1>' + t(L('Mỗi công thức, một lý do khoa học', 'Every formula, a scientific reason')) + '</h1>' +
        '<p class="pg-lead">' + t(L('TranAnh Skin bắt đầu từ một phòng khám da liễu nhỏ, nơi các bác sĩ và dược sĩ lâm sàng nhận ra làn da người Việt cần những công thức được chứng minh trên chính nó, không phải những lời hứa quảng cáo.', 'TranAnh Skin began in a small dermatology clinic, where doctors and clinical pharmacists realised Vietnamese skin needs formulas proven on it, not advertising promises.')) + '</p>' +
        '<div class="pg-actions"><a class="pg-btn" href="#/san-pham">' + t(L('Xem sản phẩm', 'View products')) + '</a><a class="pg-btn pg-btn-ghost" href="#/lien-he">' + t(L('Nhận tư vấn', 'Get advice')) + '</a></div>' +
      '</div><figure class="about-photo"><img src="assets/images/story.png" alt="' + esc(t(L('Phòng khám TranAnh Skin', 'TranAnh Skin clinic'))) + '" loading="lazy" /></figure></div>' +

      '<section class="pg-section"><h2>' + t(L('Điều chúng tôi cam kết', 'What we stand for')) + '</h2><div class="pg-grid-3" style="margin-top:1.5rem">' +
      values.map(function (v) {
        return '<div class="pg-card"><span class="pg-ico"><i data-lucide="' + v[0] + '" class="w-5 h-5"></i></span><h3>' + t(v[1]) + '</h3><p>' + t(v[2]) + '</p></div>';
      }).join('') + '</div></section>' +

      '<section class="pg-section"><h2>' + t(L('Cách chúng tôi tuyển chọn', 'How we select')) + '</h2><div class="steps" style="margin-top:1.75rem">' +
      steps.map(function (s) { return '<div class="step"><h3>' + t(s[0]) + '</h3><p>' + t(s[1]) + '</p></div>'; }).join('') + '</div></section>' +

      '<div class="pg-cta"><h2>' + t(L('Chưa biết bắt đầu từ đâu?', 'Not sure where to begin?')) + '</h2><a class="pg-btn" href="#/lien-he">' + t(L('Gửi yêu cầu tư vấn', 'Send a consultation request')) + '</a></div>' +
      '</div>'
    );
  }

  function renderBlog() {
    I18n.setTitle(L('Bài viết — TranAnh Skin', 'Articles — TranAnh Skin'));
    mount(
      '<div class="page-container pg">' + crumb(t(L('Bài viết', 'Articles'))) +
      '<div class="pg-head"><span class="pg-eyebrow">' + t(L('Góc kiến thức da liễu', 'Dermatology knowledge corner')) + '</span>' +
      '<h1>' + t(L('Hiểu hoạt chất trước khi chọn sản phẩm', 'Understand actives before you choose products')) + '</h1>' +
      '<p class="pg-lead">' + t(L('Bài viết ngắn gọn từ chuyên viên, giúp bạn hiểu hoạt chất trước khi chọn sản phẩm.', 'Short articles from specialists to help you understand actives before choosing products.')) + '</p></div>' +
      '<div class="blog-grid">' + POSTS.map(function (p) {
        return '<a class="blog-card" href="#/bai-viet/' + p.slug + '"><div class="post-img"><img src="' + esc(p.img ? productImage(p.img) : 'assets/images/hero-banner.png') + '" alt="" loading="lazy" /></div>' +
          '<div><p class="blog-tag">' + t(p.tag) + ' · ' + p.min + ' ' + t(L('phút đọc', 'min read')) + '</p><h2 class="font-heading">' + t(p.title) + '</h2><p class="ex" style="margin-top:.5rem">' + t(p.ex) + '</p></div></a>';
      }).join('') + '</div></div>'
    );
  }

  function renderArticle(slug) {
    var p = POSTS.filter(function (x) { return x.slug === slug; })[0];
    if (!p) { renderBlog(); return; }
    I18n.setTitle({ vi: p.title.vi + ' — TranAnh Skin', en: p.title.en + ' — TranAnh Skin' });
    var prod = p.product && window.Store ? Store.getProducts().filter(function (x) { return x.slug === p.product; })[0] : null;
    mount(
      '<div class="page-container pg"><article class="article">' +
      '<nav class="pg-crumb"><a href="#/">' + t(L('Trang chủ', 'Home')) + '</a><span>/</span><a href="#/bai-viet">' + t(L('Bài viết', 'Articles')) + '</a></nav>' +
      '<span class="pg-eyebrow">' + t(p.tag) + ' · ' + p.min + ' ' + t(L('phút đọc', 'min read')) + '</span>' +
      '<h1>' + t(p.title) + '</h1>' +
      '<div class="article-cover"><img src="' + esc(p.img ? productImage(p.img) : 'assets/images/hero-banner.png') + '" alt="" /></div>' +
      p.body.map(function (b) { return (b.h ? '<h2>' + t(b.h) + '</h2>' : '') + '<p>' + t(b.p) + '</p>'; }).join('') +
      '<p class="pg-note">' + t(L('Nội dung mang tính tham khảo, không thay thế tư vấn y tế. Nếu da có bệnh lý hoặc phản ứng bất thường, hãy gặp bác sĩ da liễu.', 'This content is for reference and does not replace medical advice. If you have a skin condition or an unusual reaction, see a dermatologist.')) + '</p>' +
      '<div class="article-rel">' +
        (prod ? '<a class="pg-btn" href="#/san-pham/' + prod.slug + '">' + t(L('Xem sản phẩm', 'View product')) + ': ' + esc(prod.name) + '</a>' : '') +
        '<a class="pg-btn pg-btn-ghost" href="#/bai-viet">' + t(L('Tất cả bài viết', 'All articles')) + '</a></div>' +
      '</article></div>'
    );
  }

  function renderFaq() {
    I18n.setTitle(L('Câu hỏi thường gặp — TranAnh Skin', 'FAQ — TranAnh Skin'));
    mount(
      '<div class="page-container pg"><div class="pg-narrow">' + crumb(t(L('Câu hỏi thường gặp', 'FAQ'))) +
      '<div class="pg-head"><span class="pg-eyebrow">FAQ</span><h1>' + t(L('Câu hỏi thường gặp', 'Frequently asked questions')) + '</h1>' +
      '<p class="pg-lead">' + t(L('Những điều khách hàng hỏi nhiều nhất về đặt hàng, giao nhận và cách dùng sản phẩm.', 'The things customers ask most about ordering, delivery and using our products.')) + '</p></div>' +
      '<div class="faq">' + FAQ.map(function (g) {
        return '<section class="faq-group"><h2>' + t(g.g) + '</h2>' + g.items.map(function (i) {
          return '<details><summary>' + t(i.q) + '</summary><div class="ans">' + t(i.a) + '</div></details>';
        }).join('') + '</section>';
      }).join('') + '</div>' +
      '<div class="pg-cta"><h2>' + t(L('Chưa tìm thấy câu trả lời?', 'Can’t find your answer?')) + '</h2><a class="pg-btn" href="#/lien-he">' + t(L('Liên hệ chúng tôi', 'Contact us')) + '</a></div>' +
      '</div></div>'
    );
  }

  function renderContact() {
    I18n.setTitle(L('Liên hệ — TranAnh Skin', 'Contact — TranAnh Skin'));
    var topics = [
      ['Tư vấn da', 'Skin consultation'], ['Đơn hàng', 'Order'], ['Đổi trả', 'Returns'], ['Hợp tác', 'Partnership'], ['Khác', 'Other']
    ];
    mount(
      '<div class="page-container pg">' + crumb(t(L('Liên hệ', 'Contact'))) +
      '<div class="pg-head"><span class="pg-eyebrow">' + t(L('Liên hệ chuyên môn', 'Expert contact')) + '</span><h1>' + t(L('Chúng tôi luôn sẵn sàng lắng nghe', 'We are here to listen')) + '</h1>' +
      '<p class="pg-lead">' + t(L('Gửi câu hỏi hoặc tình trạng da của bạn, chuyên viên sẽ phản hồi trong vòng 24 giờ.', 'Send your question or skin concern and a specialist will reply within 24 hours.')) + '</p></div>' +
      '<div class="contact-grid"><div class="contact-list">' +
        '<div class="contact-item"><span class="pg-ico"><i data-lucide="phone" class="w-5 h-5"></i></span><div><b>' + t(L('Điện thoại', 'Phone')) + '</b><a href="tel:19006789">1900 6789</a><br><span>8:30 – 21:00</span></div></div>' +
        '<div class="contact-item"><span class="pg-ico"><i data-lucide="mail" class="w-5 h-5"></i></span><div><b>Email</b><a href="mailto:hello@trananhskin.vn">hello@trananhskin.vn</a></div></div>' +
        '<div class="contact-item"><span class="pg-ico"><i data-lucide="map-pin" class="w-5 h-5"></i></span><div><b>' + t(L('Địa chỉ', 'Address')) + '</b><span>' + t(L('128 Hai Bà Trưng, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh', '128 Hai Ba Trung, Ben Nghe Ward, District 1, Ho Chi Minh City')) + '</span></div></div>' +
        '<div class="contact-item"><span class="pg-ico"><i data-lucide="circle-help" class="w-5 h-5"></i></span><div><b>' + t(L('Cần câu trả lời nhanh?', 'Need a quick answer?')) + '</b><a href="#/faq">' + t(L('Xem câu hỏi thường gặp', 'See the FAQ')) + '</a></div></div>' +
      '</div>' +
      '<form class="pg-form" id="contact-form" novalidate>' +
        '<div class="row2"><div><label for="c-name">' + t(L('Họ và tên', 'Full name')) + ' *</label><input id="c-name" name="name" autocomplete="name" required /></div>' +
        '<div><label for="c-phone">' + t(L('Số điện thoại', 'Phone number')) + ' *</label><input id="c-phone" name="phone" inputmode="tel" autocomplete="tel" required /></div></div>' +
        '<div class="row2"><div><label for="c-email">Email</label><input id="c-email" name="email" type="email" autocomplete="email" /></div>' +
        '<div><label for="c-topic">' + t(L('Chủ đề', 'Topic')) + '</label><select id="c-topic" name="topic">' +
          topics.map(function (x) { return '<option value="' + x[0] + '">' + esc(t(L(x[0], x[1]))) + '</option>'; }).join('') + '</select></div></div>' +
        '<div><label for="c-msg">' + t(L('Nội dung', 'Message')) + ' *</label><textarea id="c-msg" name="message" required></textarea></div>' +
        '<p class="pg-err" id="contact-err" role="alert"></p>' +
        '<button type="submit" class="pg-btn" style="justify-self:start">' + t(L('Gửi yêu cầu', 'Send request')) + '</button>' +
      '</form></div></div>'
    );
    var form = document.getElementById('contact-form');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(form), err = document.getElementById('contact-err');
      var name = String(fd.get('name') || '').trim(), phone = String(fd.get('phone') || '').replace(/[\s.\-()]/g, ''), msg = String(fd.get('message') || '').trim();
      var email = String(fd.get('email') || '').trim();
      if (!name || !msg) { err.textContent = t(L('Vui lòng nhập họ tên và nội dung.', 'Please enter your name and message.')); return; }
      if (!/^(0|\+?84)\d{8,10}$/.test(phone)) { err.textContent = t(L('Số điện thoại chưa hợp lệ.', 'The phone number is not valid.')); return; }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = t(L('Email chưa hợp lệ.', 'The email is not valid.')); return; }
      err.textContent = '';
      Store.addConsultation({
        name: name, phone: phone, email: email,
        skin_type: 'Liên hệ chung',
        concerns: '[' + fd.get('topic') + '] ' + msg,
        current_routine: ''
      });
      form.reset();
    });
  }

  function renderTrack() {
    I18n.setTitle(L('Tra cứu đơn hàng — TranAnh Skin', 'Track your order — TranAnh Skin'));
    mount(
      '<div class="page-container pg"><div class="pg-narrow">' + crumb(t(L('Tra cứu đơn hàng', 'Track order'))) +
      '<div class="pg-head"><span class="pg-eyebrow">' + t(L('Theo dõi đơn hàng', 'Order tracking')) + '</span><h1>' + t(L('Đơn hàng của bạn đang ở đâu?', 'Where is your order?')) + '</h1>' +
      '<p class="pg-lead">' + t(L('Nhập mã đơn hàng và số điện thoại nhận hàng để xem trạng thái và hành trình vận chuyển.', 'Enter your order code and delivery phone number to see its status and shipping journey.')) + '</p></div>' +
      '<form class="pg-form" id="track-form" novalidate>' +
        '<div class="row2"><div><label for="t-id">' + t(L('Mã đơn hàng', 'Order code')) + '</label><input id="t-id" name="id" placeholder="TAS-2026-1234" autocomplete="off" required /></div>' +
        '<div><label for="t-phone">' + t(L('Số điện thoại', 'Phone number')) + '</label><input id="t-phone" name="phone" inputmode="tel" required /></div></div>' +
        '<p class="pg-err" id="track-err" role="alert"></p>' +
        '<button class="pg-btn" type="submit" style="justify-self:start"><i data-lucide="search" class="w-4 h-4"></i>' + t(L('Tra cứu', 'Track')) + '</button>' +
      '</form><div id="track-out"></div></div></div>'
    );
    icons();
    document.getElementById('track-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(e.target), out = document.getElementById('track-out'), err = document.getElementById('track-err');
      var id = String(fd.get('id') || '').trim().toUpperCase(), ph = String(fd.get('phone') || '').replace(/\D/g, '');
      out.innerHTML = '';
      if (!id || ph.length < 9) { err.textContent = t(L('Vui lòng nhập mã đơn và số điện thoại hợp lệ.', 'Please enter a valid order code and phone number.')); return; }
      err.textContent = '';
      var order = Store.getOrders().filter(function (o) {
        var op = String((o.customer && o.customer.phone) || '').replace(/\D/g, '');
        return o.id.toUpperCase() === id && op.slice(-9) === ph.slice(-9);
      })[0];
      if (!order) { err.textContent = t(L('Không tìm thấy đơn hàng khớp với thông tin đã nhập.', 'No order matches the details you entered.')); return; }
      out.innerHTML = trackCard(order);
    });
  }

  function statusLabel(s) { return I18n.lang() === 'en' ? (STATUS_EN[s] || s) : s; }

  function trackCard(o) {
    var cancelled = o.status === 'Đã hủy', idx = FLOW.indexOf(o.status);
    var prog = cancelled ? '' : '<div class="progress">' + FLOW.map(function (s, i) { return '<div class="' + (i <= idx ? 'on' : '') + '">' + esc(statusLabel(s)) + '</div>'; }).join('') + '</div>';
    var tl = (o.timeline || []).slice().reverse().map(function (s) {
      return '<li><b>' + esc(s.title) + '</b><small>' + esc((s.time || '') + ' ' + (s.date || '')) + '</small>' + (s.desc ? '<small>' + esc(s.desc) + '</small>' : '') + '</li>';
    }).join('');
    return '<div class="track-result"><div class="pg-card">' +
      '<div style="display:flex;flex-wrap:wrap;gap:.75rem;justify-content:space-between;align-items:center"><div><p class="pg-eyebrow">' + t(L('Mã đơn hàng', 'Order code')) + '</p><h2 class="font-heading" style="margin-top:.2rem">' + esc(o.id) + '</h2></div>' +
      '<span class="pill' + (cancelled ? ' bad' : '') + '">' + esc(statusLabel(o.status)) + '</span></div>' + prog +
      '<p style="margin-top:1rem;font-size:.85rem">' + t(L('Thanh toán', 'Payment')) + ': <b>' + esc(o.paymentStatus || '') + '</b></p>' +
      (o.trackingCode ? '<p style="font-size:.85rem">' + t(L('Mã vận đơn', 'Tracking code')) + ': <b>' + esc(o.trackingCode) + '</b> · ' + esc(o.carrier || '') + '</p>' : '') +
      '</div>' +
      '<div class="pg-card"><h3 style="margin-top:0">' + t(L('Sản phẩm', 'Items')) + '</h3><ul class="t-items" style="margin-top:.5rem">' +
        (o.items || []).map(function (i) { return '<li><span>' + esc(i.name) + ' × ' + esc(i.quantity) + '</span><b>' + money(i.price * i.quantity) + '</b></li>'; }).join('') +
        '<li><span>' + t(L('Phí vận chuyển', 'Shipping fee')) + '</span><b>' + (o.shippingFee ? money(o.shippingFee) : t(L('Miễn phí', 'Free'))) + '</b></li>' +
        '<li><span><b>' + t(L('Tổng thanh toán', 'Total')) + '</b></span><b>' + money(o.total) + '</b></li></ul></div>' +
      (tl ? '<div class="pg-card"><h3 style="margin-top:0">' + t(L('Hành trình đơn hàng', 'Order journey')) + '</h3><ul class="t-line">' + tl + '</ul></div>' : '') +
      '</div>';
  }

  /* =====================================================  ROUTING  ===================================================== */

  function handle(hash) {
    var path = (hash || '').split('?')[0], m;
    var page = null;
    if (path === '#/gioi-thieu') page = renderAbout;
    else if (path === '#/bai-viet') page = renderBlog;
    else if ((m = path.match(/^#\/bai-viet\/([\w-]+)$/))) page = function () { renderArticle(m[1]); };
    else if (path === '#/faq') page = renderFaq;
    else if (path === '#/lien-he') page = renderContact;
    else if (path === '#/tra-cuu-don') page = renderTrack;
    if (!page) { current = null; if (window.I18n) I18n.clearTitle(); return false; }
    current = page;
    page();
    return true;
  }

  // Đổi ngôn ngữ: dựng lại trang mới đang mở, giữ vị trí cuộn và nội dung đang nhập trong form
  window.addEventListener('langchange', function () {
    if (!current) return;
    var y = window.scrollY, saved = {};
    document.querySelectorAll('.pg-form [id]').forEach(function (el) { if ('value' in el) saved[el.id] = el.value; });
    current();
    Object.keys(saved).forEach(function (id) { var el = document.getElementById(id); if (el) el.value = saved[id]; });
    var tf = document.getElementById('track-form');           // dựng lại kết quả tra cứu bằng ngôn ngữ mới
    if (tf && saved['t-id'] && saved['t-phone']) tf.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    window.scrollTo(0, y);
  });

  // Toast do Store phát ra bằng tiếng Việt
  if (window.I18n) I18n.add({
    'Đã gửi yêu cầu tư vấn thành công! Chuyên viên sẽ liên hệ trong 24h.': 'Request sent! A specialist will contact you within 24 hours.',
    'Hoạt chất · 5 phút đọc': 'Actives · 5 min read', 'Da nhạy cảm · 4 phút đọc': 'Sensitive skin · 4 min read', 'Chống nắng · 3 phút đọc': 'Sun care · 3 min read',
    'Vitamin C 15%: dùng sáng hay tối để da sáng đều hơn?': 'Vitamin C 15%: morning or evening for brighter, more even skin?',
    'Thứ tự thoa, nồng độ phù hợp và lý do vitamin C luôn đi cùng chống nắng.': 'Application order, the right concentration and why vitamin C always goes with sunscreen.',
    'Ceramide giúp phục hồi hàng rào bảo vệ da như thế nào': 'How ceramides help repair the skin barrier',
    'Dấu hiệu da tổn thương và cách xây lại nền da trong ba tuần.': 'Signs of a damaged barrier and how to rebuild it over a few weeks.',
    'SPF50+ PA++++ có cần thoa lại khi ngồi trong nhà?': 'Do you need to reapply SPF50+ PA++++ indoors?',
    'Ánh sáng xanh, cửa kính và lượng kem chống nắng đúng cho cả khuôn mặt.': 'Window glass, indoor light and the right amount of sunscreen for the whole face.'
  });

  window.Pages = { handle: handle, posts: POSTS };
})();