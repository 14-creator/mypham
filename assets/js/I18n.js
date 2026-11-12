/**
 * TranAnh Skin — Đa ngôn ngữ (Vi / En)
 * - Ngôn ngữ mặc định: tiếng Việt. Lựa chọn được lưu ở localStorage (tas_lang_v1).
 * - Giao diện cũ (app.js / auth.js / index.html) giữ nguyên tiếng Việt làm "khoá gốc";
 *   module này dịch từng đoạn văn bản theo từ điển DICT bên dưới và tự theo dõi DOM
 *   (MutationObserver) nên nội dung render động cũng được dịch.
 * - Trang mới (pages.js) dùng I18n.t({vi:'…', en:'…'}).
 * - Chuỗi chưa có trong từ điển sẽ giữ nguyên tiếng Việt: chỉ cần thêm một dòng vào DICT.
 */
(function () {
  'use strict';

  var KEY = 'tas_lang_v1';
  var LANGS = ['vi', 'en'];
  var lang = 'vi';
  try { var saved = localStorage.getItem(KEY); if (LANGS.indexOf(saved) > -1) lang = saved; } catch (e) {}

  // ---------- TỪ ĐIỂN VI -> EN (khoá = văn bản tiếng Việt đã gộp khoảng trắng) ----------
  var DICT = {
    // Tiêu đề / điều hướng
    "TranAnh Skin — Dược mỹ phẩm tuyển chọn theo bằng chứng khoa học": "TranAnh Skin — Evidence-based curated dermo-cosmetics",
    "Trang chủ": "Home", "Sản phẩm": "Products", "Câu chuyện": "Our story", "Liên hệ": "Contact",
    "Giới thiệu": "About", "Bài viết": "Articles", "Câu hỏi thường gặp": "FAQ", "Tra cứu đơn hàng": "Track order",
    "Quản trị": "Admin", "Đăng nhập": "Log in", "Giỏ hàng": "Cart", "Giỏ hàng của bạn": "Your cart",
    "Chính sách vận chuyển & đổi trả": "Shipping & return policy",
    "Đăng nhập / Đăng ký": "Log in / Sign up", "Tài khoản của tôi": "My account", "Ví:": "Wallet:",
    "Quản trị hệ thống (Admin)": "System admin",
    "Mua thêm để được Miễn phí vận chuyển": "Add more to get free shipping",
    "Tạm tính:": "Subtotal:", "Phí vận chuyển và voucher được tính khi tiến hành đặt hàng.": "Shipping and vouchers are calculated at checkout.",
    "Tiến hành đặt hàng": "Proceed to checkout",
    "Giỏ hàng của bạn đang trống": "Your cart is empty", "Chưa có sản phẩm nào được chọn": "No products selected yet",
    "Khám phá sản phẩm": "Explore products", "Đơn hàng đủ điều kiện MIỄN PHÍ vận chuyển!": "Your order qualifies for FREE shipping!",

    // Footer
    "Dược mỹ phẩm tuyển chọn theo bằng chứng khoa học, cho nghi thức chăm sóc da mỗi ngày. Nồng độ công bố minh bạch, kiểm chứng lâm sàng cho làn da người Việt.":
      "Curated dermo-cosmetics backed by scientific evidence for your daily skincare ritual. Transparent concentrations, clinically verified for Vietnamese skin.",
    "100% Hoạt chất công bố": "100% disclosed actives", "Bộ sưu tập": "Collections",
    "Chăm sóc da (8)": "Skincare (8)", "Làm sạch da (4)": "Cleansers (4)", "Chống nắng phổ rộng (3)": "Broad-spectrum sunscreen (3)", "Trang điểm dưỡng da (4)": "Skincare makeup (4)",
    "Về chúng tôi": "About us", "Câu chuyện thương hiệu": "Brand story", "Nghi thức phác đồ 3 bước": "3-step routine",
    "Chính sách vận chuyển": "Shipping policy", "Đổi trả trong 7 ngày": "7-day returns", "Bảng quản trị (Admin)": "Admin dashboard",
    "Liên hệ chuyên môn": "Expert contact",
    "128 Hai Bà Trưng, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh": "128 Hai Ba Trung, Ben Nghe Ward, District 1, Ho Chi Minh City",
    "© 2026 TranAnh Skin. Mọi quyền được bảo lưu. Công thức dược mỹ phẩm tuyển chọn.": "© 2026 TranAnh Skin. All rights reserved. Curated dermo-cosmetic formulas.",
    "Được xây dựng & tối ưu hoá cho trải nghiệm mượt mà, độc lập 100%.": "Built and optimised for a smooth, fully independent experience.",

    // Trang chủ
    "Dược mỹ phẩm tuyển chọn · Từ 2026": "Curated dermo-cosmetics · Since 2026",
    "Vẻ đẹp có cơ sở khoa học": "Beauty with a scientific basis",
    "TranAnh Skin tuyển chọn công thức dựa trên bằng chứng lâm sàng: nồng độ hoạt chất được công bố, thành phần minh bạch và hiệu quả kiểm chứng trên từng loại da.":
      "TranAnh Skin selects formulas based on clinical evidence: disclosed active concentrations, transparent ingredients and efficacy verified on each skin type.",
    "Xem tất cả": "View all", "Công thức kiểm nghiệm lâm sàng": "Clinically tested formulas", "Nồng độ hoạt chất công bố": "Disclosed active concentrations",
    "Không thử nghiệm trên động vật": "No animal testing", "Tư vấn cùng chuyên viên da liễu": "Consult a dermatology specialist",
    "Chọn theo mục tiêu chăm sóc của làn da": "Shop by your skin's goal", "Xem tất cả sản phẩm": "View all products",
    "Công thức nổi bật": "Featured formulas", "Được chứng minh, được tin dùng": "Proven and trusted",
    "Những công thức có tỷ lệ quay lại cao nhất, được kiểm chứng thực tế qua hàng nghìn phác đồ điều trị.": "Formulas with the highest repurchase rates, proven in practice across thousands of treatment routines.",
    "Xem toàn bộ 19 công thức": "See all 19 formulas",
    "Phòng khám da liễu đầu tiên tại Sài Gòn": "The first dermatology clinic in Saigon",
    "Mỗi công thức, một lý do khoa học": "Every formula, a scientific reason",
    "TranAnh Skin bắt đầu từ một phòng khám da liễu nhỏ, nơi các bác sĩ và dược sĩ lâm sàng nhận ra làn da người Việt cần những công thức được chứng minh trên chính nó, không phải những lời hứa quảng cáo.":
      "TranAnh Skin began in a small dermatology clinic, where doctors and clinical pharmacists realised Vietnamese skin needs formulas proven on it, not advertising promises.",
    "Nồng độ hoạt chất công bố rõ": "Clearly disclosed active concentrations", "Mỗi thành phần ghi cụ thể bao nhiêu phần trăm, bạn biết mình đang dùng gì.": "Every ingredient lists its exact percentage, so you know what you are using.",
    "Dữ liệu an toàn đầy đủ": "Complete safety data", "Chỉ lên kệ khi có hồ sơ an toàn, phù hợp cả với da nhạy cảm.": "Only listed once a safety file exists, suitable even for sensitive skin.",
    "Kiểm nghiệm độc lập": "Independent testing", "Danh mục được rà soát mỗi mùa, công thức nào không đạt sẽ rời kệ.": "The range is reviewed every season; formulas that fall short are removed.",
    "Minh bạch nồng độ": "Concentration transparency", "Độ pH sinh lý": "Physiological pH", "Tư vấn phản hồi": "Consultation reply",
    "Nghi thức hàng ngày": "Daily ritual", "Ba bước, mỗi ngày, trên nền tảng khoa học": "Three steps, every day, grounded in science",
    "Chăm sóc da không cần 10 bước phức tạp. Chỉ cần đúng hoạt chất, đúng thứ tự và đủ kiên trì.": "Skincare doesn't need 10 complicated steps. Just the right actives, in the right order, with enough patience.",
    "Làm sạch dịu nhẹ": "Gentle cleansing", "Sữa rửa mặt pH 5.5 giữ nguyên màng hydrolipid tự nhiên của da. Massage 60 giây với nước ấm, sáng và tối.": "A pH 5.5 cleanser preserves the skin's natural hydrolipid film. Massage for 60 seconds with lukewarm water, morning and evening.",
    "Điều trị chuyên sâu": "Targeted treatment", "Hoạt chất đặc trị (Vitamin C, Retinal, BHA, Peptide) thoa trước, kem dưỡng phục hồi thoa sau. Chờ 30 giây giữa các lớp để da ổn định bề mặt.": "Apply treatment actives (Vitamin C, Retinal, BHA, Peptide) first, then a restoring moisturiser. Wait 30 seconds between layers so the surface settles.",
    "Bảo vệ toàn diện": "Complete protection", "Chống nắng phổ rộng SPF50+ PA++++ mỗi sáng, kể cả ngày râm mát hoặc làm việc trong phòng máy tính. Thoa lại sau mỗi 2–3 giờ khi ở ngoài trời.": "Broad-spectrum SPF50+ PA++++ every morning, even on overcast days or when working indoors at a computer. Reapply every 2–3 hours outdoors.",
    "3 bước": "3 steps", "Sáng và tối, chỉ cần đúng hoạt chất và đúng thứ tự": "Morning and evening: just the right actives in the right order",
    "Góc kiến thức da liễu": "Dermatology knowledge corner", "Bài viết ngắn gọn từ chuyên viên, giúp bạn hiểu hoạt chất trước khi chọn sản phẩm.": "Short articles from specialists to help you understand actives before choosing products.",
    "Đánh giá đã xác thực": "Verified reviews", "Kết quả trên làn da thật": "Results on real skin",
    "“Da mình nhạy cảm và rất khó chiều, nhưng kem dưỡng ceramide của TranAnh Skin là thứ duy nhất không gây châm chích. Ba tuần là da ổn hẳn, mềm mịn không còn bong tróc.”": "“My skin is sensitive and hard to please, but TranAnh Skin's ceramide cream is the only thing that doesn't sting. In three weeks my skin settled, soft and no longer flaking.”",
    "Ngọc Anh": "Ngoc Anh", "Da khô, nhạy cảm · 28 tuổi": "Dry, sensitive skin · age 28",
    "“Tinh chất vitamin C thấm nhanh, không dính, mùi rất nhẹ. Sáng hôm sau da đã thấy căng và sáng hơn rõ. Dùng được gần 1 lọ vết thâm mờ hẳn.”": "“The vitamin C serum absorbs fast, isn't sticky and has a very light scent. The next morning my skin looked plumper and brighter. After almost one bottle my dark marks faded noticeably.”",
    "Minh Thư": "Minh Thu", "Da hỗn hợp thiên dầu · 32 tuổi": "Combination-to-oily skin · age 32",
    "“Đóng gói tinh tế, giao nhanh, và điều mình thích nhất là bảng thành phần ghi rõ ràng từng thứ, nồng độ bao nhiêu %. Rất đáng tin cậy.”": "“Elegant packaging, fast delivery, and what I like most is the ingredient list that states every item and its percentage. Very trustworthy.”",
    "Hà Linh": "Ha Linh", "Da dầu mụn · 25 tuổi": "Oily, acne-prone skin · age 25",
    "Mới": "New", "Ưu đãi": "Sale",

    // Cửa hàng
    "Bộ sưu tập sản phẩm": "Product collection", "Danh mục tuyển chọn": "Curated catalogue", "Mọi thứ làn da bạn cần, trong một nơi": "Everything your skin needs, in one place",
    "Tuyển chọn 19 công thức với nồng độ hoạt chất công bố rõ ràng, được kiểm chứng lâm sàng cho khí hậu và làn da Việt.": "19 selected formulas with clearly disclosed active concentrations, clinically verified for Vietnam's climate and skin.",
    "Mọi loại da": "All skin types", "Da dầu": "Oily skin", "Da khô": "Dry skin", "Da mụn": "Acne-prone skin", "Da nhạy cảm": "Sensitive skin", "Da hỗn hợp": "Combination skin",
    "Thứ tự mặc định": "Default order", "Giá: Thấp đến Cao": "Price: low to high", "Giá: Cao đến Thấp": "Price: high to low", "Đánh giá cao nhất": "Top rated", "Sản phẩm mới": "Newest",
    "Tìm thấy": "Found", "sản phẩm phù hợp": "matching products", "Xoá bộ lọc": "Clear filters",
    "Không tìm thấy sản phẩm nào": "No products found", "Vui lòng thử tìm kiếm với từ khoá khác hoặc xoá bộ lọc": "Try a different keyword or clear the filters",
    "Không tìm thấy sản phẩm": "Product not found", "Sản phẩm này không tồn tại hoặc đã ngừng kinh doanh.": "This product doesn't exist or is no longer sold.", "Quay lại cửa hàng": "Back to shop",
    "Chính hãng 100%": "100% authentic", "Có tem kiểm định": "Verification seal", "Giao toàn quốc": "Nationwide delivery", "Freeship từ 500k": "Free shipping from 500k",
    "Đổi trả 7 ngày": "7-day returns", "Nếu kích ứng da": "If skin irritation occurs", "Loại da khuyên dùng:": "Recommended skin types:", "Số lượng:": "Quantity:", "Thêm vào giỏ": "Add to cart",
    "Bảng hoạt chất chính (Active Ingredients)": "Key active ingredients",
    "Mọi nồng độ hoạt chất đều được kiểm định độc lập, không chứa cồn khô gây hại, không hương liệu nhân tạo gây kích ứng.": "All active concentrations are independently verified, with no harsh drying alcohol and no irritating artificial fragrance.",
    "Cách sử dụng chuẩn phác đồ": "How to use", "Vận chuyển & Đổi trả bảo hành": "Shipping, returns & warranty",
    "• Giao hàng hỏa tốc trong 2-4h tại Hà Nội & TP. Hồ Chí Minh.": "• Express delivery within 2–4h in Hanoi & Ho Chi Minh City.",
    "• Miễn phí vận chuyển cho tất cả đơn hàng từ 500.000 đ.": "• Free shipping on all orders from 500,000 đ.",
    "• Hỗ trợ đổi trả miễn phí trong 7 ngày nếu sản phẩm gây kích ứng da có xác nhận chuyên viên.": "• Free returns within 7 days if the product causes skin irritation confirmed by a specialist.",
    "Đánh giá từ khách hàng": "Customer reviews", "Viết đánh giá của bạn": "Write your review", "Họ tên của bạn *": "Your name *", "Loại da & Độ tuổi": "Skin type & age", "Số sao đánh giá": "Star rating",
    "5 sao - Rất hài lòng": "5 stars – Very satisfied", "4 sao - Hài lòng": "4 stars – Satisfied", "3 sao - Bình thường": "3 stars – Average", "2 sao - Chưa ưng ý": "2 stars – Not quite happy", "1 sao - Không hài lòng": "1 star – Dissatisfied",
    "Tiêu đề nhận xét": "Review title", "Chi tiết nhận xét *": "Review details *", "Huỷ": "Cancel", "Gửi đánh giá": "Submit review",
    "Chưa có đánh giá nào cho sản phẩm này. Hãy là người đầu tiên chia sẻ cảm nhận!": "No reviews yet for this product. Be the first to share your thoughts!",
    "Gợi ý phác đồ": "Routine suggestions", "Sản phẩm cùng danh mục": "Products in the same category",

    // Giỏ hàng & thanh toán
    "Giỏ hàng đang trống": "Your cart is empty", "Bạn chưa chọn công thức dược mỹ phẩm nào. Hãy khám phá danh mục để tìm sản phẩm phù hợp với làn da của bạn.": "You haven't chosen any dermo-cosmetic formula yet. Browse the catalogue to find products suited to your skin.",
    "Xem sản phẩm": "View products", "Giỏ hàng & Thanh toán": "Cart & Checkout", "Danh sách sản phẩm đã chọn": "Selected products", "Xoá": "Remove",
    "Thông tin nhận hàng": "Delivery information", "Họ và tên người nhận": "Recipient's full name", "Số điện thoại": "Phone number",
    "Địa chỉ giao hàng (Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/TP)": "Delivery address (house no., street, ward, district, province/city)", "Ghi chú giao hàng (tuỳ chọn)": "Delivery notes (optional)",
    "Phương thức thanh toán": "Payment method", "Ví TranAnh": "TranAnh Wallet", "Trừ trực tiếp vào số dư ví của tài khoản bạn, đơn được xác nhận ngay.": "Deducted directly from your wallet balance; the order is confirmed instantly.",
    "Nạp thêm vào ví": "Top up wallet", "Chuyển khoản QR Ngân hàng": "Bank transfer via QR", "Hiện mã QR STK của shop. Cửa hàng đối chiếu và xác nhận đơn sau khi nhận tiền.": "Shows the shop's account QR code. The shop reconciles and confirms your order after receiving payment.",
    "Thanh toán khi nhận hàng (COD)": "Cash on delivery (COD)", "Nhận hàng, kiểm tra trước khi thanh toán tiền mặt.": "Receive and inspect your goods before paying cash.",
    "Tóm tắt đơn hàng": "Order summary", "Mã ưu đãi / Voucher": "Promo code / Voucher", "Áp dụng": "Apply", "Gỡ bỏ": "Remove", "Thử nhập:": "Try:", "Tạm tính": "Subtotal",
    "Giảm giá ưu đãi": "Discount", "Phí vận chuyển": "Shipping fee", "Miễn phí": "Free", "Tổng thanh toán": "Total", "Đã bao gồm VAT và bảo hiểm vận chuyển": "Includes VAT and shipping insurance",
    "Cam kết dịch vụ TranAnh Skin": "TranAnh Skin service promise", "• 100% sản phẩm có tem chống hàng giả và số lô sản xuất.": "• 100% of products carry an anti-counterfeit seal and batch number.",
    "• Dược sĩ theo dõi phác đồ và hỗ trợ chăm sóc trọn vòng đời sản phẩm.": "• Pharmacists follow your routine and support you throughout the product's life.",
    "Đặt hàng thành công!": "Order placed successfully!", "Mã đơn hàng của bạn:": "Your order code:", "Người nhận:": "Recipient:", "Địa chỉ:": "Address:", "Thanh toán:": "Payment:",
    "Số dư ví còn lại:": "Remaining wallet balance:", "Tổng tiền:": "Total:", "Chuyên viên TranAnh Skin sẽ liên hệ xác nhận đơn và gửi hàng trong vòng 24h.": "A TranAnh Skin specialist will contact you to confirm the order and ship within 24h.",
    "Về trang chủ": "Back to home", "Chờ chuyển khoản": "Awaiting transfer", "Quét mã QR để thanh toán": "Scan the QR code to pay", "Số tiền:": "Amount:", "Mã QR hết hạn sau": "QR code expires in",
    "Ngân hàng:": "Bank:", "Chủ tài khoản:": "Account holder:", "Số tài khoản:": "Account number:", "Chép": "Copy", "Sao chép": "Copy", "Số tiền chính xác:": "Exact amount:", "Nội dung chuyển khoản (Memo):": "Transfer note (memo):",
    "Tôi đã thanh toán": "I have paid", "Thanh toán thành công": "Payment successful", "Mã QR đã hết hạn": "QR code expired", "Tạo lại mã QR": "Regenerate QR code",
    "Đơn hàng đã tự động xác nhận!": "Order confirmed automatically!", "Đơn vị vận chuyển": "Carrier", "🚚 Đang vận chuyển": "🚚 In transit", "Mã đơn hàng:": "Order code:", "Mã vận đơn:": "Tracking code:", "Hành trình đơn hàng:": "Order journey:",
    "Khách hàng đặt hàng": "Customer placed the order", "Xem đơn trong Quản trị (Admin)": "View order in Admin",
    "Nạp tiền vào ví": "Top up wallet", "Nạp tiền thành công": "Top-up successful", "Tôi đã chuyển khoản, đóng": "I've transferred, close",
    "Khởi tạo đơn hàng": "Order created", "Thanh toán bằng Ví TranAnh": "Paid with TranAnh Wallet",

    // Chính sách
    "Chính sách & Cam kết": "Policies & Commitments", "Quy chuẩn dịch vụ": "Service standards", "Mua hàng tại TranAnh Skin, minh bạch từ đầu": "Shopping at TranAnh Skin, transparent from the start",
    "Chúng tôi tin rằng sự tin tưởng bắt nguồn từ sự minh bạch tuyệt đối trong chất lượng sản phẩm, chính sách giao nhận và quyền lợi khách hàng.": "We believe trust comes from absolute transparency in product quality, delivery policy and customer rights.",
    "1. Chính sách Vận chuyển & Giao hàng": "1. Shipping & Delivery Policy", "2. Phương thức Thanh toán": "2. Payment Methods", "3. Chính sách Đổi trả & Hoàn tiền": "3. Returns & Refund Policy", "4. Cam kết Chất lượng & Bảo mật Thông tin": "4. Quality Commitment & Data Privacy",
    "Nội thành Hà Nội & TP. Hồ Chí Minh:": "Inner Hanoi & Ho Chi Minh City:", "Giao hàng hỏa tốc trong 2–4 giờ hoặc tiêu chuẩn 24 giờ kể từ khi xác nhận đơn.": "Express delivery within 2–4 hours or standard 24 hours after order confirmation.",
    "Các tỉnh thành khác:": "Other provinces:", "Giao hàng chuyển phát nhanh đường bay từ 2–3 ngày làm việc.": "Air express delivery within 2–3 working days.", "Cước phí:": "Shipping fees:",
    "Quy cách đóng gói:": "Packaging:", "Hộp carton chuyên dụng, túi đệm khí chống sốc 100% tái chế, niêm phong tem vỡ đảm bảo tính nguyên vẹn.": "Dedicated carton box, 100% recycled air-cushion bags, tamper-evident seal to ensure integrity.",
    "Thanh toán tiền mặt khi nhận hàng (COD):": "Cash on delivery (COD):", "Quý khách được quyền kiểm tra sản phẩm trước khi thanh toán cho nhân viên giao hàng.": "You may inspect the product before paying the delivery person.",
    "Chuyển khoản VietQR:": "VietQR transfer:", "Quét mã QR tự động điền sẵn số tiền và mã đơn hàng, tích hợp với hơn 40 ngân hàng và ví điện tử tại Việt Nam.": "Scanning the QR code pre-fills the amount and order code; works with 40+ banks and e-wallets in Vietnam.",
    "Đổi trả trong vòng 7 ngày:": "Returns within 7 days:", "Lỗi do nhà sản xuất:": "Manufacturing defects:", "Thời gian hoàn tiền:": "Refund time:", "Trong vòng 24–48 giờ làm việc sau khi nhận lại sản phẩm.": "Within 24–48 working hours after we receive the product back.",
    "• Cam kết 100% nguồn gốc xuất xứ rõ ràng, phiếu công bố mỹ phẩm của Bộ Y tế.": "• 100% clear origin, with the Ministry of Health cosmetic declaration.",

    // Tài khoản
    "Tài khoản TranAnh Skin": "TranAnh Skin account", "Email hoặc số điện thoại": "Email or phone number", "Đăng ký ngay": "Sign up now", "Họ và tên": "Full name", "Email": "Email", "Đăng ký": "Sign up",
    "Tên đăng nhập": "Username", "Vai trò": "Role", "Ngày tạo": "Created", "Số dư ví": "Wallet balance", "Ví của tôi · Nạp tiền": "My wallet · Top up", "Vào trang Quản trị": "Go to Admin",
    "Tiếp tục mua sắm": "Continue shopping", "Đăng xuất": "Log out", "Số dư khả dụng": "Available balance", "Tạo mã QR nạp tiền": "Create top-up QR", "Hủy": "Cancel",
    "Lịch sử giao dịch": "Transaction history", "Chưa có giao dịch nào.": "No transactions yet.",
    "Vui lòng đăng nhập bằng tài khoản quản trị để vào trang Quản trị.": "Please log in with an admin account to access the Admin page.",
    "Bạn cần có tài khoản để mua hàng và sử dụng ví. Vui lòng đăng nhập hoặc đăng ký.": "You need an account to shop and use the wallet. Please log in or sign up.",

    // Trạng thái đơn
    "Chờ xác nhận": "Pending confirmation", "Đang chuẩn bị": "Preparing", "Đang giao": "Shipping", "Đã giao": "Delivered", "Đã hủy": "Cancelled"
  };

  // Mẫu có biến (regex -> hàm trả về chuỗi EN)
  var PATTERNS = [
    [/^(\d[\d.,]*) sản phẩm$/, function (m) { return m[1] + ' products'; }],
    [/^(\d+) sản phẩm phù hợp$/, function (m) { return m[1] + ' matching products'; }],
    [/^Còn (\d+) sản phẩm$/, function (m) { return m[1] + ' in stock'; }],
    [/^Mua thêm ([\d.,]+ đ) để được (.+)$/, function (m) { return 'Add ' + m[1] + ' more for ' + (DICT[m[2]] || m[2]); }]
  ];

  var ATTRS = ['placeholder', 'title', 'aria-label', 'alt', 'value'];
  var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, CODE: 1 };
  var busy = false, observer = null;

  function norm(s) { return s.replace(/\s+/g, ' ').trim(); }

  function translate(str) {
    var key = norm(str);
    if (!key) return null;
    if (Object.prototype.hasOwnProperty.call(DICT, key)) return DICT[key];
    for (var i = 0; i < PATTERNS.length; i++) {
      var m = key.match(PATTERNS[i][0]);
      if (m) return PATTERNS[i][1](m);
    }
    return null;
  }

  function textNode(node) {
    var cur = node.nodeValue;
    if (node.__i18n && node.__i18n.en === cur) {            // đang là bản dịch của chúng ta
      if (lang === 'vi') { node.nodeValue = node.__i18n.vi; }
      return;
    }
    if (lang === 'vi') { node.__i18n = null; return; }
    var en = translate(cur);
    if (en == null) { node.__i18n = null; return; }
    var lead = cur.match(/^\s*/)[0], trail = cur.match(/\s*$/)[0];
    var out = lead + en + trail;
    node.__i18n = { vi: cur, en: out };
    node.nodeValue = out;
  }

  function attrs(el) {
    for (var i = 0; i < ATTRS.length; i++) {
      var a = ATTRS[i];
      if (!el.hasAttribute(a)) continue;
      if (a === 'value' && !(el.tagName === 'INPUT' && /^(button|submit)$/i.test(el.type))) continue;
      var store = el.__i18nAttr || (el.__i18nAttr = {});
      var cur = el.getAttribute(a);
      var rec = store[a];
      if (rec && rec.en === cur) { if (lang === 'vi') el.setAttribute(a, rec.vi); continue; }
      if (lang === 'vi') { store[a] = null; continue; }
      var en = translate(cur);
      if (en == null) { store[a] = null; continue; }
      store[a] = { vi: cur, en: en };
      el.setAttribute(a, en);
    }
  }

  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { textNode(root); return; }
    if (root.nodeType !== 1 || SKIP[root.tagName]) return;
    attrs(root);
    for (var c = root.firstChild; c; c = c.nextSibling) walk(c);
  }

  function run(root) {
    busy = true;
    try { walk(root || document.body); } finally { busy = false; }
  }

  function applyTitle() {
    if (!document.__titleVi) document.__titleVi = document.title;
    var d = DICT[norm(document.__titleVi)];
    if (document.__titleCustom) return;
    document.title = lang === 'en' && d ? d : document.__titleVi;
  }

  function start() {
    if (observer) return;
    observer = new MutationObserver(function (muts) {
      if (busy) return;
      busy = true;
      try {
        muts.forEach(function (m) {
          if (m.type === 'childList') m.addedNodes.forEach(walk);
          else if (m.type === 'characterData') textNode(m.target);
          else if (m.type === 'attributes') attrs(m.target);
        });
      } finally { busy = false; }
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }

  function updateSwitchers() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-set-lang]').forEach(function (b) {
      var on = b.getAttribute('data-set-lang') === lang;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function setLang(next) {
    if (LANGS.indexOf(next) < 0 || next === lang) return;
    lang = next;
    try { localStorage.setItem(KEY, lang); } catch (e) {}
    updateSwitchers();
    run(document.body);
    applyTitle();
    window.dispatchEvent(new CustomEvent('langchange', { detail: { lang: lang } }));
  }

  // t({vi:'…', en:'…'}) hoặc t('khoá tiếng Việt')
  function t(x) {
    if (x && typeof x === 'object') return x[lang] != null ? x[lang] : x.vi;
    if (lang === 'vi') return x;
    var d = translate(String(x));
    return d == null ? x : d;
  }

  function setTitle(obj) { document.__titleCustom = true; document.title = t(obj); }
  function clearTitle() { document.__titleCustom = false; applyTitle(); }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-set-lang]');
    if (b) { e.preventDefault(); setLang(b.getAttribute('data-set-lang')); }
  });

  function init() {
    updateSwitchers();
    run(document.body);
    applyTitle();
    start();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  window.I18n = {
    t: t,
    lang: function () { return lang; },
    setLang: setLang,
    setTitle: setTitle,
    clearTitle: clearTitle,
    add: function (map) { Object.keys(map).forEach(function (k) { DICT[k] = map[k]; }); run(document.body); },
    refresh: function () { run(document.body); }
  };
})();