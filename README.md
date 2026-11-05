# Glowing Tabletop Fountain

Build the actual project described in the following customer brief. Use all attached real product photos and original MP4; persist them as project assets, not temporary upload URLs. Arabic Egyptian RTL premium mobile-first single product tabletop LED fountain COD store. First image is hero. Cream, charcoal and muted gold, generous whitespace, elegant Cairo/Tajawal typography. Suggested hero: "ركن صغير… وهدوء يملأ المكان" and product "نافورة ميا LED صغيرة". No invented brand; use descriptive product identity. No medical claims or unverified outdoor/waterproof/material/electrical/dimension claims.
IMPORTANT current facts: User has NOT supplied price, shipping rates/coverage, policies, store contacts, n8n URL, Google OAuth, tracking IDs. I have asked them. Build useful implementation now, but missing commerce config must be null, never fabricated; show honest unavailable price and prevent final submission until server price/shipping configured. Do not fake order success, DB, sync or admin data. Prepare secure backend, migrations, transactional orders+outbox, server validation/calculation/idempotency/rate limit, protected real admin, retry dispatcher and importable n8n workflow plus setup documentation. Provision default cloud/Supabase if available in authorized workspace; report any approval dependency. No public self-signup can grant admin. External integrations only mark configured after actual verification. No final production publish.
Please implement and test as much as possible autonomously, especially visual page/video/gallery/checkout and secure backend. Provide actual test results and remaining setup. Full customer brief follows:
# MASTER PROMPT — High-Converting Egyptian E-commerce Landing Page

## المهمة الأساسية

أريد منك استخدام GPT Work لإنشاء Landing Page احترافية لبيع منتج واحد في السوق المصري من خلال منصة Lovable.

سأوفر لك:
- صور المنتج الحقيقية.
- فيديو المنتج.
- وصف المنتج ومميزاته.
- سعر المنتج والعروض المتاحة.
- الألوان والمقاسات إن وجدت.
- معلومات الشحن والاستبدال والاسترجاع.

**الهدف:** إنشاء صفحة هبوط احترافية عالية التحويل (High-Converting Landing Page)، تجعل العميل القادم من إعلانات Facebook وInstagram وTikTok يفهم المنتج ويثق في العرض ويسجل طلب شراء بسهولة، دون الحاجة لإنشاء حساب.

يجب أن تعمل الصفحة بنظام الدفع عند الاستلام (Cash on Delivery)، مع حفظ الطلبات تلقائيًا في Supabase وإضافتها إلى Google Sheets باستخدام n8n.

---

# 1. دورك كفريق عمل متكامل

تصرف كفريق مكوّن من:

1. Senior UI/UX Designer.
2. Conversion Rate Optimization (CRO) Specialist.
3. Egyptian E-commerce Marketing Expert.
4. Direct Response Copywriter.
5. Senior React Developer.
6. Lovable Development Expert.
7. Supabase Database Engineer.
8. n8n Automation Engineer.
9. Google Sheets Integration Specialist.
10. Quality Assurance Engineer.

أنت مسؤول عن التخطيط والتنفيذ والاختبار، وليس مجرد كتابة اقتراحات أو تصميم واجهة شكلية.

استخدم التطبيقات والمتصفح المتاحين لك في GPT Work لتنفيذ المشروع فعليًا، مع طلب التفويض مني عندما يتطلب الأمر تسجيل الدخول أو ربط الحسابات.

لا تنشر المشروع على الدومين النهائي دون موافقتي.

---

# 2. تحليل المنتج قبل التنفيذ

افحص جميع الملفات التي سأرفعها.

المطلوب:

- تحليل جميع صور المنتج.
- مشاهدة فيديو المنتج وفهم محتواه.
- استخراج المميزات الحقيقية.
- تحديد الفوائد العملية التي تهم المستهلك المصري.
- تحديد أفضل صورة رئيسية.
- تحديد أفضل ترتيب للصور والفيديو.
- كتابة عناوين تسويقية قوية.
- تحديد الاعتراضات التي قد تمنع العميل من الشراء ومعالجتها بمعلومات حقيقية.

اكتب المحتوى بالعامية المصرية الاحترافية، بأسلوب واضح ومقنع.

لا تخترع مواصفات أو تقييمات عملاء أو خصومات أو شهادات ثقة غير حقيقية.

إذا كانت هناك معلومة أساسية غير متوفرة، اطلبها مني قبل استخدامها في الصفحة.

---

# 3. تصميم Landing Page على Lovable

## الهوية البصرية

أريد تصميمًا Premium احترافيًا مستوحى من بساطة Apple في استخدام المساحات البيضاء والخطوط والصور، مع أسلوب بيع مباشر مناسب للسوق المصري.

المتطلبات:

- Arabic RTL بالكامل.
- تصميم Mobile First.
- خطوط Cairo أو Tajawal.
- ألوان متناسقة مع صور المنتج.
- تصميم عصري ونظيف ومميز.
- تأثيرات حركة خفيفة واحترافية.
- صور كبيرة وواضحة.
- أزرار طلب بارزة.
- واجهة سريعة وسهلة الاستخدام.
- عدم إضافة عناصر مشتتة أو قوائم غير ضرورية.

يجب أن تظهر أهم معلومات المنتج والعرض وزر الطلب من أول شاشة على الموبايل قدر الإمكان.

## هيكل الصفحة

### Section 1 — Hero

- صورة رئيسية عالية الجودة للمنتج.
- عنوان جذاب يوضح الفائدة الأساسية.
- وصف تسويقي مختصر.
- السعر الحالي بالجنيه المصري.
- السعر السابق فقط إذا كان حقيقيًا.
- توضيح العرض إن وجد.
- عبارة «الدفع عند الاستلام».
- زر «اطلب دلوقتي».

### Section 2 — Product Video

استخدم الفيديو الأصلي الذي سأقدمه.

- مشغل متجاوب مع الهواتف.
- صورة مصغرة مناسبة.
- إمكانية التحكم بالصوت.
- عدم تشغيل الصوت تلقائيًا.
- تحميل الفيديو بطريقة لا تؤثر على سرعة الصفحة.
- زر طلب أسفل الفيديو.

### Section 3 — Product Benefits

اعرض من 3 إلى 6 فوائد حقيقية للمنتج باستخدام:

- أيقونة بسيطة.
- عنوان قصير.
- وصف واضح.

ركز على الفائدة بالنسبة للعميل، وليس المواصفات التقنية فقط.

### Section 4 — Product Gallery

- عرض جميع الصور الأصلية المناسبة.
- إمكانية تكبير الصور.
- معرض متجاوب مع الموبايل.
- اختيار اللون أو المقاس إذا كانت هناك خيارات.
- المحافظة على التفاصيل الحقيقية للمنتج.

### Section 5 — Pricing & Offers

- عرض السعر الأساسي.
- عرض باقات الكميات إن وجدت.
- حساب التوفير الحقيقي.
- توضيح تكلفة الشحن.
- زر طلب واضح.

لا تستخدم عدادات تنازلية وهمية أو عبارات ندرة غير مثبتة.

### Section 6 — Trust & Confidence

اعرض المعلومات المتاحة فعلًا عن:

- الدفع عند الاستلام.
- الشحن للمحافظات المتاحة.
- الاستبدال والاسترجاع.
- ضمان المنتج إن وجد.
- تقييمات العملاء الحقيقية إذا وفرتها.
- وسائل التواصل الرسمية.

### Section 7 — Fast Checkout

نموذج طلب مباشر داخل نفس الصفحة، دون تحويل العميل لموقع آخر.

### Section 8 — FAQ

أسئلة شائعة عن السعر والتوصيل والدفع والمقاسات وسياسة الاسترجاع.

---

# 4. نموذج الطلب السريع — Cash on Delivery

هذا أهم جزء في المشروع.

## الحقول المطلوبة

1. الاسم بالكامل — إجباري.
2. رقم الموبايل المصري — إجباري.
3. المحافظة — قائمة بجميع محافظات مصر.
4. المدينة أو المنطقة — إجباري.
5. العنوان بالتفصيل — إجباري.
6. اللون — إذا كان متاحًا.
7. المقاس — إذا كان متاحًا.
8. الكمية — افتراضيًا 1.
9. ملاحظات إضافية — اختياري.

لا تطلب بريدًا إلكترونيًا أو إنشاء حساب أو كلمة مرور.

## تجربة الاستخدام

- استخدام لوحة مفاتيح رقمية لحقل الهاتف.
- دعم الأرقام العربية والإنجليزية.
- التحقق من صحة رقم الموبايل المصري.
- إظهار رسائل واضحة عند وجود أخطاء.
- عدم مسح بيانات العميل عند فشل الإرسال.
- تصميم مناسب للاستخدام بيد واحدة على الهاتف.
- إظهار ملخص الطلب قبل الإرسال النهائي.

## ملخص الطلب

يجب أن يظهر:

- اسم المنتج.
- الصورة.
- اللون والمقاس إن وجدا.
- الكمية.
- سعر القطعة.
- الخصومات الحقيقية.
- مصاريف الشحن.
- الإجمالي المستحق.

احسب الأسعار النهائية على الخادم، ولا تثق في الأسعار القادمة من المتصفح.

إذا لم تكن تكلفة الشحن معروفة، اطلب مني جدول أسعار الشحن. لا تخترع رسومًا أو تعرض إجماليًا نهائيًا مضللًا.

## زر الطلب

النص:

**«أكد طلبك – الدفع عند الاستلام»**

بعد الضغط:

1. تحقق من البيانات.
2. احفظ الأوردر في Supabase.
3. أنشئ Order ID فريدًا.
4. سجّل مهمة إرسال الطلب إلى Google Sheets.
5. اعرض رسالة نجاح بعد الحفظ المؤكد.
6. اعرض رقم الأوردر للعميل.

رسالة النجاح المقترحة:

«تم تسجيل طلبك بنجاح ✅

رقم طلبك: [ORDER_ID]

شكرًا لطلبك! هنراجع بيانات الأوردر ونتواصل معاك لتأكيده قبل الشحن.

الدفع عند الاستلام.»

يجب منع تكرار الطلب نتيجة الضغط المتكرر على الزر أو إعادة المحاولة.

---

# 5. ربط Supabase وحفظ الطلبات

استخدم Supabase أو Backend مناسبًا متكاملًا مع Lovable.

أنشئ جدول orders يحتوي على الحقول:

- id
- order_number
- created_at
- customer_name
- phone
- governorate
- city
- full_address
- product_id
- product_name
- selected_color
- selected_size
- quantity
- unit_price
- shipping_fee
- discount_amount
- total_price
- payment_method
- order_status
- customer_notes
- utm_source
- utm_medium
- utm_campaign
- utm_content
- sync_status

القيم الافتراضية:

payment_method = COD

order_status = New

sync_status = Pending

استخدم صلاحيات وصول آمنة، مع منع الزوار من قراءة طلبات العملاء الآخرين.

أنشئ وظيفة Backend آمنة لإنشاء الطلبات، مع التحقق من المدخلات، وحماية ضد الإرسال الآلي، وتحديد معدل الطلبات، ومنع التكرار.

اجعل Supabase هو المصدر الأساسي للبيانات.

---

# 6. ربط Google Sheets تلقائيًا

**هذا شرط أساسي لا يمكن الاستغناء عنه.**

أريد أن يظهر كل طلب جديد في Google Sheets تلقائيًا بعد تسجيله بنجاح في Supabase.

## البنية المطلوبة

Landing Page (Lovable)
↓
Secure Backend
↓
Supabase Database
↓
Reliable Sync / n8n Workflow
↓
Google Sheets

## إعداد Google Sheets

أنشئ ملفًا باسم:

**Landing Page Orders**

وورقة باسم:

**Orders**

الأعمدة المطلوبة بالترتيب:

A. Order ID

B. Order Date

C. Customer Name

D. Phone Number

E. Governorate

F. City

G. Full Address

H. Product Name

I. Product Color

J. Product Size

K. Quantity

L. Unit Price

M. Shipping Fee

N. Discount

O. Total Price

P. Payment Method

Q. Order Status

R. Customer Notes

S. UTM Source

T. UTM Campaign

U. Sync Status

استخدم توقيت Africa/Cairo لتاريخ الطلب المعروض.

## n8n Workflow

أنشئ Workflow يتضمن:

1. Webhook Trigger.
2. Authentication Verification.
3. Data Validation.
4. Google Sheets Lookup by Order ID.
5. Append Row إذا لم يكن الطلب موجودًا.
6. Update Row إذا كان الطلب موجودًا ويحتاج إلى تحديث.
7. تسجيل نجاح أو فشل المزامنة في Supabase.
8. Error Handling وRetry.

يجب استخدام Order ID كمعرف فريد لمنع التكرار.

استخدم آلية Outbox أو Queue موثوقة لتسجيل طلبات المزامنة في قاعدة البيانات بصورة لا تضيع مع تعطل الشبكة.

لا تعتمد على إرسال Webhook من متصفح العميل.

يجب حماية Webhook بمصادقة آمنة، وعدم إظهار مفاتيح Google أو Supabase السرية في الواجهة الأمامية.

## عند تعطل Google Sheets

إذا لم تنجح الإضافة:

- يظل الطلب محفوظًا في Supabase.
- تسجل المزامنة Failed أو Pending.
- يعيد النظام محاولة الإرسال تلقائيًا.
- لا يتم إنشاء طلب مكرر.
- يستطيع المسؤول إعادة المزامنة يدويًا عند الحاجة.

نفّذ آلية فحص دورية للطلبات غير المتزامنة.

## الربط الفعلي

استخدم Google Sheets OAuth2 من خلال حساب Google الذي سأصرح به.

استخدم n8n الخاص بي أو اسألني عن رابط n8n إذا لم يكن متاحًا.

لا تعتبر الربط مكتملًا إلا بعد تنفيذ طلب تجريبي والتحقق من ظهوره في Google Sheets.

---

# 7. لوحة إدارة الطلبات

أنشئ Admin Dashboard مستقلة ومحمية.

## الوظائف

- إجمالي الأوردرات.
- الطلبات الجديدة.
- الطلبات قيد التأكيد.
- الطلبات المؤكدة.
- الطلبات المشحونة.
- الطلبات المكتملة.
- الطلبات الملغاة.
- البحث برقم الهاتف.
- البحث برقم الطلب.
- تصفية حسب المحافظة.
- تصفية حسب التاريخ.
- تحديث حالة الأوردر.
- تصدير CSV أو Excel.
- عرض حالة المزامنة مع Google Sheets.

يمكن للموظف المصرح له متابعة الطلبات دون الوصول إلى إعدادات النظام.

استخدم نظام تسجيل دخول آمن وصلاحيات مناسبة.

يجب ألا تكون بيانات الطلبات متاحة لزوار Landing Page.

---

# 8. نظام تحسين التحويلات CRO

نفّذ:

## Sticky Order Bar

شريط ثابت أسفل شاشة الهاتف يحتوي على:

**السعر + اطلب دلوقتي**

ويختفي أو يتكيف عند ظهوره فوق نموذج الطلب حتى لا يغطي الحقول.

## Smart CTA

ضع أزرار الطلب بعد الأقسام الرئيسية.

## Smooth Scrolling

عند الضغط على زر الطلب، انتقل مباشرة إلى نموذج الطلب.

## Fast Checkout

تسجيل الطلب دون إنشاء حساب.

## Trust Signals

إظهار الدفع عند الاستلام ومعلومات الشحن والسياسات الحقيقية.

## Friction Reduction

تقليل الحقول غير الضرورية وتسهيل إدخال البيانات.

## Responsive Design

اختبر الصفحة على شاشات الهواتف الصغيرة والمتوسطة والكبيرة والكمبيوتر.

---

# 9. Meta Pixel & Marketing Tracking

جهّز المشروع لربط:

- Meta Pixel.
- Google Analytics 4.
- TikTok Pixel إذا احتجته مستقبلًا.

الأحداث المطلوبة:

- PageView.
- ViewContent.
- InitiateCheckout.
- Lead عند الحاجة.
- Purchase بعد تسجيل طلب ناجح، وفق إعداد التحويلات المعتمد.

استخدم العملة EGP والقيمة الحقيقية للأوردر.

يجب عدم احتساب نفس الأوردر مرتين.

راعِ أن طلب COD ليس بالضرورة عملية بيع مدفوعة فعلًا، وأن التقارير يجب أن تميز الطلبات المسجلة عن الطلبات المؤكدة والمكتملة.

احفظ UTM Parameters مع الأوردر لتحديد مصدر الطلب.

راعِ الخصوصية والموافقات اللازمة للتتبع.

لا ترسل الاسم أو الهاتف أو العنوان إلى أدوات التحليلات بصورة غير مناسبة.

---

# 10. سرعة الصفحة والأداء

- تحسين الصور بصيغ حديثة.
- Lazy Loading.
- تحميل الفيديو عند الحاجة.
- تقليل حجم JavaScript.
- تحسين Core Web Vitals.
- تحسين SEO الأساسي.
- تجنب Layout Shift.
- عدم استخدام مكتبات غير ضرورية.
- تحسين الخطوط العربية.
- عدم وجود أخطاء تؤثر على تشغيل الصفحة.

الأولوية لسرعة الموبايل على شبكات الإنترنت المصرية.

---

# 11. اختبارات إلزامية قبل التسليم

نفّذ اختبارات حقيقية تشمل:

1. فتح الصفحة على الموبايل.
2. ظهور الصور والفيديو.
3. جميع أزرار «اطلب دلوقتي».
4. صحة إدخال البيانات.
5. حساب السعر والشحن والإجمالي.
6. تسجيل طلب تجريبي.
7. حفظ الطلب في Supabase.
8. وصول الطلب إلى Google Sheets.
9. تطابق بيانات الطلب بين النظامين.
10. عدم تكرار الطلب عند إعادة إرسال الحدث.
11. ظهور الطلب في Admin Dashboard.
12. فشل مؤقت في Google Sheets وإعادة المزامنة.
13. حماية لوحة الإدارة.
14. تجربة RTL.
15. فحص أخطاء الصفحة والروابط.

لا تدّعِ نجاح أي اختبار لم يتم تشغيله والتحقق من نتيجته فعليًا.

---

# 12. طريقة تنفيذ المهمة داخل GPT Work

أريد منك تنفيذ المشروع عبر المتصفح والتطبيقات المتاحة وفق التسلسل التالي:

**المرحلة 1:** مراجعة الصور والفيديو والوصف والأسعار.

**المرحلة 2:** إعداد المحتوى التسويقي وهيكل الصفحة.

**المرحلة 3:** فتح Lovable وإنشاء Landing Page.

**المرحلة 4:** ضبط التصميم وتجربة الموبايل.

**المرحلة 5:** إنشاء قاعدة البيانات وربط Supabase.

**المرحلة 6:** تنفيذ نموذج الطلب والدفع عند الاستلام.

**المرحلة 7:** إنشاء Google Sheet وتجهيز أعمدته.

**المرحلة 8:** تنفيذ n8n Workflow وربطه بقاعدة البيانات وGoogle Sheets.

**المرحلة 9:** إنشاء Admin Dashboard.

**المرحلة 10:** تجهيز Meta Pixel والتتبع.

**المرحلة 11:** تنفيذ الاختبارات وتصحيح الأخطاء.

**المرحلة 12:** تسليم المعاينة وتقرير التنفيذ.

استخدم الحسابات المتصلة والمصرح بها فقط، ولا تطلب مني مشاركة كلمات مرور أو مفاتيح سرية داخل المحادثة إذا كانت هناك طريقة ربط آمنة.

إذا كانت خدمة معينة تحتاج إلى تفويض أو بيانات أساسية، اطلب الإجراء الضروري فقط ثم أكمل التنفيذ.

لا تنفذ النشر النهائي دون موافقتي.

---

# 13. المطلوب عند التسليم

أريد استلام:

1. رابط معاينة Landing Page.
2. رابط مشروع Lovable.
3. رابط Google Sheets.
4. حالة اتصال Supabase.
5. حالة تشغيل n8n Workflow.
6. رابط لوحة الإدارة.
7. نتيجة تجربة تسجيل أوردر فعلي تجريبي.
8. نتيجة اختبار وصول الأوردر إلى Google Sheets.
9. تقرير مختصر عن الأداء والتجاوب.
10. قائمة بأي خطوات متبقية قبل النشر.

## تعليمات نهائية

أريد Landing Page احترافية ومميزة وليست قالبًا تقليديًا.

ركز على السوق المصري، وتجربة الموبايل، وسهولة الشراء، والدفع عند الاستلام، وتحويل زيارات الإعلانات إلى طلبات حقيقية.

المشروع لا يعتبر مكتملًا بمجرد الانتهاء من التصميم. يجب أن يعمل نظام الطلبات وحفظ البيانات والربط مع Google Sheets بصورة صحيحة.

ابدأ بتحليل الملفات التي سأوفرها، ثم نفّذ المشروع خطوة بخطوة بأفضل جودة ممكنة، مع المحافظة على خصوصية العملاء وحماية بياناتهم.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://glowing-tabletop-fountain.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e73e162f-4adb-4ccb-b5a2-1ea1a5578504).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
