# Lab Management System - TODO

## Phase 1: Database Schema & Infrastructure
- [x] Define all database tables in drizzle/schema.ts (users, samples, distributions, testResults, reviews, attachments, certificates, notifications, sampleHistory)
- [x] Run migration and apply SQL
- [x] Add DB query helpers in server/db.ts (getAllSamples, createSample, createDistribution, createTestResult, createReview, createCertificate, getAllCertificates, getDashboardStats, etc.)

## Phase 2: Authentication & Role Management
- [x] Extend user roles (reception, lab_manager, technician, sample_manager, qc_inspector, admin)
- [x] Role-based access control in tRPC procedures
- [x] User management page (Admin)
- [x] Login page with role display in sidebar

## Phase 3: Sample Reception (Phase 1 & 2 of workflow)
- [x] Sample registration form (contractor, project, type, quantity, condition)
- [x] Auto-generate sample ID (S-YYYY-NNN)
- [x] Print PDF receipt (browser print)
- [x] Sample distribution interface for Lab Manager
- [x] Auto-generate distribution order ID (DIST-YYYY-NNN)
- [x] Assign technician with specialty/workload info
- [x] Set Min/Max acceptable limits per test

## Phase 4: Technician Interface (Phase 3 of workflow)
- [x] Technician dashboard - assigned samples list
- [x] Concrete compression test result entry form
- [x] Photo/document attachment upload (via S3)
- [x] Update sample status to PROCESSED

## Phase 5: Automated Processing (Phase 4 of workflow)
- [x] Auto-calculate average, std deviation, percentage
- [x] Compare against Min/Max limits
- [x] Generate charts (trend line, bar chart) in SampleDetail
- [x] Notify Sample Manager on result submission

## Phase 6: Manager Review & QC (Phase 5 & 6 of workflow)
- [x] Sample Manager review interface
- [x] View processed results and charts
- [x] Add comments, approve/revise/reject with digital signature
- [x] QC Inspector review interface
- [x] Final decision with QC notes and digital signature
- [x] Return to technician flow when revision requested (notifications)

## Phase 7: Clearance Certificate (Phase 7 of workflow)
- [x] Verify all tests complete and approved (qc_passed status check)
- [x] Document collection checklist (5 documents)
- [x] Generate clearance certificate (CERT-YYYY-NNN)
- [x] Issue as PDF (browser print)

## Phase 8: Dashboard & Notifications
- [x] Main dashboard with real-time sample status
- [x] KPIs and statistics (total, by status, by type)
- [x] Filter by status, project, contractor
- [x] Notification system for workflow transitions
- [x] Revision history tracking (sampleHistory table)
- [x] WorkflowProgress component (7-stage visualization)
- [x] SampleDetail page with full history, charts, reviews

## Phase 9: Testing & Polish
- [x] Write vitest unit tests (13 tests passing)
- [x] UI polish and professional design
- [x] App.tsx routes registered

## Pending / Future
- [ ] PDF generation server-side (currently browser print)
- [ ] Add more test types beyond concrete compression
- [ ] Dedicated notifications page (/notifications)
- [ ] Compliance pie chart in SampleDetail

## نظام المصادقة الداخلي (إضافة جديدة)
- [x] تحديث جدول users: إضافة username, passwordHash, isActive, permissions (JSON)
- [x] API تسجيل الدخول الداخلي (POST /api/auth/local/login) بـ username + password
- [x] API تسجيل الخروج الداخلي (POST /api/auth/local/logout)
- [x] صفحة تسجيل الدخول الداخلية (Login.tsx - بدون Manus OAuth)
- [x] لوحة إدارة المستخدمين: إضافة/تعديل/حذف مستخدمين مع تعيين username وpassword
- [x] لوحة الصلاحيات التفصيلية: 7 مجموعات بـ 27 صلاحية قابلة للتخصيص لكل مستخدم
- [x] التوجيه التلقائي لكل مستخدم لصفحته الرئيسية حسب دوره
- [x] حماية جميع الصفحات بالتحقق من الجلسة (ProtectedRoute)
- [x] اختبارات Vitest لنظام المصادقة (10 اختبارات جديدة - 23 إجمالاً)

## نموذج اختبار ضغط الكيوبات الخرسانية
- [x] تحديث schema: إضافة جدول concreteTestGroups (مجموعات الكيوبات حسب العمر)
- [x] تحديث schema: إضافة جدول concreteCubes (كيوب واحد مع نتائجه)
- [x] API: إنشاء/تحديث/حذف مجموعات وكيوبات
- [x] نموذج إدخال الفني: جدول تفاعلي مع حساب تلقائي (Density, Strength, Avg)
- [x] إمكانية إضافة كيوبات إضافية لكل مجموعة عمر
- [x] صفحة التقرير بتنسيق مطابق لملف Excel الأصلي
- [x] طباعة التقرير كـ PDF
- [x] 15 اختبار Vitest للحسابات (38 إجمالاً ناجحة)

## إصلاح الأخطاء
- [x] إصلاح خطأ جدول samples - عدم تطابق schema مع قاعدة البيانات الفعلية

## تحديث نظام تسجيل العينات
- [x] إضافة جدول contracts (رقم العقد، اسم العقد، المقاول)
- [x] رقم العينة مشفر LAB-YYYY-NNNN لا يكشف المشروع أو المقاول
- [x] عند اختيار رقم العقد يُجلب اسم العقد واسم المقاول تلقائياً (read-only)
- [x] إدارة العقود من صفحة Tests & Contractors (أدمن + QC)
- [x] تحويل جميع الأسعار والعملة إلى درهم إماراتي (AED)

## تحديث لوحة التحكم - العمل اليومي
- [x] إضافة عرض التاريخ واليوم الحالي في أعلى الداشبورد
- [x] إضافة قسم "العمل اليومي" يعرض العينات المستلمة والمعالجة اليوم
- [x] إضافة فلتر من/إلى التاريخ لعرض العمل في فترة زمنية محددة
- [x] تحديث routers.ts بـ query للعمل اليومي مع فلتر التاريخ

## دعم ثنائي اللغة (عربي/إنجليزي)
- [x] إنشاء LanguageContext مع useState لحفظ اللغة الحالية
- [x] إنشاء ملف translations داخل LanguageContext يحتوي على جميع النصوص
- [x] إضافة زر تبديل اللغة AR/EN في شريط DashboardLayout العلوي
- [x] دعم RTL/LTR تلقائي عند تغيير اللغة
- [x] تكبير التوقيت في الداشبورد
- [x] ترجمة Home.tsx (الداشبورد)
- [x] ترجمة قائمة الـ Sidebar
- [x] ترجمة StatusBadge

## إصلاح RTL الاحترافي للعربية
- [x] نقل القائمة الجانبية لليمين عند تفعيل العربية
- [x] إزالة الفراغ الأبيض على اليسار في وضع RTL
- [x] إضافة خط IBM Plex Sans Arabic الاحترافي للعربية
- [x] ضبط اتجاه جميع عناصر الـ Sidebar في RTL

## إصلاح ترتيب الأيقونات في RTL
- [x] إصلاح شامل لجميع مشاكل RTL: أيقونات Sidebar، جداول، إدخالات، أسهم، dropdown، أرقام مونو

## إصلاح ترتيب الأيقونة في RTL والتسميات
- [ ] الأيقونة لا تزال على اليسار قبل النص في RTL — يجب أن تكون على اليسار والنص على اليمين (أي: نص ← أيقونة)
- [ ] تغيير "مراجعة المدير" إلى "مشرف" في جميع أنحاء الموقع (Sidebar، الترجمات، الصفحات)

## إصلاح ترتيب الأيقونة في RTL والتسميات
- [x] إصلاح ترتيب الأيقونة والنص في RTL — الأيقونة يسار والنص يمين
- [x] تغيير "Manager Review" إلى "Supervisor" إنجليزي و"مشرف" عربي في جميع أنحاء الموقع

## إصلاح خطأ إضافة مقاول
- [ ] خطأ عند إضافة مقاول جديد: عمود contractorCode لا يقبل القيمة الفارغة

## إصلاح نموذج المقاول وتغيير التسميات
- [x] إصلاح خطأ إضافة مقاول: توليد contractorCode تلقائياً إذا لم يُدخل
- [x] جعل حقلي الاسم الإنجليزي والعربي مطلوبَين مع نجمة حمراء في النموذج
- [x] تغيير "Lab Manager" إلى "Supervisor" في كل مكان (تسجيل المستخدمين، الأدوار، الترجمات)

## ترجمة شاملة لجميع الصفحات
- [ ] توسيع LanguageContext بجميع النصوص المطلوبة
- [ ] ترجمة صفحة Reception كاملة
- [ ] ترجمة صفحة Distribution كاملة
- [ ] ترجمة صفحة Technician كاملة
- [ ] ترجمة صفحة Supervisor Review كاملة
- [ ] ترجمة صفحة QC Review كاملة
- [ ] ترجمة صفحة Clearance كاملة
- [ ] ترجمة صفحة SampleDetail كاملة
- [ ] ترجمة صفحة UserManagement كاملة
- [ ] ترجمة صفحة TestTypesManagement كاملة

## مراجعة وإصلاح منطق Pass/Fail لجميع الفحوصات
- [ ] فحص الخرسانة: Pass إذا >= 100% من المستهدف (28 يوم) أو >= 65-70% (7 أيام)
- [ ] مراجعة جميع أنواع الفحوصات الأخرى وإصلاح منطق الحكم حسب المعايير القياسية
- [ ] إضافة تفاصيل الحساب ومدى القبول في نموذج كل فحص

## نماذج فحوصات مخصصة لجميع أنواع المواد
- [ ] تحليل ملفات Excel لكل نوع فحص
- [ ] نموذج فحص الصلب (Steel): Tensile Strength, Yield, Elongation, Bend Test
- [ ] نموذج فحص الركام (Aggregates): Sieve Analysis, Specific Gravity, Flakiness/Elongation Index
- [ ] نموذج فحص الأسفلت (Asphalt): Marshall Test, Bitumen Content, Gradation
- [ ] نموذج فحص التربة (Soil): Proctor, Atterberg Limits, Sieve Analysis
- [ ] نموذج فحص البلوك والطوب (Masonry Blocks): Compressive Strength
- [ ] نموذج فحص الكور الخرسانية (Concrete Cores)
- [ ] منطق Pass/Fail صحيح لكل نوع حسب المعيار المرجعي

## فصل الفحوصات وبناء النماذج الاحترافية (المرحلة الجديدة)
- [x] فصل جميع الفحوصات في قاعدة البيانات (40 فحص مستقل بأسعار منفصلة)

### نماذج فحوصات الخرسانة
- [x] نموذج فحص كور الخرسانة (CONC_CORE) - BS 1881-120 مع تصحيح L/D
- [x] نموذج فحص البلوك الصلب/المجوف/الحراري (CONC_BLOCK_*) - BS 6073
- [x] نموذج فحص الإنترلوكينج 6سم/8سم (CONC_INTERLOCK_*) - BS EN 1338
- [x] نموذج فحص رمل الملاط (CONC_MORTAR_SAND) - ASTM C144 + رسم بياني
- [ ] نموذج تدرج ركام الخلطة الخرسانية (CONC_MIX_GRAD) + رسم بياني
- [x] نموذج فحص كمرات الخرسانة (CONC_BEAM_*) - تقرير مع Location وCast Date وAge

### نماذج فحوصات التربة
- [x] نموذج تحليل منخل التربة (SOIL_SIEVE) + رسم بياني
- [x] نموذج حدود أتربرج (SOIL_ATTERBERG) + منحنى تدفق Casagrande
- [x] نموذج بروكتور المعدل (SOIL_PROCTOR) + منحنى الدمك
- [ ] نموذج CBR (SOIL_CBR)
- [x] نموذج الكثافة الحقلية (SOIL_FIELD_DENSITY) - 3 طرق

### نماذج فحوصات الحديد
- [x] نموذج حديد التسليح BS4449/ASTM A615 (STEEL_REBAR_*)
- [ ] نموذج الصلب الإنشائي 9 مواصفات (STEEL_STRUCT_*)
- [ ] نموذج أنكر بولت (STEEL_ANCHOR_88)

### نماذج فحوصات الركام
- [x] نموذج تحليل منخل ركام خشن/ناعم (AGG_SIEVE_*) + رسم بياني
- [x] نموذج الكثافة النوعية وامتصاص الماء خشن/ناعم (AGG_SG_*)
- [x] نموذج مؤشر التفلطح (AGG_FLAKINESS)
- [x] نموذج مؤشر الاستطالة (AGG_ELONGATION)

### نماذج فحوصات الأسفلت
- [x] نموذج ACWC/ACBC مع مارشال وتدرج (ASPH_ACWC/ACBC) + رسم بياني
- [ ] نموذج Hot Bin Gradation (ASPH_HOTBIN) + رسم بياني
- [x] نموذج كور الأسفلت (ASPH_CORE) - سماكة + فراغات هوائية
- [ ] نموذج معدل الرش SS1H/MC-70 (ASPH_TACK/PRIME)

### نموذج فحص الأسمنت
- [x] نموذج زمن الشك الابتدائي والنهائي (CEM_SETTING_TIME) - تقرير مع Initial & Final Setting Time

## اختبارات Vitest الاحترافية
- [x] 22 اختبار لحسابات النماذج المتخصصة (60 إجمالاً ناجحة)

## إصلاح قياسات الرسوم البيانية
- [x] إصلاح قياسات الرسوم البيانية في الداشبورد (Home.tsx) - زيادة الارتفاع + Legend + ألوان متعددة
- [ ] إصلاح قياسات الرسوم البيانية في SampleDetail.tsx
- [ ] إصلاح قياسات الرسوم البيانية في نماذج الفحوصات المتخصصة
- [ ] ضمان أن جميع الرسوم تملأ حاوياتها بشكل صحيح

## تعديل نموذج الكيوبات
- [x] تعديل نموذج الكيوبات ليبدأ بكيوب واحد فقط (بدلاً من 3)

## تقارير PDF وبراءة الذمة
- [x] إضافة زر طباعة تقرير PDF بعد تأكيد نتيجة الفحص (من صفحة التقني) - يفتح صفحة التقرير للطباعة
- [x] بناء صفحة SpecializedTestReport لعرض وطباعة تقرير أي نوع فحص
- [x] بناء صفحة ClearancePage لاستخراج براءة الذمة مع جرد الاختبارات
- [x] إضافة جدول clearance_requests في قاعدة البيانات
- [x] بناء clearance router في الباكيند (create, list, get, updateStatus)
- [ ] رفع مستندات براءة الذمة (5 مستندات: كتاب المقاول، كتاب القطاع، أمر الدفع، الإيصال، قائمة الاختبارات)
- [ ] طباعة وثيقة براءة الذمة الرسمية بالصيغة المعتمدة

## التوقيع التلقائي عند تأكيد استلام العينة
- [ ] إضافة حقل receivedBySignature في جدول samples (اسم المستخدم + وقت التوقيع)
- [x] عرض اسم المستلم (مستلم بواسطة) في جدول العينات بصفحة Reception

## التوقيع التلقائي عند تأكيد نتيجة الفحص
- [x] الباكيند يحفظ testedBy من ctx.user.name تلقائياً عند حفظ أي فحص متخصص
- [x] عرض حقل "Tested By" في جميع نماذج الفحوصات مع اسم الفني الحالي (read-only)

## إصلاح الطباعة وزر طباعة تفاصيل العينة
- [x] إصلاح زر الطباعة في نماذج الفحوصات المتخصصة - فتح tab جديد + طباعة تلقائية
- [x] إصلاح طباعة تقرير الكيوبات (ConcreteReport) - فتح tab جديد
- [x] زر Back يغلق التاب بدلاً من الرجوع للداشبورد
- [x] إضافة زر طباعة في صفحة تفاصيل العينة (SampleDetail)

## إعادة بناء سير عمل براءة الذمة
- [x] إضافة حقول QC review في جدول clearance_requests
- [x] إضافة qcReview procedure في الباكيند
- [x] تحديث issuePaymentOrder ليولد رقماً تلقائياً (PAY-YYYY-NNN)
- [x] إضافة بطاقة QC Review في ClearanceDetail مع WorkflowStepper
- [x] سير العمل: طلب → QC مراجعة → محاسب أمر دفع → انتظار دفع → رفع وصل → إصدار

## إصلاح مشاكل QC Review وبراءة الذمة
- [x] إصلاح خطأ التنبيهات في صفحة QC Review — إنشاء صفحة /notifications
- [x] إصلاح عدم ظهور طلبات براءة الذمة للـ QC لمراجعتها وتأكيد الاختبارات
- [x] إصلاح الحالة الأولية لطلب براءة الذمة من inventory_ready إلى pending
- [x] إصلاح صلاحية qcReview من qc_engineer إلى qc_inspector

## نظام الصلاحيات المتكامل (المرحلة الجديدة)
- [x] إصلاح مشكلة الصلاحيات — تطبيقها فوراً بدون الحاجة لإعادة تسجيل الدخول (getUserByOpenId يجلب من DB في كل request)
- [x] إضافة مستويين لكل صلاحية: view (مشاهدة فقط) و edit (مشاهدة + تعديل)
- [x] حصر تعديل الصلاحيات للأدمن فقط في الباكيند والفرونتيند
- [x] إضافة جدول audit_log لتسجيل كل تغيير مع اسم المستخدم والوقت والقيمة القديمة والجديدة
- [x] تحديث واجهة الصلاحيات لتعرض view/edit لكل قسم (PermissionToggle component)
- [x] تطبيق الصلاحيات في الـ frontend (إخفاء الأقسام في الـ sidebar حسب المستوى)
- [x] فصل updateRole وupdatePermissions عن update في الـ router
- [x] تحديث اختبارات Vitest (64 اختبار ناجح)

## إصلاح الطباعة وأخطاء الصلاحيات
- [x] إخفاء عناصر UI عند الطباعة (تغيير اللغة، الـ sidebar، الأزرار) عبر print CSS
- [x] فحص وإصلاح جميع الأخطاء التقنية للمستخدمين غير الأدمن

## تحسين رأس الطباعة الرسمي
- [x] إنشاء مكوّن PrintHeader موحّد (اسم المختبر + شعار + بيانات التقرير)
- [x] تطبيقه على SpecializedTestReport (تقرير نتيجة الفحص)
- [x] تطبيقه على ClearancePage (أمر الدفع + براءة الذمة)
- [x] إضافة زر طباعة في Analytics مع رأس رسمي
- [x] إصلاح كاردات الإحصائيات في UserManagement ديناميكياً

## إصلاح UserManagement وTests & Contractors
- [ ] إصلاح كاردات الإحصائيات في UserManagement لتعرض جميع الأدوار (QC Inspector, Sample Manager, إلخ)
- [ ] إصلاح تداخل النصوص في صفحة Tests & Contractors

## تحسين قائمة الاختبارات في مراجعة براءة الذمة
- [ ] تجميع الاختبارات حسب الفئة (خرسانة / تربة / حديد / ركام / أسفلت / إلخ)
- [ ] عرض عدد كل نوع اختبار داخل كل فئة (مثال: 40 مكعب خرسانة)
- [ ] عرض المجموع الكلي لكل فئة والمجموع العام

## صفحة الإحصائيات والتقارير
- [ ] إضافة backend procedure للإحصائيات مع فلاتر (تاريخ، عقد، نوع اختبار، فئة)
- [ ] بناء صفحة Analytics.tsx مع ملخص سريع ورسوم بيانية وجدول تفصيلي
- [ ] إضافة الصفحة للـ sidebar وApp.tsx

## طباعة صفحة الإحصائيات
- [ ] إضافة زر طباعة في صفحة Analytics مع رأس رسمي احترافي يظهر عند الطباعة

## رأس الطباعة الرسمي لكل وثيقة
- [ ] تحديث PrintHeader ليدعم عنوان نوع الوثيقة (وصل استلام / تقرير فحص / أمر دفع / براءة ذمة / إحصائيات)
- [ ] تطبيقه على وصل استلام العينة (PrintReceipt)
- [ ] تطبيقه على تقرير الفحوصات المتخصصة (SpecializedTestReport)
- [ ] تطبيقه على تقرير الكيوبات (ConcreteReport)
- [ ] تطبيقه على براءة الذمة / أمر الدفع (ClearancePage)
- [ ] إضافة زر طباعة في صفحة الإحصائيات (Analytics)

## التقرير الذكي المبسّط (LLM)
- [ ] إضافة procedure samples.generateSimplifiedReport في routers.ts باستخدام invokeLLM
- [ ] إضافة زر "تقرير مبسّط" في صفحة تفاصيل العينة SampleDetail.tsx
- [ ] نافذة عرض التقرير مع زر طباعة PDF رسمي

## ميزة التقرير المبسّط بالذكاء الاصطناعي
- [x] إضافة tRPC procedure: samples.generateSimplifiedReport في routers.ts
- [x] جمع بيانات العينة وجميع نتائج الاختبارات (testResults + specializedTestResults)
- [x] إرسال البيانات إلى Manus LLM (invokeLLM) مع prompt احترافي بالعربية
- [x] إنشاء SimplifiedReportModal في SampleDetail.tsx مع حالات التحميل والخطأ
- [x] زر "تقرير مبسّط" بأيقونة Sparkles في صفحة تفاصيل العينة
- [x] طباعة التقرير المبسّط في tab جديد بتنسيق رسمي مع رأس المختبر وتواقيع
- [x] إمكانية إعادة توليد التقرير
- [x] 64 اختبار Vitest ناجح

## تحسينات التقرير المبسّط وأمر الدفع
- [x] تبسيط prompt التقرير المبسّط: لغة أبسط، أقصر، أوضح للمقاول العادي
- [x] ربط إصدار أمر الدفع بتأكيد QC فقط (زر معطّل + رسالة تحذير قبل موافقة QC)
- [x] تحسين نموذج أمر الدفع: شبكة بيانات، تعليمات الدفع، صف الإجمالي بخلفية داكنة، توقيعات 3 أطراف

## دور المحاسب ونظام تنبيه تأخر الدفع
- [x] إضافة دور accountant في schema (users enum) + migration
- [x] صلاحية المحاسب: إصدار أمر الدفع، رفع المستندات، متابعة براءة الذمة فقط
- [x] إضافة المحاسب في السايدبار مع صفحة براءة الذمة كصفحته الرئيسية
- [x] تعديل توقيعات أمر الدفع: إزالة "مدير المختبر"، إبقاء المقاول والمحاسب
- [x] نظام تنبيه تأخر الدفع: تنبيه داخلي للمحاسب وQC بعد 3 أيام من إصدار أمر الدفع دون سداد
- [x] procedure: checkPaymentDelays يجلب طلبات الدفع المتأخرة ويرسل تنبيهات
- [x] خيار لغة الطباعة (عربي/إنجليزي) في نموذج أمر الدفع وجرد الاختبارات
- [x] إصلاح ترجمة صفحة براءة الذمة: إعادة كتابة الصفحة بدعم ثنائي اللغة
- [x] إزالة خيار رفع قائمة الاختبارات من مستندات براءة الذمة
- [x] إضافة زر طباعة جرد الاختبارات مباشرة في قسم جرد الاختبارات
- [x] إضافة زر فحص تأخر الدفع في header صفحة براءة الذمة
- [x] إصلاح فلترة أنواع الاختبارات في نموذج التوزيع: تعرض فقط الاختبارات المناسبة لنوع العينة
- [x] إضافة حقل sector (القطاع) الإلزامي في جدول samples + migration
- [x] إضافة حقل القطاع في نموذج تسجيل العينة (Reception) كحقل إلزامي (قطاع/1 إلى قطاع/5)
- [x] عرض القطاع في جداول العينات (Reception, Distribution)
- [x] إصلاح فلترة أنواع الاختبارات في التوزيع حسب نوع العينة
- [x] إزالة زر "فحص تأخر الدفع" من واجهة براءة الذمة
- [x] إضافة scheduledJobs.ts: فحص تلقائي كل 24 ساعة + تشغيله عند بدء الخادم
- [x] إزالة حقلي الحد الأدنى والأقصى من نموذج التوزيع
- [x] إصلاح Dialog التوزيع: إضافة max-h-[90vh] وoverflow-y-auto
- [x] تغيير "كاتالوج أنواع الاختبارات" إلى "قائمة أنواع الاختبارات" + حذف عمود النموذج
- [x] إصلاح تداخل أعمدة جدول أنواع الاختبارات
- [x] إزالة حقل "اسم الاختبار" المكرر من نموذج التوزيع
- [x] توسيط عنوان الـ Dialog في نموذج التوزيع

## تحسينات احترافية - مارس 2026
- [x] إضافة حقل القطاع في getAllSamples (db.ts) لإظهاره في جميع القوائم
- [x] عرض القطاع في صفحة SampleDetail (بطاقة معلومات العينة)
- [x] تمرير القطاع إلى PrintHeader عبر extraFields في SampleDetail
- [x] إضافة فلتر القطاع في صفحة الاستقبال (Reception.tsx)
- [x] إضافة فلتر القطاع في الداشبورد (Home.tsx) مع جدول العمل اليومي
- [x] تحسين واجهة قرار المشرف: إضافة حقل "سبب القرار" إلزامي عند الرفض أو طلب المراجعة
- [x] إضافة بطاقة ملخص بصرية (Pass/Fail) بارزة في أعلى Dialog المشرف
- [x] إضافة عمود القطاع في جداول الداشبورد وصفحة الاستقبال

## إصلاح أوامر الطباعة والمشاهدة
- [x] إنشاء صفحة PrintReceipt لطباعة إيصال الاستلام (/print-receipt/:id)
- [x] تسجيل route /print-receipt/:id في App.tsx
- [x] إصلاح زر PDF في Clearance.tsx (print-certificate route غير موجودة)
- [x] إضافة certificates.get procedure في routers.ts لجلب بيانات الشهادة
- [x] إنشاء صفحة PrintCertificate لطباعة براءة الذمة (/print-certificate/:id)
- [x] إصلاح خطأ PrintHeader عند docType غير موجود (Cannot read 'ar')
- [x] إنشاء صفحة PrintCertificate لطباعة شهادة التخليص (/print-certificate/:id)
- [x] تسجيل route /print-certificate/:id في App.tsx
- [x] /test-report و /concrete-report تعمل بشكل صحيح (الـ session cookie مشترك بين التابات في نفس الدومين)

## تنظيف صفحات الطباعة للمقاول
- [x] إزالة WorkflowProgress (خطوات الاستقبال/التوزيع/الاختبار/التقييم) من SampleDetail عند الطباعة
- [x] إزالة قسم سجل الأحداث (history) من SampleDetail عند الطباعة
- [x] إزالة قسم المراجعات الداخلية (reviews) من SampleDetail عند الطباعة
- [x] إزالة أمر التوزيع الداخلي من SampleDetail عند الطباعة
- [x] إزالة ملاحظات الفني الداخلية من SampleDetail عند الطباعة
- [x] SpecializedTestReport و ConcreteReport لا تحتويان على خطوات سير عمل داخلية — تعرضان النتائج مباشرة
- [x] إبقاء فقط: بيانات العينة، نتائج الاختبارات، الحكم النهائي Pass/Fail، التوقيعات

## إصلاح عنوان الطباعة في SampleDetail
- [ ] تغيير عنوان الوثيقة عند الطباعة حسب حالة العينة: received/distributed → وصل استلام عينة، tested/processed/reviewed → تقرير فحص مبدئي، qc_passed/issued → شهادة اعتماد

## إصلاح شامل لصفحات الطباعة
- [x] SampleDetail: تغيير docType ديناميكياً حسب حالة العينة (received/distributed → sample_receipt، tested/processed/reviewed/approved → test_report، qc_passed/clearance_issued → clearance)
- [x] SampleDetail: إضافة توقيعات (موظف الاستقبال / الفاحص / مدير المختبر) تظهر فقط عند الطباعة
- [x] SpecializedTestReport: إزالة DIST-XXXXXX واستبداله برقم العقد أو RPT-XXXXXX في رأس الوثيقة
- [x] SpecializedTestReport: إزالة "Internal System" من الـ footer
- [x] PrintReceipt: إزالة "النظام الداخلي" من الـ footer
- [x] PrintCertificate: إزالة "النظام الداخلي" من الـ footer
- [x] PrintCertificate: إزالة عمود "رقم التوزيع" الداخلي من جدول الاختبارات

## إعادة تصميم الرسومات البيانية
- [x] Analytics: إعادة تصميم Donut chart (بـ innerRadius) بتسميات واضحة وlegend منظم وtooltip مخصص
- [x] Analytics: إعادة تصميم Bar chart بتدرج لوني وCartesianGrid وtooltip مخصص وأعمدة مدورة الزوايا
- [x] SampleDetail: إعادة تصميم Trend Line بCartesianGrid وتسميات مرجعية ونقاط محسّنة
- [x] SampleDetail: إعادة تصميم Bar Chart بCartesianGrid وtooltip مخصص وخلفية رمادية متناسقة

## إصلاح تداخل الأرقام في الرسومات
- [ ] SampleDetail Trend Line: إزالة تسميات Min/Max/Avg من داخل الرسم ونقلها لـ legend منفصل تحت الرسم
- [ ] SampleDetail Bar Chart: تبسيط الرسم وإزالة التداخل
- [ ] تحسين الجاذبية العامة للرسومات

## إصلاح تداخل شريط التنقل والرسومات
- [x] إصلاح تداخل الأيقونات مع النصوص في TestTypesManagement (h-auto + flex-wrap + text-xs)
- [x] إصلاح تداخل تبويبات UserManagement Dialog (h-auto + shrink-0 + span)
- [x] إصلاح رسومات SampleDetail: إزالة تسميات ReferenceLine من داخل الرسم ونقلها لـ legend منفصل تحته

## مهام مستقبلية مؤجلة
- [ ] إضافة صفحة تسجيل دخول بيوزر وباسورد مستقلة عن Manus OAuth للمستخدمين الداخليين

## بوابة القطاعات المستقلة
- [x] إضافة جدول sector_accounts في قاعدة البيانات (username, passwordHash, sectorKey, nameAr, nameEn)
- [x] إضافة sector router في الباكيند (login, getSamples, getResults, getClearances, getUnreadCount, markClearanceRead)
- [x] صفحة تسجيل دخول مستقلة للقطاعات (/sector/login) بتصميم احترافي split-screen
- [x] SectorLayout: شريط تنقل علوي مع badges للتحديثات الجديدة
- [x] صفحة Dashboard للقطاع (/sector/dashboard)
- [x] صفحة العينات المستلمة (/sector/samples)
- [x] صفحة نتائج الاختبارات (/sector/results)
- [x] صفحة براءة الذمة (/sector/clearances)
- [x] SectorGuard في App.tsx لحماية مسارات القطاعات
- [x] إرسال sector_token في Authorization header تلقائياً
- [x] إصلاح تكرار nav links (nested anchor tags)
- [x] تحديث كلمات مرور حسابات القطاعات الخمسة

## تغيير Processed إلى Tested
- [ ] تغيير جميع نصوص "Processed" إلى "Tested" في الترجمات والـ UI
- [ ] تغيير "processed" إلى "tested" في حالات العينات المعروضة (status labels)

## تعديل أسماء القطاعات
- [x] تغيير أسماء القطاعات في DB من "القطاع الأول..." إلى "قطاع/1، قطاع/2..."
- [x] إضافة نص "قسم المختبر - قطاع/X" في صفحة الدخول بعد تسجيل الدخول
- [x] تحديث SectorDashboard لعرض "قسم المختبر - قطاع/X"

## إصلاح اللغة في بوابة القطاعات
- [x] حفظ اللغة في localStorage بدلاً من state محلي لكل صفحة
- [x] SectorLayout يقرأ/يكتب اللغة من localStorage
- [x] جميع صفحات القطاع تقرأ اللغة من SectorLayout مباشرة

## تغيير "شهادة التخليص" إلى "براءة الذمة"
- [x] تغيير في LanguageContext (nav.clearance، clearance.*)
- [x] تغيير في DashboardLayout Sidebar
- [x] تغيير في جميع الصفحات التي تستخدم النص

## تغيير براءة الذمة إلى شهادة براءة الذمة
- [ ] تغيير في LanguageContext (ar: شهادة براءة الذمة، en: Clearance Certificate)
- [ ] تغيير في جميع الصفحات والمكونات

## إصلاح خطأ رفض الفحص كمشرف
- [ ] تحديد سبب الخطأ في router المشرف عند رفض الفحص
- [ ] إصلاح الـ procedure المسؤولة عن الرفض

## تغيير براءة الذمة إلى شهادة براءة الذمة
- [ ] تغيير في LanguageContext (ar: شهادة براءة الذمة، en: Clearance Certificate)
- [ ] تغيير في جميع الصفحات والمكونات

## إصلاح الأرقام لتكون إنجليزية دائماً
- [ ] إضافة font-feature-settings أو unicode-bidi في CSS لمنع تحويل الأرقام
- [ ] تطبيق على الموقع الرئيسي وبوابة القطاعات

## بحث وفلترة في بوابة القطاعات
- [ ] إصلاح مشكلة اللغة باستخدام React Context مشترك
- [ ] إضافة بحث بـ رقم العينة، رقم العقد، التاريخ في صفحة العينات
- [ ] إضافة بحث بـ رقم العينة، رقم العقد، التاريخ في صفحة النتائج
- [ ] إضافة بحث بـ رقم العينة، رقم العقد، التاريخ في صفحة براءة الذمة

## تحسين الرسومات البيانية في لوحة التحكم
- [ ] تحسين ألوان وتسميات مخطط العينات حسب النوع (Bar Chart)
- [ ] تحسين مخطط العينات حسب الحالة (Donut Chart) - إضافة تسميات واضحة
- [ ] إضافة تدرج ألوان وتصميم احترافي للمخططين

## تغيير "مراجعة نتائج العينات" إلى "تأكيد نتائج العينات"
- [x] تغيير في LanguageContext (ar + en)
- [x] تغيير في QCReview.tsx
- [x] تغيير في DashboardLayout sidebar

## تغيير "مشرف" إلى "نتائج الاختبارات" في القائمة الجانبية
- [x] تغيير nav.manager في LanguageContext (ar: نتائج الاختبارات، en: Test Results)
- [x] تغيير عنوان الصفحة في ManagerReview.tsx (ar: مراجعة نتائج الاختبارات، en: Test Results Review)

## المقترحات الثلاثة
- [x] إصلاح مشكلة اللغة في بوابة القطاعات - React Context مشترك يغلف جميع routes القطاع
- [x] إصلاح خطأ رفض الفحص كمشرف في السيرفر
- [x] إضافة فلترة بالتاريخ والحالة في صفحات بوابة القطاعات (العينات، النتائج، براءة الذمة)

## المقترحات الثلاثة الجديدة
- [x] تغيير "براءة الذمة" إلى "شهادة براءة الذمة" في القائمة الجانبية والصفحات (ar + en)
- [x] إصلاح الأرقام لتظهر إنجليزية دائماً في وضع العربية (CSS font-variant-numeric)
- [x] إضافة تنبيه فوري للقطاع عند صدور نتيجة جديدة أو شهادة براءة ذمة

## تغيير "مراجعة الجودة" إلى "ضبط الجودة"
- [ ] تغيير في LanguageContext (ar: ضبط الجودة، en: Quality Control)
- [ ] تغيير في QCReview.tsx وDashboardLayout sidebar
- [ ] تغيير في جميع الصفحات التي تستخدم النص

## تغيير "مراجعة الجودة" إلى "ضبط الجودة" وزر "رئيسي" إلى "الرئيسية"
- [ ] تغيير في LanguageContext (ar: ضبط الجودة، en: Quality Control)
- [ ] تغيير في QCReview.tsx وDashboardLayout sidebar
- [ ] تغيير زر "رئيسي" إلى "الرئيسية" في SectorLayout وجميع الصفحات

## تغييرات المصطلحات (مارس 2026)
- [x] تغيير "مراجعة الجودة" إلى "ضبط الجودة" في LanguageContext.tsx
- [x] تغيير "مراجعة الجودة" إلى "ضبط الجودة" في QCReview.tsx
- [x] تغيير "مراجعة الجودة" إلى "ضبط الجودة" في UserManagement.tsx
- [x] تغيير "مراجعة الجودة" إلى "ضبط الجودة" في SectorSamples.tsx
- [x] تغيير "QC Review" إلى "Quality Control" في جميع الملفات الإنجليزية
- [x] تغيير "رئيسي" إلى "الرئيسية" في زر Home بـ DashboardLayout.tsx

## نظام التنبيهات الكامل (مارس 2026)
- [x] تحديث جدول notifications: إضافة targetUserId وsectorId وnotificationType
- [x] تنبيه موظف الاستلام عند إعادة العينة للتعديل
- [x] تنبيه المشرف عند وصول عينة جديدة للتوزيع
- [x] تنبيه الفني عند تعيين عينة له (موجود جزئياً)
- [x] تنبيه الفني عند طلب تعديل النتائج
- [x] تنبيه مراجع النتائج عند رفع الفني للنتائج
- [x] تنبيه ضبط الجودة عند موافقة مراجع النتائج (موجود جزئياً)
- [x] تنبيه المحاسب بعد تأكيد ضبط الجودة لجميع الاختبارات
- [x] تنبيه القطاع عند استلام عينته في المختبر
- [x] تنبيه القطاع عند صدور نتيجة اختبار
- [x] تنبيه القطاع عند بدء إجراءات براءة الذمة
- [x] تنبيه القطاع عند صدور براءة الذمة
- [x] صفحة تنبيهات مخصصة /notifications في المختبر
- [x] تصفية التنبيهات حسب الدور (targetUserId)

## التنبيهات الفورية وإصلاح أمر الدفع (مارس 2026)
- [ ] إضافة SSE endpoint في السيرفر للتنبيهات الفورية
- [ ] إنشاء useSSENotifications hook في الواجهة
- [ ] استبدال polling بـ SSE في DashboardLayout وSectorLayout
- [ ] إصلاح بطء إصدار أمر الدفع (loading state + تحسين الأداء)

## نظام التنبيهات الفوري مع الألوان (مارس 2026)
- [x] إصلاح بطء إصدار أمر الدفع (إزالة dynamic imports)
- [x] SSE endpoint في السيرفر /api/notifications/stream
- [x] broadcast عند إنشاء أي تنبيه جديد
- [x] أيقونة الجرس في DashboardLayout header مع badge عدد التنبيهات غير المقروءة
- [x] dropdown تنبيهات من الجرس يعرض آخر 5 تنبيهات
- [x] نظام ألوان ثلاثي: أزرق=جديد لم يُفتح، برتقالي=مفتوح ولم يُتخذ إجراء، رمادي=منجز
- [x] مفتاح توضيح الألوان (legend) في صفحة التنبيهات
- [x] نفس نظام الجرس والألوان في SectorLayout لبوابة القطاعات
- [x] عند فتح التنبيه يتحول من أزرق لبرتقالي (isRead=true لكن لم يُتخذ إجراء)
- [x] عند اتخاذ الإجراء (مثلاً فتح العينة) يتحول لرمادي

## نظام Dropdown للاختبارات المتعددة الأنواع (مارس 2026)
- [ ] إضافة حقل subType لجدول tests في قاعدة البيانات
- [ ] تحديث السيرفر لدعم subType في الاختبارات الأربعة
- [ ] Dropdown في تسجيل العينة: مكعبات الخرسانة (7/14/28 يوم)
- [ ] Dropdown في تسجيل العينة: الكمرة (10×10×50 / 15×15×75)
- [ ] Dropdown في تسجيل العينة: تحليل منخل الركام (خشن / ناعم)
- [ ] Dropdown في تسجيل العينة: الكثافة النوعية والامتصاص (خشن / ناعم)
- [ ] نموذج إدخال النتائج يتغير حسب subType عند الفني
- [ ] اختبارات vitest للـ subType

## تطبيق تعديلات commentonlabtests.pdf (مارس 2026)

### إصلاحات حرجة في النماذج الموجودة
- [x] SteelRebar.tsx: تغيير طول القياس الافتراضي إلى 100مم لجميع الأقطار
- [x] SteelRebar.tsx: تغيير حد الاستطالة إلى ≥5% (CMW practice) بدلاً من 14%
- [x] SteelRebar.tsx: إضافة حساب المساحة من الكتلة (mass per meter) بدلاً من المساحة الاسمية فقط
- [x] SteelRebar.tsx: إضافة اختبار الانحناء (Bend) والانحناء العكسي (Rebend) كنماذج منفصلة
- [ ] SoilProctor.tsx: إصلاح حساب الكثافة الكلية (Bulk Density = Wet soil mass ÷ Mould volume)
- [ ] SoilProctor.tsx: إضافة حقول الكتلة الرطبة والجافة لحساب نسبة الرطوبة تلقائياً
- [x] ConcreteCore.tsx: تحديث المعيار إلى BS EN 12504-1 (من BS 1881 Part 120)
- [x] ConcreteCore.tsx: إضافة ملاحظة L/D=1.0 بدون معامل تصحيح
- [x] AsphaltCore.tsx: تغيير مرجع الكثافة من Gmm إلى كثافة مارشال
- [x] AsphaltCore.tsx: تحديث معادلة الدمك = (Core Bulk Density ÷ Marshall Density) × 100
- [ ] SieveAnalysis.tsx: التحقق من وجود منخل 6.3مم للركام الخشن و5.0مم للناعم
- [ ] ConcreteBlocks.tsx: التحقق من استخدام المساحة الإجمالية (Gross Area) وليس الصافية

### نماذج جديدة مطلوبة
- [ ] نموذج فحص الكمرات الخرسانية 10×10×50سم (CONC_BEAM_SMALL) - ASTM C78، بحر=300مم
- [ ] نموذج فحص الكمرات الخرسانية 15×15×75سم (CONC_BEAM_LARGE) - ASTM C78، بحر=450مم
- [ ] نموذج فحص الخرسانة الرغوية (CONC_FOAM_CUBE) - BS 1881
- [ ] نموذج كثافة الخرسانة الرغوية بعد التجفيف (CONC_FOAM_DENSITY)
- [x] نموذج CBR (SOIL_CBR) - قراءات اختراق متعددة، قبول ≥15% للطبقة التحتية
- [x] نموذج اختبار الانحناء (STEEL_BEND) - نتيجة بصرية فقط
- [x] نموذج اختبار الانحناء العكسي (STEEL_REBEND) - نتيجة بصرية فقط
- [x] نموذج استخلاص البيتومين (ASPH_BITUMEN_EXTRACT) - مع CF وTF
- [ ] نموذج تدرج الركام المستخلص (ASPH_EXTRACTED_SIEVE)
- [ ] نموذج تدرج خلطة الأسفلت - Hot Bin (ASPH_HOTBIN)
- [x] نموذج قيمة سحق الركام ACV (AGG_CRUSHING)
- [x] نموذج قيمة صدم الركام AIV (AGG_IMPACT)
- [x] نموذج تآكل لوس أنجلوس (AGG_LA_ABRASION)
- [x] تحديث TestRouter.tsx لإضافة جميع النماذج الجديدة

## النماذج المتبقية من تعديلات commentonlabtests.pdf (مارس 2026 - الجولة 2)
- [x] نموذج كمرات الخرسانة الصغيرة CONC_BEAM_SMALL (10×10×50سم، بحر=300مم) - ASTM C78
- [x] نموذج كمرات الخرسانة الكبيرة CONC_BEAM_LARGE (15×15×75سم، بحر=450مم) - ASTM C78
- [x] نموذج تدرج Hot Bin للأسفلت ASPH_HOTBIN + رسم بياني مقارنة بالحدود المع- [x] التحقق وإصلاح مناخل 6.3مم للركام الخشن ومنخل 5.0مم للركام الناعم في SieveAnalysis.tsx- [x] إضافة أنواع الاختبارات الجديدة في قاعدة البيانات
- [x] تحديث TestRouter.tsx للنماذج الجديدة
- [x] تحديث specialized-tests.test.ts بحسابات الكمرات وHot Bin

## النماذج المتبقية - الجولة الثالثة (مارس 2026)
- [x] نموذج الخرسانة الرغوية ConcreteFoam.tsx (CONC_FOAM_CUBE + CONC_FOAM_DENSITY) - BS EN 12390-3
- [x] نموذج تدرج ركام الخلطة الخرسانية ConcreteMixGrad.tsx (CONC_MIX_GRAD) - ASTM C33
- [x] نموذج الصلب الإنشائي SteelStructural.tsx (STEEL_STRUCTURAL) - BS EN 10025 / ASTM A36
- [x] نموذج أنكر بولت SteelAnchorBolt.tsx (STEEL_ANCHOR_M12/16/20/24/30) - ASTM E488 / BS 8539
- [x] نموذج تحليل منخل الركام المستخلص AsphaltExtractedSieve.tsx (ASPH_EXTRACTED_SIEVE_*) - BS EN 12697-2
- [x] نموذج معدل رش الأسفلت AsphaltSprayRate.tsx (ASPH_SPRAY_SS1/SS1H/CRS1/MC30/MC70/MC250) - JKR Spec
- [x] إصلاح ConcreteBlocks.tsx - اكتشاف نوع البلوك تلقائياً بـ useEffect
- [x] تحديث TestTypesManagement.tsx بجميع القوالب الجديدة (concrete_beam, concrete_foam, concrete_mix_grad, steel_anchor_bolt, asphalt_hotbin, asphalt_extracted_sieve, asphalt_spray_rate)
- [x] إضافة 18 نوع اختبار جديد إلى قاعدة البيانات
- [x] تحديث TestRouter.tsx لجميع النماذج الجديدة
- [x] إضافة 36 اختبار Vitest جديد (145 إجمالاً ناجحة)

## الجولة الرابعة: إصلاح SoilProctor + Dropdown + ترجمة شاملة (مارس 2026)

### إصلاح SoilProctor
- [ ] إضافة حقلَي الكتلة الرطبة والجافة لحساب نسبة الرطوبة تلقائياً
- [ ] ترجمة جميع حقول SoilProctor.tsx باللغتين

### نظام Dropdown للاختبارات المتعددة
- [ ] إضافة Dropdown في نموذج تسجيل العينة لاختيار النوع الفرعي (كمرة صغيرة/كبيرة، ركام خشن/ناعم، إلخ)
- [ ] ترجمة قائمة Dropdown باللغتين

### الترجمة الشاملة لجميع الصفحات
- [ ] توسيع LanguageContext بجميع النصوص المطلوبة (Reception, Distribution, Technician, Supervisor, QC, Clearance, SampleDetail, UserManagement, TestTypesManagement)
- [ ] ترجمة صفحة Reception.tsx كاملة
- [ ] ترجمة صفحة Distribution.tsx كاملة
- [ ] ترجمة صفحة Technician.tsx كاملة
- [ ] ترجمة صفحة Supervisor Review كاملة
- [ ] ترجمة صفحة QC Review كاملة
- [ ] ترجمة صفحة Clearance كاملة
- [ ] ترجمة صفحة SampleDetail.tsx كاملة
- [ ] ترجمة صفحة UserManagement.tsx كاملة
- [ ] ترجمة صفحة TestTypesManagement.tsx كاملة
- [ ] ترجمة نماذج الاختبارات المتخصصة (عناوين الحقول والأزرار والرسائل)

## الجولة الخامسة: إصلاح اللغة وصفحة مراجعة النتائج (مارس 2026)

- [ ] إصلاح أسماء الاختبارات في صفحة الفني لتتغير حسب اللغة (testName يُخزّن بالعربية/الإنجليزية)
- [ ] إصلاح أسماء الاختبارات في صفحة مراجعة المشرف لتتغير حسب اللغة
- [ ] بناء صفحة عرض نتائج الاختبار كـ PDF مع زر طباعة وأزرار الإجراءات (تأكيد/مراجعة/رفض)
- [ ] إصلاح خطأ TypeScript في Clearance.tsx
- [ ] تشغيل Vitest وحفظ نقطة تفتيش

## الجولة السادسة: رقم الطلب في التقرير + نظام الإشعارات

- [x] إضافة رقم العينة ورقم التوزيع والمقاول والقطاع في رأس التقرير المطبوع
- [x] إضافة تاريخ الاستلام وتاريخ الاختبار في التقرير
- [x] إشعار تلقائي للفني عند تعيين عينة جديدة له (Distribution)
- [x] إشعار تلقائي للمشرف عند رفع الفني للنتائج (Test Results submitted)
- [x] إشعار للقطاع عند إصدار نتائج الاختبار (QC Approved)
- [x] إشعار للقطاع عند إصدار شهادة براءة الذمة (Clearance Certificate)
- [x] تشغيل Vitest والتحقق من سلامة الاختبارات
- [x] حفظ نقطة تفتيش نهائية

## إعادة هيكلة أنواع الاختبارات (مطابقة القائمة المعتمدة - 32 اختبار فقط)
- [ ] حذف الاختبارات الزائدة من قاعدة البيانات (أنواع فرعية مكررة للحديد والأنكر والخرسانة والأسفلت)
- [ ] دمج اختبارات البلوك في اختبار واحد (CONC_BLOCK) مع حقل نوع فرعي عند التسجيل
- [ ] دمج اختبارات الإنترلوكينج في اختبار واحد (CONC_INTERLOCK) مع حقل سُمك عند التسجيل
- [ ] دمج اختبارات الحديد الإنشائي في اختبار واحد (STEEL_STRUCTURAL) مع حقل المعيار عند التسجيل
- [ ] دمج اختبارات الأنكر بولت في اختبار واحد (STEEL_ANCHOR) مع حقل القطر عند التسجيل
- [ ] دمج اختبارات الانحناء (Bend/Rebend) في اختبار واحد مع حقل المعيار
- [ ] تصحيح أسعار جميع الاختبارات لتطابق القائمة المعتمدة
- [ ] تحديث نماذج الاختبارات لعرض dropdown الأنواع الفرعية عند التسجيل
- [ ] تحديث TestTypesManagement وTestRouter ليعكسا الهيكل الجديد

## حقل الكمية في التوزيع

- [x] إضافة عمود `quantity` (INT DEFAULT 1) في جدول distributions
- [x] إضافة عمود `unitPrice` و`totalCost` (DECIMAL) في جدول distributions
- [x] تحديث schema.ts وتوليد migration وتطبيقه
- [x] تحديث routers.ts: قبول quantity وunitPrice وحساب totalCost = quantity × unitPrice
- [x] تحديث شاشة Distribution: إضافة حقل الكمية وعرض التكلفة الإجمالية مع المعادلة
- [x] تحديث SampleDetail لعرض عدد العينات وسعر الوحدة والتكلفة الإجمالية
- [x] تحديث db.ts: إضافة quantity/unitPrice/totalCost في getDistributionsBySample وgetDistributionById

## إصلاحات سريعة (مارس 2026)

- [x] إصلاح التنبيهات: منع تراكمها وتغطيتها على الأزرار (z-index + max notifications)
- [x] تغيير نص زر "Create Distribution Order" إلى "Send Order" في صفحة التوزيع
- [x] وصل استلام العينة: إضافة زر طباعة Portrait في صفحة تفاصيل العينة
- [x] ربط عدد العينات: عند التوزيع يُعبأ تلقائياً من عدد العينات المسجّل في الاستقبال
- [x] تمييز الاختبارات المعدّلة: إذا غيّر موظف التوزيع نوع الاختبار يتلوّن الطلب ويُلزم بكتابة ملاحظة

## دور المحاسب

- [x] إضافة دور `accountant` في enum الأدوار في schema.ts
- [x] إضافة صفحة لوحة المحاسب مع قائمة طلبات براءة الذمة (ClearancePage)
- [x] المحاسب يرى فقط صفحات براءة الذمة وأوامر الدفع (ROLE_DEFAULT_PERMS)

## سير عمل براءة الذمة الكامل

- [ ] جدول `clearance_requests` في قاعدة البيانات (الحالات: pending_qc → qc_approved → pending_payment → paid → issued)
- [ ] جدول `clearance_attachments` لأرشفة المرفقات مع التواقيع والتواريخ
- [ ] الحالة 1: القطاع يفتح طلب براءة ذمة → تنبيه للمحاسب + جرد الاختبارات يوصل للـ QC
- [ ] الحالة 2: QC يعتمد الاختبارات → توقيع تلقائي باسمه + تنبيه للمحاسب لإصدار أمر الدفع
- [ ] الحالة 3: المحاسب يصدر أمر الدفع → توقيع باسم المحاسب + انتظار رفع الوصل
- [ ] الحالة 4: المحاسب يرفع وصل الدفع → إصدار براءة الذمة PDF + تنبيه للقطاع
- [ ] أرشفة جميع المرفقات والتواقيع والتواريخ في الطلب
- [ ] صفحة القطاع لعرض طلبات براءة الذمة وحالتها
- [ ] صفحة المحاسب لإدارة أوامر الدفع والوصولات
- [ ] صفحة QC لاعتماد جرد الاختبارات
- [ ] PDF براءة الذمة الكامل مع المرفقات

## المقترحات الثلاثة (مارس 2026)

- [ ] إضافة زر "طلب براءة ذمة" في بوابة القطاع الخارجية (SectorPortal) مباشرة
- [ ] بناء صفحة التقرير المالي الإجمالي للمحاسب: مجموع تكاليف الاختبارات لكل عقد مع فلتر التاريخ
- [ ] إضافة حقل رقم الوصل الرسمي في خطوة رفع إيصال الدفع في براءة الذمة

## إعادة الهيكلة الكاملة — مارس 2026

### قاعدة البيانات
- [ ] إضافة حقل `taskReadAt` في جدول distributions (وقت فتح المهمة)
- [ ] إضافة حقل `receiptSignedBy` في جدول samples (اسم المستلم للوصل)
- [ ] إضافة حقل `receiptNumber` في جدول clearance_requests (رقم الوصل الرسمي)
- [ ] إضافة حقل `contractorLetterUrl` عند إنشاء طلب براءة الذمة من القطاع

### نظام قائمة المهام (TaskQueue)
- [ ] بناء مكوّن TaskQueue المشترك بثلاث حالات: جديدة / غير مكتملة / مُنجزة
- [ ] تطبيق TaskQueue في صفحة الفني
- [ ] تطبيق TaskQueue في صفحة المشرف
- [ ] تطبيق TaskQueue في صفحة QC
- [ ] تطبيق TaskQueue في صفحة المحاسب (براءة الذمة)

### صفحة الاستقبال
- [ ] وصل الاستلام موقع باسم المستلم (موظف الاستقبال) تلقائياً
- [ ] تنبيه تلقائي لموظف التوزيع عند تسجيل عينة جديدة

### صفحة التوزيع
- [ ] نوع الاختبار يأتي تلقائياً من الاستقبال (قابل للتعديل مع ملاحظة إلزامية)
- [ ] عند الضغط على Send Order يفتح نموذج الفحص مباشرة للفني

### صفحة الفني
- [ ] نموذج الفحص يفتح مباشرة بدون اختيار نوع الاختبار
- [ ] التقرير يُولَّد عند المشرف موقعاً باسم الفني تلقائياً

### صفحة المشرف وQC
- [ ] حقل الملاحظات إلزامي عند الرفض أو طلب المراجعة
- [ ] التوقيع تلقائي باسم المشرف/QC عند الاعتماد
- [ ] تنبيه للقطاع عند اعتماد QC مع رابط التقرير

### بوابة القطاع
- [ ] إضافة زر "طلب براءة ذمة" في صفحة SectorClearances
- [ ] Dropdown يعرض عقود القطاع فقط
- [ ] رفع كتاب المقاول إلزامي عند إنشاء الطلب
- [ ] تنبيه تلقائي للمحاسب وQC عند إنشاء الطلب

### صفحة براءة الذمة
- [ ] إضافة حقل رقم الوصل الرسمي في خطوة رفع الإيصال
- [ ] بناء صفحة التقرير المالي الإجمالي للمحاسب

### قاعدة ثنائية اللغة
- [ ] مراجعة جميع الصفحات الجديدة والمعدّلة للتأكد من وجود كائن T بالعربي والإنجليزي

## نظام المهام الثلاثي + أزرار الفلترة (مارس 2026)

- [x] تطبيق TaskQueue (جديدة/غير مكتملة/مُنجزة) على ManagerReview
- [x] تطبيق TaskQueue على QCReview
- [x] تطبيق TaskQueue على ClearancePage (المحاسب)
- [x] تحويل محدد القطاع في Reception إلى أزرار مع عدادات
- [x] تحويل بطاقات الحالة في Reception إلى أزرار فلترة
- [x] تحويل محددات الفلترة في Distribution إلى أزرار مع عدادات
- [x] تحويل محددات الفلترة في TestResults/ManagerReview/QCReview إلى أزرار
- [x] تحويل محددات الفلترة في بوابة القطاع (SectorSamples, SectorResults, SectorClearances) إلى أزرار مع عدادات

## الاقتراحات الثلاثة - مارس 2026

- [ ] إضافة حقول التوقيع في schema: supervisorSignedBy, supervisorSignedAt, qcSignedBy, qcSignedAt في جدول samples
- [ ] إضافة حقول التوقيع في schema: qcSignedBy, qcSignedAt في جدول clearance_requests
- [ ] تحديث procedures المشرف: اشتراط ملاحظة عند الرفض/طلب المراجعة + حفظ التوقيع التلقائي
- [ ] تحديث procedures QC: اشتراط ملاحظة عند الرفض + حفظ التوقيع التلقائي + إشعار القطاع
- [ ] تحديث واجهة ManagerReview: رسالة خطأ عند محاولة الرفض بدون ملاحظة + عرض التوقيع
- [ ] تحديث واجهة QCReview: رسالة خطأ عند محاولة الرفض بدون ملاحظة + عرض التوقيع + إشعار القطاع

## أزرار الفلترة الثلاثية على جميع الصفحات (مارس 2026)

- [x] تطبيق أزرار الكل/جديدة/غير مكتملة/مُنجزة على Reception
- [x] تطبيق أزرار الكل/جديدة/غير مكتملة/مُنجزة على Distribution
- [x] تطبيق أزرار الكل/جديدة/غير مكتملة/مُنجزة على TechnicianTasks (مهام الفني - يستخدم TaskQueue بالفعل)
- [x] تطبيق أزرار الكل/جديدة/مُنجزة على Clearance (شهادة براءة الذمة)

## الاقتراحات الثلاثة - مارس 2026

- [x] حقل الملاحظات الإلزامي عند رفض العينة في ManagerReview
- [x] حقل الملاحظات الإلزامي عند رفض العينة في QCReview
- [x] إضافة حقول التوقيع (managerReviewedByName, managerReviewedAt, qcReviewedByName, qcReviewedAt) في جدول test_results
- [x] تسجيل التوقيع التلقائي عند اعتماد المشرف (ManagerReview)
- [x] تسجيل التوقيع التلقائي عند اعتماد QC (QCReview)
- [x] عرض التوقيع (الاسم + التاريخ) في خانات تقرير الفحص المطبوع
- [x] إشعار القطاع تلقائياً عند اعتماد QC مع رابط التقرير

## إعادة بناء بوابة القطاع (مارس 2026)

- [x] تحديث Backend: procedure صندوق الوارد (inbox) للقطاع
- [x] تحديث Backend: procedure إنشاء طلب براءة ذمة من القطاع (SectorClearances موجودة بالفعل)
- [x] بناء SectorInbox.tsx - صندوق الوارد (الصفحة الرئيسية للقطاع)
- [x] تحديث SectorSamples.tsx - تغيير المسمى إلى "طلبات الفحص"
- [x] تحديث SectorResults.tsx - تغيير المسمى إلى "نتائج الاختبارات"
- [x] صفحة طلبات براءة الذمة (SectorClearances) موجودة بالفعل بكل الوظائف
- [x] تحديث SectorLayout.tsx - القائمة الجانبية بالمسميات الجديدة + صندوق الوارد كصفحة رئيسية
- [x] تسجيل المسارات الجديدة في App.tsx

## تطوير صندوق الوارد (مارس 2026)

- [x] إضافة procedure getInboxItemDetail في Backend لجلب تفاصيل الرسالة كاملة
- [x] نافذة تفاصيل عند النقر على أي رسالة في صندوق الوارد
- [x] عرض تفاصيل التقرير كاملاً في النافذة (نتائج الفحص / بيانات براءة الذمة / إشعارات)
- [x] زر طباعة مع اختيار اللغة (عربي/إنجليزي)
- [x] زر تحميل مباشر من النافذة

## تقرير PDF حقيقي من الخادم (مارس 2026)

- [x] تثبيت puppeteer في الخادم لتوليد PDF
- [x] إضافة مسار /api/pdf/generate يقبل HTML ويُعيد PDF حقيقي
- [x] تحديث صندوق الوارد: زر الطباعة والتحميل يستخدم PDF حقيقي مع مؤشر تحميل واحتياطي HTML عند الفشل

## PDF حقيقي على جميع التقارير (مارس 2026)

- [ ] دالة مشتركة generatePdf في client/src/lib/pdf.ts
- [ ] تقرير الخرسانة (ConcreteReport) - PDF حقيقي
- [ ] تقرير الفحوصات المتخصصة (SpecializedTestReport) - PDF حقيقي
- [ ] شهادة براءة الذمة (PrintCertificate) - PDF حقيقي
- [ ] نافذة مراجعة المشرف (ManagerReview) - زر PDF حقيقي
- [ ] نافذة مراجعة QC (QCReview) - زر PDF حقيقي

## تطبيق PDF الحقيقي على جميع التقارير (مارس 2026)
- [x] تطبيق PDF الحقيقي على تقرير الخرسانة (ConcreteReport) - زر تحميل PDF باستخدام jsPDF + html2canvas
- [x] تطبيق PDF الحقيقي على تقرير الفحوصات المتخصصة (SpecializedTestReport) - زر تحميل PDF
- [x] تطبيق PDF الحقيقي على شهادة براءة الذمة (PrintCertificate) - زر تحميل PDF
- [x] إضافة زر "عرض التقرير الكامل" في صفحة مراجعة المشرف (ManagerReview) - يفتح التقرير في نافذة جديدة
- [x] إضافة زر "فتح PDF" في صفحة مراجعة المشرف (ManagerReview)
- [x] إضافة زر "عرض التقرير الكامل" في صفحة ضبط الجودة (QCReview) - يفتح التقرير في نافذة جديدة

## لوحة تحكم المشرف (Manager Dashboard)
- [x] بناء صفحة ManagerDashboard.tsx مع KPIs متخصصة للمشرف
- [x] إضافة تنبيهات فورية للمهام المعلقة (نتائج بانتظار المراجعة، عينات بانتظار QC)
- [x] إضافة رسوم بيانية: توزيع الاختبارات حسب الفئة، الاتجاه الشهري، قرارات المشرف
- [x] إضافة جدول أكثر الاختبارات تكراراً مع نسبة النجاح
- [x] إضافة أزرار إجراءات سريعة (مراجعة النتائج، ضبط الجودة، الإحصائيات، الشهادات)
- [x] إضافة route /manager-dashboard في App.tsx
- [x] إضافة "لوحة تحكم المشرف" في قائمة التنقل الجانبية (للمشرف وAdmin)

## دمج لوحتي التحكم وصلاحية manager_dashboard
- [x] إضافة صلاحية manager_dashboard مستقلة في نظام الصلاحيات (لا ترتبط بأي دور تلقائياً)
- [x] دمج لوحة التحكم القديمة (Home.tsx) مع الجديدة (ManagerDashboard.tsx) في صفحة واحدة
- [x] إزالة لوحة التحكم القديمة من القائمة وتسمية الجديدة "لوحة التحكم" / "Dashboard"
- [x] تحديث DashboardLayout: ربط لوحة التحكم بصلاحية manager_dashboard
- [x] تحديث UserManagement: إضافة صلاحية manager_dashboard في لوحة إدارة الصلاحيات
- [x] تغيير اسم nav.managerDashboard إلى "Dashboard" / "لوحة التحكم"
- [x] تحديث ROLE_HOME في Login.tsx وApp.tsx وDashboardLayout لتوجيه admin/user إلى /manager-dashboard
- [x] زر الرئيسية يوجه إلى /manager-dashboard

## إصلاح مشكلة توجيه القطاع
- [x] إصلاح مشكلة ظهور صفحة "بوابة القطاعات" عند دخول مستخدم القطاع بدل توجيهه لصفحته الصحيحة في النظام الداخلي
- [x] إصلاح main.tsx: إرسال sector_token فقط عند وجود /sector في المسار (منع تسرّب التوثيق)

## إصلاح مشكلة "no admin account found"
- [x] تشخيص المشكلة: حساب الأدمن (id=1) كان بدون username وpasswordHash (أُنشئ عبر Manus OAuth)
- [x] إضافة username="admin" وpassword="123123" لحساب الأدمن الحالي مباشرة في قاعدة البيانات
- [x] التحقق من نجاح تسجيل الدخول عبر /api/auth/local/login

## لوحتا التحكم الجديدتان (Admin + Supervisor)
- [ ] إضافة backend procedures: dashboard.getKPIs, dashboard.getAlerts, dashboard.getTeamPerformance, dashboard.getRecentActivity, dashboard.getSectorWorkload
- [ ] بناء AdminDashboard.tsx: KPIs (6 cards) + Line/Donut charts + Sector bar + Alerts panel + Team table + Activity feed + Quick actions + Filters
- [ ] بناء SupervisorDashboard.tsx: نسخة مبسطة (KPIs أساسية + تنبيهات + نشاط حديث)
- [ ] إضافة صلاحية supervisor_dashboard مستقلة في UserManagement
- [ ] تحديث DashboardLayout وApp.tsx للـ routes الجديدة
- [ ] الأدمن يرى AdminDashboard تلقائياً، من يملك supervisor_dashboard يرى SupervisorDashboard

## لوحتا التحكم الجديدتان (Admin Dashboard + Supervisor Dashboard)
- [x] إضافة backend procedures للـ KPIs والإحصائيات (server/routers/dashboard.ts)
- [x] بناء Admin Dashboard الكاملة (6 KPIs + Charts + Alerts + Team Performance + Activity Feed + Quick Actions)
- [x] بناء Supervisor Dashboard المبسطة (KPIs أساسية + تنبيهات + نشاط حديث)
- [x] إضافة صلاحية admin_dashboard مستقلة (للأدمن فقط افتراضياً)
- [x] إضافة صلاحية supervisor_dashboard مستقلة (يمنحها الأدمن لأي شخص)
- [x] تحديث DashboardLayout بالـ nav items الجديدة والصلاحيات
- [x] تحديث App.tsx بالـ routes الجديدة (/admin-dashboard, /supervisor-dashboard)
- [x] تحديث UserManagement لإظهار الصلاحيات الجديدة
- [x] تحديث LanguageContext بالترجمات الجديدة
- [x] توجيه admin تلقائياً إلى /admin-dashboard بعد تسجيل الدخول

## إصلاح AdminDashboard وSupervisorDashboard
- [x] إضافة DashboardLayout (sidebar + ثنائي اللغة) لـ AdminDashboard وSupervisorDashboard
- [x] حذف ManagerDashboard القديمة من القائمة والـ routes
- [x] إضافة backend procedures: passRateByContractor وpassRateByContract
- [x] إضافة قسم نسبة النجاح حسب المقاول في AdminDashboard (مع فلتر الفترة الزمنية)
- [x] إضافة قسم نسبة النجاح حسب رقم العقد في AdminDashboard (مع فلتر الفترة الزمنية)
- [x] تحديث ROLE_HOME ليوجه admin وuser إلى /admin-dashboard

## تعديل Quick Actions في Admin Dashboard
- [x] نقل Quick Actions إلى أعلى الصفحة (تحت العنوان مباشرة) كشريط أفقي compact
- [x] تصغير حجم الأزرار لتكون compact (text-xs, py-1.5)
- [x] توجيه كل زر للصفحة الصحيحة مباشرة (6 أزرار: تسجيل عينة، توزيع، مراجعة المشرف، QC، براءة الذمة، المستخدمين)
- [x] حذف Quick Actions القديمة من أسفل الصفحة

## إصلاح توجيه مستخدم القطاع بعد تسجيل الدخول
- [ ] فحص سبب ظهور صفحة /sector/dashboard بعد تسجيل الدخول
- [ ] إصلاح التوجيه ليذهب مستخدم القطاع للصفحة الصحيحة

## إصلاح توجيه مستخدم القطاع بعد تسجيل الدخول
- [x] تعديل SectorLogin: توجيه مستخدم القطاع مباشرة لصندوق الوارد (/sector/inbox) بدل Dashboard الفارغة

## تعديل فلاتر صفحة براءة الذمة في بوابة القطاعات
- [ ] تغيير الفلاتر إلى: جميع الطلبات / جديدة / قيد الإجراء / مكتملة

## توجيه ذكي عند الدخول حسب دور المستخدم
- [ ] تعديل فلاتر SectorClearances- [x] تغيير فلاتر SectorClearances إلى: جميع الطلبات / جديدة / قيد الإجراء / مكتملة
- [x] بناء resolveHomePage() في App.tsx: توجيه ذكي لكل مستخدم حسب دوره وصلاحياته المخصصة عند الدخول لـ /
## صفحة تغيير كلمة المرور
- [ ] إضافة backend procedure لتغيير كلمة المرور (مع التحقق من الكلمة الحالية)
- [ ] بناء صفحة ChangePassword.tsx بدعم ثنائي اللغة (عربي/إنجليزي)
- [ ] إضافة الصفحة للـ sidebar وRoutes

## تغيير كلمة المرور
- [x] إضافة changePassword procedure في backend (server/routers.ts) - كانت موجودة مسبقاً
- [x] بناء صفحة ChangePassword.tsx بدعم ثنائي اللغة مع مؤشر قوة كلمة المرور
- [x] إضافة route /change-password في App.tsx
- [x] إضافة عنصر "تغيير كلمة المرور" في قائمة المستخدم (Dropdown) في DashboardLayout
- [x] إضافة ترجمة nav.changePassword في LanguageContext

## دور المحاسب وبراءة الذمة (مارس 2026)
- [x] إصلاح ROUTE_ROLES: إضافة accountant لقائمة الأدوار المسموحة في /clearance
- [x] إنشاء حساب محاسب تجريبي (accountant1 / accountant123) في قاعدة البيانات
- [x] التحقق من تسجيل دخول المحاسب وتوجيهه لصفحة براءة الذمة مباشرة
- [x] التأكد من أن DashboardLayout يعرض فقط "براءة الذمة" في القائمة الجانبية للمحاسب

## المقترحات الثلاثة (مارس 2026)

### 1. إشعار المحاسب عند موافقة QC
- [ ] إضافة إشعار للمحاسب في clearance.qcReview عند الموافقة (backend)
- [ ] إشعار يحتوي على: رقم الطلب، اسم المقاول، رقم العقد، المبلغ الإجمالي

### 2. ربط طلب براءة الذمة بالقطاع
- [ ] تمرير sectorId عند إنشاء طلب براءة الذمة من النظام الداخلي (إضافة حقل اختيار القطاع)
- [ ] إشعار القطاع تلقائياً عند إصدار شهادة براءة الذمة (clearance.issueCertificate)
- [ ] إشعار القطاع يحتوي على: رقم الشهادة، اسم المقاول، رقم العقد، رابط الطباعة

### 3. صفحة أرشيف براءة الذمة
- [ ] إضافة procedure clearance.getArchive في backend (طلبات مكتملة مع بحث وفلاتر)
- [ ] بناء صفحة ClearanceArchive.tsx مع بحث بالمقاول/العقد وفلتر الفترة الزمنية
- [ ] إضافة route /clearance-archive في App.tsx
- [ ] إضافة عنصر "الأرشيف" في القائمة الجانبية للمحاسب والأدمن

## المقترحات الثلاثة - مكتملة (مارس 2026)
- [x] المقترح 1: إشعار المحاسب عند موافقة QC — كان موجوداً بالفعل في الكود
- [x] المقترح 2: ربط طلب براءة الذمة بالقطاع — إضافة حقل sectorId في نموذج الإنشاء + تحسين إشعار القطاع عند الإصدار
- [x] المقترح 3: صفحة أرشيف براءة الذمة (/clearance-archive) مع بحث وفلاتر (قطاع، تاريخ من/إلى، نص)
- [x] إضافة clearance.listSectors procedure في backend
- [x] إضافة clearance.getArchive procedure في backend
- [x] إضافة عنصر "أرشيف براءة الذمة" في sidebar للمحاسب والأدمن
- [x] إضافة ترجمة nav.clearanceArchive
- [x] كتابة اختبارات vitest لـ getArchive وlistSectors (8 ملفات، 153 اختبار — كلها ناجحة)

## ربط بوابة القطاع بطلب براءة الذمة + تغيير اسم لوحة التحكم
- [x] إضافة sector.requestClearance procedure في backend (يُنشئ طلب براءة ذمة من القطاع) - كان موجوداً بالفعل
- [x] تفعيل زر "طلب براءة ذمة" في SectorClearances.tsx وربطه بالـ procedure - كان موجوداً بالفعل
- [x] إشعار المحاسب تلقائياً عند إنشاء الطلب من القطاع - كان موجوداً بالفعل
- [x] تغيير "لوحة تحكم الأدمن" / "Admin Dashboard" إلى "لوحة التحكم الرئيسية" / "Main Dashboard" في LanguageContext وAdminDashboard وUserManagement

## دمج صلاحية التوزيع مع المشرف
- [x] إضافة صلاحية مراجعة المشرف (supervisor) لدور lab_manager في ROLE_DEFAULT_PERMS
- [x] صلاحية /distribution كانت موجودة بالفعل لـ lab_manager في App.tsx
- [x] حذف حساب distribution من قاعدة البيانات
- [x] تحديث ملف PDF بحذف دور التوزيع ودمجه مع المشرف

## مراجعة وإصلاح نظام الصلاحيات
- [ ] مراجعة صفحة إدارة المستخدمين - تحديد سبب عدم القدرة على إضافة صلاحية
- [ ] تصنيف الصلاحيات إلى (عرض فقط) و(عرض+تعديل)
- [ ] إصلاح أي مشكلة في حفظ الصلاحيات

## إصلاح نظام الصلاحيات في إدارة المستخدمين
- [x] تحديد سبب المشكلة: cert_archive كان مفقوداً وmanager_dashboard كان زائداً في PERMISSION_GROUPS
- [x] مزامنة مفاتيح PERMISSION_GROUPS مع permKeys الفعلية في DashboardLayout (12 مفتاح صحيح)
- [x] إضافة cert_archive لقائمة الصلاحيات مع تصنيف viewOnly: true
- [x] تصنيف الصلاحيات: (عرض فقط) للوحات والتقارير، (عرض+تعديل) للصفحات التفاعلية
- [x] تحديث cyclePermission وPermissionToggle لدعم viewOnly (لا تقفز لـ edit)
- [x] تحديث ROLE_DEFAULT_PERMISSIONS في UserManagement لمطابقة ROLE_DEFAULT_PERMS في DashboardLayout

## إصلاح خطأ validation اسم المستخدم
- [x] إصلاح خطأ "Too small: expected string to have >=3 characters" عند حفظ مستخدم في /users - إرسال username فقط إذا تغيّر

## مراجعة منطق حساب اختبار بروكتور
- [ ] التحقق من أن تغيير طريقة الاختبار يؤثر على حساب النتيجة (MDD/OMC)
- [ ] التحقق من أن حجم القالب يُستخدم في حساب الكثافة الكلية

## إضافة مواصفات مرجعية لاختبار بروكتور
- [x] إضافة بطاقة المواصفات المرجعية في SoilProctor.tsx (عدد الطبقات، الضربات، طاقة الدمك، المطرقة) تتغير ديناميكياً + تحذير عند تناسب غير ملائم بين القالب والطريقة

## ملاحظات الاختبار التشغيلي - الدورة الأولى

### إدارة المقاولين والقطاعات
- [x] إضافة خاصية تعديل المقاول (edit contractor)
- [x] إضافة dropdown لتحديد القطاع عند إنشاء العقد (العقد تابع لأي قطاع)
- [x] إضافة خاصية إضافة قطاع جديد أو مسمى آخر بواسطة الأدمن فقط

### تسجيل العينات
- [ ] إضافة dropdown لنوع العينة (عدد الأيام للخرسانة، نوع الطابوق، الانترلوك...إلخ)
- [ ] اسم الاختبار ونوع العينة ثابتان لا يتغيران في جميع المراحل
- [ ] إزالة زر الطباعة الإضافي والاكتفاء بعرض وصل الاستلام وطباعته
- [x] إضافة خاصية تعديل العينة بعد إضافتها
- [x] إصلاح خطأ إضافة عينة الحديد
- [x] إصلاح خطأ إضافة عينة الركام
- [ ] مراجعة جميع أنواع العينات للتأكد من عدم وجود أخطاء مشابهة

### التوزيع وخط السير
- [x] إضافة خيار إعادة التوزيع بعد التوزيع الأول (لتغيير الفني)
- [x] إصلاح اتجاه خط سير الإجراءات باللغة العربية (يظهر معكوساً) - مراجعة في جميع المراحل
- [ ] إصلاح اتجاه جدول المهام عند الفني باللغة العربية (يظهر معكوساً)

### صفحة الفني (إدخال النتائج)
- [ ] عدد العينات عند الفني يعتمد تلقائياً على العدد المدخل عند تسجيل العينة ويكون قابلاً للإضافة والحذف

### معادلات الاختبارات ومدخلاتها
- [ ] مراجعة وإصلاح معادلات جميع الاختبارات والتأكد من صحتها
- [ ] إصلاح صفحة تحليل المناخل: إضافة خانات النسبة والحجم (ليس فقط "القراءة")
- [ ] مراجعة وإصلاح مدخلات اختبار الحديد
- [ ] مراجعة وإصلاح مدخلات اختبار الركام
- [ ] التأكد من صحة الوحدات القياسية في جميع الاختبارات
- [ ] إصلاح الاختبارات غير المترجمة للعربية
- [ ] إصلاح التداخل في بعض خانات الـ dropdown

### تحديد النجاح والرسوب
- [ ] تحديد نجاح/رسوب العينة يكون من قبل المشرف وليس تلقائياً
- [ ] عرض الحد الأعلى والأدنى تلقائياً عند توفرهما للمشرف كمرجع

### تحويل العينات بعد إدخال النتائج
- [x] إصلاح: بعد تعبئة النتائج من الفني، جميع العينات يجب أن تختفي من قائمة الفني وتتحول لحالة "قيد المراجعة"

### لوحة تحكم QC
- [x] إصلاح النشاطات في لوحة QC: عرض أحداث المختبر (تسجيل عينات، اختبار، تحويل) بدلاً من إشعارات الصلاحيات

### بيانات تجريبية جاهزة
- [x] إضافة بيانات تجريبية جاهزة: عينات ناجحة وراسبة من أنواع مختلفة
- [x] إضافة عقد جاهز لاستخراج براءة الذمة مع نتائج مكتملة

## تثبيت البيانات التجريبية (مارس 2026)
- [x] الإبقاء على البيانات التجريبية كما هي (LAB-2026-T001 إلى T008) بدون تغيير
- [x] ربط عدد القراءات في نموذج الفني بكمية العينة المسجّلة (sampleQuantity)
- [x] إصلاح أخطاء TypeScript في نماذج الاختبارات المتخصصة (0 أخطاء)
- [x] 153 اختبار Vitest ناجح

## المقترحات الثلاثة الجديدة (مارس 2026 - الجولة الأخيرة)

### 1. إصلاح صفحة تحليل المناخل (SieveAnalysis)
- [x] إعادة هيكلة جدول المناخل: إضافة أعمدة (الكتلة المحتجزة، % المحتجز، % المحتجز التراكمي، % المار التراكمي)
- [x] حساب تلقائي للنسب المئوية من الكتلة الكلية للعينة
- [x] رسم بياني لمنحنى التدرج مع حدود المواصفة
- [x] دعم ثنائي اللغة لجميع العناوين والحقول

### 2. مراجعة وإصلاح مدخلات الحديد والركام
- [x] مراجعة SteelRebar.tsx: التحقق من صحة الوحدات (MPa, mm, %) — صحيحة
- [x] مراجعة SteelRebar.tsx: التحقق من معادلة حساب المساحة ونسبة الاستطالة — صحيحة
- [x] إضافة ترجمة عربية كاملة لجميع عناوين وحقول SteelRebar.tsx
- [ ] مراجعة AggCrushing.tsx / AggImpact.tsx / AggLAAbrasion.tsx: التحقق من الوحدات والمعادلات

### 3. Dropdown لنوع العينة الفرعي في الاستقبال
- [x] حقل sampleSubType موجود بالفعل في schema.ts وقاعدة البيانات
- [x] Dropdown موجود في Reception.tsx ويعمل بشكل صحيح
- [x] ربط testSubType في Distribution.tsx مع الـ backend (distributions.create)
- [x] إضافة testSubType إلى input schema في routers.ts وتمريره لـ createDistribution

## الاقتراحات الثلاثة الجديدة (مارس 2026 - الجولة الثانية)

### 1. مراجعة نماذج الركام
- [x] مراجعة AggCrushing.tsx: التحقق من الوحدات والمعادلات + ترجمة عربية — صحيحة
- [x] مراجعة AggImpact.tsx: التحقق من الوحدات والمعادلات + ترجمة عربية — صحيحة
- [x] مراجعة AggLAAbrasion.tsx: التحقق من الوحدات والمعادلات + ترجمة عربية — تم إضافة الترجمة العربية

### 2. بناء نموذج CBR للتربة (SOIL_CBR)
- [x] إصلاح SoilCBR.tsx: إزالة محارف Unicode وإصلاح خطأ JSX في السطر 273
- [x] SoilCBR.tsx يعمل بشكل صحيح (HMR update ناجح)

### 3. تحسين صفحة الفني
- [x] إضافة SUBTYPE_LABELS وgetSubTypeLabel في Technician.tsx (ترجمة جميع الأنواع الفرعية)
- [x] عرض sampleCode + subType كـ subtitle في بطاقة المهمة (مثال: LAB-2026-T001 • 28 يوم)

## تعديلات المستخدم (مارس 2026 - الجولة الثالثة)

### 1. نوع العينة الفرعي في الاستقبال
- [x] نوع العينة الفرعي يظهر فقط بعد اختيار الاختبار المحدد (وليس قائمة مشتركة لكل الأنواع)
- [x] كل اختبار له قائمة الأنواع الفرعية الخاصة به (SUBTYPES_BY_TEST_CODE)

### 2. عرض نوع الاختبار في التوزيع
- [x] عرض النوع الفرعي (كم يوم، نوع البلوك...الخ) في بطاقة التوزيع بوضوح

### 3. إصلاح تقرير المراجعة
- [x] إزالة زر "فتح PDF" المنفصل - التقرير يُعرض مباشرة في الصفحة
- [x] إبقاء زر "عرض التقرير" فقط (يفتح صفحة التقرير للطباعة)
- [x] الملاحظات غير إلزامية عند قرار "اعتماد" (إلزامية فقط عند "مراجعة" أو "رفض")

### 4. إعادة هيكلة صفحتي المشرف وQC
- [x] إزالة تبويب "الكل" من صفحة المشرف وQC
- [x] الصفحة تبدأ بعرض الجديدة وغير المكتملة مباشرة
- [x] إضافة تبويب "الأرشيف" للمنجزة مع بحث برقم العقد/المقاول
- [x] عرض تاريخ العينة في بطاقات الأرشيف

## إصلاحات عاجلة (مارس 2026)

- [x] إصلاح تقرير النتائج: إضافة بيانات تجريبية لنتائج الاختبارات + إصلاح getTestResultByDistribution وgetSpecializedTestResultByDistribution لترجع null
- [x] تطبيق الكل/غير مكتملة/منجزة على QCReview: حذف زر "الكل" من قسم تأكيد نتائج العينات
- [x] إصلاح التاريخ غير الواضح في SectorResults.tsx: عرض التاريخ بصيغة واضحة (dd/mm/yyyy)
- [x] إصلاح حالة براءة الذمة في SectorClearances.tsx: تحديث ترجمات الحالات لتكون واضحة (معتمد من QC — بانتظار أمر الدفع)
- [x] حذف خطوة تعبئة رقم الإيصال من ClearancePage.tsx — الاكتفاء بتحميل أمر الدفع مباشرة

## تجهيز البيئة التجريبية
- [ ] فحص هيكل جداول العقود والقطاعات والشركات
- [ ] إضافة عقود وشركات تجريبية لكل قطاع (بدون عينات)
- [ ] التحقق من صلاحيات كل دور (كل مستخدم يرى ما يخصه فقط)
- [ ] حفظ Checkpoint

## تحديث كلمات المرور وتجهيز البيئة التجريبية
- [x] تحديث كلمات مرور حسابات القطاعات الخمسة (Roads@2025, Buildings@2025, Infra@2025, Industrial@2025, Housing@2025)
- [x] تحديث كلمات مرور حسابات الموظفين (reception@2025, supervisor@2025, tech@2025, qcc@2025, accountant@2025)
- [x] التحقق من وجود 12 شركة و27 عقداً موزعة على 5 قطاعات
- [x] التحقق من 153 اختبار Vitest ناجح

## تعديلات Test 1 - مكعبات خرسانة (من الملاحظات)
- [ ] إضافة خيار Edit للعينة عند الاستقبال
- [ ] إضافة زر عرض تقرير كل عينة للمشرف
- [ ] تقريب القوة الانضغاطية لأقرب 0.5 N/mm² (individual & mean)
- [ ] تقريب الكثافة لأقرب 10 kg/m³
- [ ] التأكد من ظهور التقريب في PDF/تقرير المخرجات

## تعديلات Test 2 - كور خرسانة (من الملاحظات)
- [ ] إلغاء تطبيق CF عند L/D = 1
- [ ] تقريب القوة الانضغاطية لأقرب 0.5 N/mm²
- [ ] إضافة حقل الكثافة في التقرير بأقرب 10 kg/m³
- [ ] قبول العينات المطحونة (grinded samples)
- [ ] التأكد من ظهور التعديلات في PDF/تقرير المخرجات

## تعديلات Test 1 - مكعبات خرسانة (BS 1881)
- [x] تقريب القوة الانضغاطية لأقرب 0.5 N/mm² في الـ frontend (ConcreteTest.tsx) والـ backend (routers.ts) والتقرير (ConcreteReport.tsx)
- [x] تقريب الكثافة لأقرب 10 kg/m³ في الـ frontend والـ backend والتقرير
- [x] إضافة دوال fmtStrength و fmtDensity في ConcreteReport.tsx لعرض القيم المقرّبة
- [x] تعديل زر Edit في Reception.tsx ليظهر لـ admin/lab_manager/reception بغض النظر عن حالة العينة

## تعديلات Test 2 - كور خرسانة (BS 1881-120)
- [x] إلغاء تطبيق correction factor عندما L/D = 1.0 بالضبط (CF = 1.000)
- [x] تقريب قوة الكور (Core Strength) لأقرب 0.5 N/mm²
- [x] تقريب قوة المكعب المكافئة (Eq. Cube Strength) لأقرب 0.5 N/mm²
- [x] تحديث SpecializedTestReport.tsx لعرض Core Strength و Eq. Cube Strength بشكل صحيح
- [x] إضافة عمود الموقع (Location) في تقرير Test 2
- [x] دعم كلا اسمَي الحقل: cores[] و rows[] للتوافق مع البيانات القديمة

## إصلاح مشكلة المشرف
- [ ] نتائج الاختبارات لا تفتح عند المشرف في صفحة Supervisor View

## دعم أنواع بلوكات متعددة في طلب استقبال واحد
- [x] إضافة procedure createMultiple في backend لإنشاء عينات متعددة دفعة واحدة
- [x] تعديل نموذج الاستقبال: عند اختيار CONC_BLOCK يظهر وضع multi-block
- [x] إمكانية إضافة أكثر من نوع بلوك (صلب/مجوف/حراري) مع كميات مختلفة
- [x] حذف نوع بلوك من القائمة قبل الحفظ
- [x] تعديل كمية كل نوع بلوك بشكل مستقل
- [x] عند الحفظ يُنشأ تلقائياً عينة منفصلة لكل نوع
- [x] زر الحفظ يعرض عدد العينات التي ستُنشأ
- [x] إخفاء حقل Quantity في وضع multi-block (الكمية موجودة لكل نوع بشكل مستقل)
- [x] إضافة batchId في schema وقاعدة البيانات لربط العينات من نفس الطلب
- [x] إضافة procedure getByBatch في specializedTests router
- [x] إنشاء صفحة BatchBlockReport.tsx للتقرير الموحد (نوع واحد = تقرير عادي، أنواع متعددة = تقرير موحد)
- [x] تعديل ManagerReview وQCReview لفتح batch report عند وجود batchId

## إصلاح مشكلة المشرف وتحسين نموذج البلوكات
- [ ] إصلاح مشكلة المشرف: نتائج الاختبارات لا تفتح في Supervisor View
- [ ] إضافة خيار القياس (Size) لكل نوع بلوكة في نموذج الاستقبال (Hollow 10/15/20/25cm، Solid 10/15/20/25cm، Thermal 20/25cm)
- [ ] الكمية الافتراضية = 1 في نموذج الاستقبال
- [ ] تأقلم صفحة الفني (ConcreteBlocks.tsx) لعرض القياس الصحيح وحساب المساحة تلقائياً

## إصلاحات Test 5, 6, 7
- [ ] إصلاح مشكلة عدم رؤية تقرير العينة للمشرف في Test 5 (Foam Concrete Cubes)
- [ ] إصلاح مشكلة عدم رؤية تقرير العينة للمشرف في Test 6 (Oven Dry Density)
- [ ] إضافة موقع العينة (Location) في تقرير Test 5 وعرضه في نتائج المشرف
- [ ] إضافة موقع العينة (Location) في تقرير Test 6 وعرضه في نتائج المشرف
- [ ] إصلاح خطأ NaN في وقت الشك (Test 7)
- [ ] إضافة Initial & Final setting time في تقرير Test 7

## إصلاحات Test 5, 6, 7 (2026-04-01)
- [x] إصلاح مشكلة عدم رؤية تقرير العينة للمشرف في Test 5 و6 (إضافة renderer مخصص لـ concrete_foam)
- [x] إضافة حقل location في جدول samples وتطبيق migration
- [x] إضافة حقل Location في نموذج الاستقبال
- [x] إضافة sampleLocation في جميع procedures الـ backend
- [x] إصلاح خطأ NaN في وقت الشك النهائي (Test 7) — تغيير من 0mm إلى 1mm (BS EN 196-3)
- [x] إضافة renderer مخصص لـ cement_setting_time في SpecializedTestReport
- [x] إضافة renderer مخصص لـ concrete_foam في SpecializedTestReport

## ملاحظات Test 1 و Test 2 (commentonlabtests-3.pdf)
- [ ] استبدال قائمة 7/14/28 Days بحقل تاريخ الصب (Date of Casting) في نموذج الاستقبال
- [ ] حساب عمر العينة تلقائياً في صفحة الفني من تاريخ الصب
- [ ] إصلاح منطق المقارنة: قيمة = الحد تُعتبر "ضمن المواصفة" (≥ بدلاً من >)
- [ ] تصحيح عرض الحجم الاسمي في تقرير المكعبات (100mm vs 150mm)
- [x] Test 2: إضافة عمود Length (mm) في جدول الكور
- [x] Test 2: إضافة Mass & Density (مقرّب لأقرب 10 kg/m³)
- [x] Test 2: تصحيح منطق C/F (إذا L/D = 1 فلا تصحيح — CF = 1.000)
- [x] Test 2: تحديث الحد المطلوب إلى 65% من قوة المكعب
- [x] Test 2: تحديث المواصفة المرجعية إلى BS EN 12504-1
- [x] Test 2: تحديث SpecializedTestReport لعرض Density في تقرير الكور
- [x] إضافة renderer مخصص لـ concrete_cubes في SpecializedTestReport
- [x] إصلاح خطأ TypeScript: NEW_STATUSESS → NEW_STATUSES في Reception.tsx

## إصلاح nominalCubeSize والعينات المطحونة (2026-04-01)
- [x] إصلاح nominalCubeSize في ConcreteCubes.tsx: حفظ الحجم الاسمي في formData
- [x] إصلاح nominalCubeSize في SpecializedTestReport: عرض الحجم الصحيح (100mm/150mm) في تقرير concrete_cubes
- [x] إصلاح nominalCubeSize في ConcreteTest.tsx: إضافة حقل اختيار 100mm/150mm عند إنشاء مجموعة عمر
- [x] إصلاح nominalCubeSize في routers.ts: قبول وحفظ nominalCubeSize في createGroup
- [x] إضافة حقل endCondition (as-drilled/grinded/capped) في ConcreteCore.tsx
- [x] حفظ endCondition في formData عبر routers.ts
- [x] عرض endCondition في SpecializedTestReport (تقرير كور الخرسانة) مع ملخص القوة المحددة والحد المطلوب

## تعديلات Test 2 إضافية (2026-04-02)
- [x] Test 2: عند L/D=2 القوة تُعتبر cylinder strength (ليس مكعب مكافئ) — إضافة ملاحظة في الواجهة والتقرير (علامة cyl)
- [x] Test 2: إضافة عمود Density (kg/m³) في جدول الكور المطبوع في SpecializedTestReport
- [x] Test 2: تصحيح عمود Length في التقرير — عرض Length (mm) أولاً (عمود 4)

## إضافة زر التقرير لجميع الاختبارات (2026-04-02)
- [x] إضافة زر "طباعة التقرير / PDF" لـ 19 اختبار بدون زر: AggCrushingImpact, AggLAAbrasion, AggShapeIndex, AggSpecificGravity, AsphaltBitumenExtraction, AsphaltCore, AsphaltMarshall, CementSettingTime, ConcreteBlocks, ConcreteFoam, Interlock, SieveAnalysis, SoilAtterberg, SoilCBR, SoilFieldDensity, SoilProctor, SteelBendRebend, SteelRebar, SteelStructural

## Batch Distribution للطابوق (2026-04-02)
- [x] إضافة batchDistributionId في جدول distributions (schema + migration)
- [x] إضافة getDistributionsByBatch في db.ts
- [x] إضافة distributions.createBatch و distributions.getByBatch في routers.ts
- [x] تحديث Distribution.tsx: تجميع عينات الدفعة بصف واحد (بنفسجي) + Dialog توزيع الدفعة
- [x] تحديث SpecializedTestReport: تقرير واحد مقسّم حسب النوع عند فتح أي توزيع من الدفعة (BatchResultsSection)

## تعديل تقرير الخرسانة
- [x] حذف "N/G" من حقل Batch Date & Time في تقرير الخرسانة
- [x] ربط Date Sampled تلقائياً بتاريخ الصب (batchDateTime) في تقرير الخرسانة

## إصلاح Within/Outside Specification Limits في تقرير الخرسانة
- [x] إصلاح منطق فصل العينات: إضافة extractTargetFromClass كـ fallback من classOfConcrete
- [x] تلوين صفوف الجدول: أخضر للعينات ضمن المواصفات، أحمر للعينات خارجها
- [x] تحديث لون نص قيمة المقاومة: أخضر للناجحة وأحمر للفاشلة

## عمود Within Spec ✓ في اختبار الكيوبات
- [ ] إضافة حقل withinSpec (boolean) في جدول concreteCubes في drizzle/schema.ts
- [ ] تحديث db.ts وrouters.ts لحفظ وإعادة withinSpec
- [ ] إضافة عمود checkbox "Within Spec ✓" في جدول ConcreteTest.tsx
- [ ] تحديث ConcreteReport.tsx ليستخدم withinSpec اليدوي بدلاً من الحساب التلقائي فقط

## عمود Within Spec ✓ في اختبار الكيوبات الخرسانية
- [x] إضافة حقل withinSpec في schema.ts وتطبيق migration
- [x] إضافة عمود Within Spec ✓ في جدول ConcreteTest.tsx (checkbox يدوي للفني)
- [x] تحديث ConcreteReport.tsx ليأخذ withinSpec اليدوي بعين الاعتبار في التلوين والتصنيف

## ملاحظة تلقائية في تقرير الخرسانة عند Within Spec اليدوي
- [x] إضافة ملاحظة تلقائية في ConcreteReport.tsx عند وجود كيوبات withinSpec يدوية تحت الحد التلقائي
- [x] حذف حقل Subtype من نموذج توزيع الكيوبات الخرسانية (العمر يُحسب تلقائياً من تاريخ الصب)
- [x] تعديل صياغة الملاحظة التلقائية في ConcreteReport.tsx لتكون عامة (بدون ذكر 40 days أو 65% بشكل ثابت)
- [x] إعادة عمود "Within Spec ✓" المفقود في جدول إدخال الكيوبات (ConcreteTest.tsx) - تم دمج L/W/H في عمود واحد لتوفير مساحة

## نسب القبول الصحيحة حسب العمر الفعلي للكيوب (2026-04-03)
- [ ] تحديث دالة getRequiredStrength لتعتمد على العمر الفعلي للكيوب (من تاريخ الصب + تاريخ الاختبار) بدلاً من عمر المجموعة
- [ ] تطبيق نسب: 1d=16%, 3d=40-45%, 7d=65-70%, 14d=90%, 28d=99-100%, 56d+=105-120%
- [ ] منطق التجميع: إذا تعدى العمر الفعلي عمر المجموعة → تقييم بنسبة المجموعة التالية
- [ ] إضافة عمود Age (days) في جدول ConcreteTest.tsx يحسب العمر تلقائياً
- [ ] تحديث ConcreteReport.tsx بنفس منطق النسب الجديد

## نظام Multi-Test Order (الأوردر متعدد الاختبارات)
- [x] إضافة جدول orders في قاعدة البيانات (orderId, sampleId, status, createdBy, distributedAt, completedAt)
- [x] إضافة حقل orderId في جدول distributions (عبر lab_order_items)
- [x] حذف جميع العينات والاختبارات الموجودة (الشركات والعقود تبقى)
- [x] تعديل صفحة الاستقبال: إنشاء أوردر بدل توزيع مباشر + checkboxes لاختيار اختبارات متعددة
- [x] تعديل صفحة الموزع: توزيع أوردر كامل دفعة واحدة (بدل توزيعات منفصلة)
- [x] تعديل صفحة الفني: عرض أوردرات مجمّعة مع progress indicator لكل أوردر
- [x] تعديل صفحة المشرف: مراجعة الأوردر الكامل بعد اكتمال كل الاختبارات (عبر تحديث حالة العينة تلقائياً)
- [ ] إنشاء Unified PDF Report يجمع كل الاختبارات في ملف واحد مقسّم بأقسام

## تقرير الأداء الشهري
- [ ] إضافة analytics.monthlyReport procedure في routers.ts
- [ ] بناء صفحة MonthlyReport.tsx (للأدمن والمشرف)
- [ ] تسجيل المسار /monthly-report في App.tsx
- [ ] إضافة رابط في sidebar لكلا الدورين

## تقرير الأداء الشهري
- [x] إضافة tRPC procedure `reports.monthly` في routers.ts
- [x] بناء صفحة MonthlyReport.tsx مع KPIs وجداول ورسوم بيانية
- [x] إضافة route `/monthly-report` في App.tsx
- [x] إضافة عنصر "تقرير الأداء الشهري" في sidebar (للأدمن وlab_manager)
- [x] إضافة ترجمة `nav.monthlyReport` في LanguageContext
- [x] دعم الطباعة (print button)
- [x] متوسط وقت الإنجاز من تاريخ إنشاء طلب براءة الذمة حتى إصدار الشهادة

## تصدير تقرير الأداء الشهري كـ PDF
- [x] بناء tRPC procedure `reports.monthlyPdf` يولّد PDF server-side ويرفعه على S3 ويرجع URL
- [x] استخدام puppeteer (متوفر مسبقاً) لتوليد PDF من HTML
- [x] إضافة زر "تصدير PDF" في صفحة MonthlyReport.tsx مع loading state
- [x] دعم اللغتين عربي/إنجليزي في PDF مع selector AR/EN
- [x] بناء server/monthlyReportPdf.ts مع HTML template احترافي

## إصلاحات من التعليقات (IMG_5161)
- [ ] Distribution: إظهار عمود Tests (الاختبارات المرتبطة بكل طلب)
- [ ] Distribution: إظهار النوع الفرعي للعينة (مكعبات، بلاط، تربة، حديد، إلخ) وليس فقط "Concrete"
- [ ] Reception: دعم أنواع متعددة في طلب البلوكات (Solid/Hollow/Thermal blocks بكميات مختلفة)

## إصلاحات من التعليقات (IMG_5161)
- [x] صفحة Distribution: إظهار عمود Tests مع اسم الاختبار وحالته وكميته
- [x] صفحة Distribution: إظهار النوع الفرعي (sampleSubType) في عمود Type
- [x] صفحة Distribution: إظهار اسم الفني المسؤول
- [x] صفحة Reception: دعم أنواع متعددة في طلب CONC_BLOCK (Solid + Hollow + Thermal) مع كمية مستقلة لكل نوع

## إصلاحات من التعليقات (IMG_5162 + IMG_5163)
- [x] Reception: دعم أنواع متعددة في CONC_INTERLOCK (6cm + 8cm tiles) مع كمية مستقلة لكل نوع
- [x] Reception: دعم أنواع متعددة في CONC_MORTAR_SAND (Plaster Sand + Masonry Sand) كطلبات منفصلة

## إصلاحات من التعليقات (IMG_5164)
- [x] Reception: تحديث أنواع SOIL_SIEVE بأنواع التربة الفعلية (9 أنواع: Formation Level, General Backfill, Structural Fill, إلخ) ودعم multi-subtype
- [x] Reception: دعم أقطار متعددة في اختبارات الحديد (STEEL_REBAR, STEEL_BEND, STEEL_REBEND, STEEL_STRUCTURAL, STEEL_ANCHOR) في طلب واحد
- [x] Reception: إضافة STEEL_ANCHOR بأقطار 12مم حتى 50مم إلى SUBTYPES_BY_CODE

## إصلاحات من التعليقات (IMG_5165 + IMG_5166)
- [x] Reception: تحديث AGG_SIEVE بأنواع الركام المحددة (32mm, 20mm, 10mm, 0-5mm, Dune Sand, Others) مع multi-subtype
- [x] Reception: فصل اختبارات ASPH_HOTBIN (Grading + Sp.Gravity + Flakiness) عن اختبارات Trial Mix/Fresh Samples بسيليكتور نوع العينة

## إصلاح أخطاء TypeScript
- [x] إصلاح الـ 13 خطأ في routers.ts — تبين أن الدوال موجودة بالفعل، الأخطاء كانت في watcher قديم. إصلاح خطأ "partial" في OrderReport.tsx وخطأ null في Reception.tsx → صفر أخطاء TypeScript

## إصلاحات من التعليقات (IMG_5171)
- [x] Reception: تغيير صيغة تاريخ الصب إلى dd/mm/yyyy مع auto-insert slashes وvalidation وتحويل تلقائي عند الإرسال
- [x] Reception: إصلاح حساب totalPrice ليشمل multiSubtypes للاختبارات متعددة الأنواع (CONC_MORTAR_SAND وغيره)

## إصلاح Scheduled Jobs
- [x] إضافة retry logic مع exponential backoff لـ checkOverduePayments لمعالجة ECONNRESET وأخطاء الاتصال المؤقتة
- [x] تحسين isRetryableError لاكتشاف الأخطاء المخفية داخل DrizzleQueryError عبر المشي في سلسلة .cause
- [x] تحويل رسائل الخطأ المؤقتة من console.error إلى console.warn مع رسالة مختصرة

## إصلاحات من الصور IMG_5172 + IMG_5173
- [x] Reception: إصلاح خطأ DB عند إرسال حديد بأقطار متعددة — تقليص testTypeName ليحتوي على كود الاختبار فقط بدلاً من الأسماء الكاملة
- [x] Reception: إصلاح ملخص السعر لـ SOIL_SIEVE — يظهر كل نوع تربة مختار بسعره وكميته بشكل منفصل
- [x] Reception: إصلاح ملخص السعر لاختبارات الحديد متعددة الأقطار — يظهر كل قطر بسعره وكميته بشكل منفصل

## إصلاحات من الصورة IMG_5174
- [x] Reception: ASPH_HOTBIN تحت Hot Bin Aggregates — Grading فقط إلزامي، إضافة Sp.Gravity & Absorption وFlakiness & Elongation Index كاختياريين داخل بطاقة ASPH_HOTBIN
- [x] Reception: تصحيح HOT_BIN_CODES ليستخدم AGG_SG بدلاً من AGG_SP_GRAVITY الخاطئ

## إصلاحات من الصورة IMG_5191
- [x] Reception: AGG_SIEVE مع أنواع متعددة — توسيع testSubType وsampleSubType إلى VARCHAR(512) في samples وdistributions وlab_order_items + تقليص testTypeName في lab_order_items

## Validation وDistribution لـ MULTI_SUBTYPE_TESTS
- [x] Reception: validation شامل لجميع MULTI_SUBTYPE_TESTS — منع الإرسال إذا لم يُختر أي نوع فرعي مع رسالة خطأ تحتوي على اسم الاختبار بالضبط
- [x] Distribution: عرض كل نوع فرعي كبادج منفصل باسمه التفصيلي، واستبدال __multi__ بـ testTypeCode للأوردرات القديمة

## إصلاحات Reception - Edit وCalendar
- [x] Reception: إضافة Edit Order dialog مع حقول تعديل contractorName وlocation وnotes وpriority وcastingDate
- [x] Reception: تحويل حقل castingDate من text input إلى Calendar Picker في نموذج الإنشاء وفي Edit dialog

## إصلاح Hot Bin Add-ons QTY
- [x] Reception: إضافة حقل QTY (−/+) للاختبارات الاختيارية (AGG_SG, AGG_FLAKINESS_ELONGATION) في Hot Bin Aggregates عند تحديدها

## إصلاح ترتيب Asphalt Mix
- [x] Reception: إضافة Course Selector (Wearing/Binder/Base) كمحدد عالمي قبل قائمة الاختبارات، مع validation وتطبيق تلقائي على جميع الاختبارات

## تحديثات Sieve Analysis - Plaster Sand & Masonry Sand
- [x] إضافة PLASTER_SAND (BS 1199) إلى SieveAnalysis.tsx مع مناخل: 5.0, 2.36, 1.18, 0.6, 0.3, 0.15, 0.075mm
- [x] إضافة MASONRY_SAND (ASTM C144) إلى SieveAnalysis.tsx مع مناخل: 9.5, 4.75, 2.36, 1.18, 0.6, 0.3, 0.15mm
- [x] إصلاح renderSieveAnalysis في SpecializedTestReport.tsx ليستخدم fd.rows بدلاً من fd.sieves
- [x] إضافة نوع التدرج (grading label) في رأس التقرير
- [x] إضافة معامل النعومة (FM) في التقرير

## تحديثات Flexural Beams
- [x] إضافة renderConcreteBeam في SpecializedTestReport.tsx
- [x] التقرير يعرض: Beam Size, Span, Specified Strength, Min MOR, Cast Date
- [x] جدول النتائج يعرض: Beam No., Location, Width, Depth, Max Load, Fracture Zone, MOR, Age (إذا توفر), Result
- [x] ملخص: Average MOR, Min Required, Valid Beams count
- [x] إضافة case "concrete_beam" في switch renderFormData

## إصلاح Cement Setting Time - NaN في التقرير
- [x] إصلاح interpolateTime في CementSettingTime.tsx: إضافة فحص isNaN وdivision by zero وfallback
- [x] إصلاح renderCementSettingTime في SpecializedTestReport.tsx: إعادة حساب initialSet/finalSet من القراءات إذا كانت القيمة المحفوظة NaN/null
- [x] إصلاح شروط العرض لتستخدم != null && !isNaN() بدلاً من !== undefined
