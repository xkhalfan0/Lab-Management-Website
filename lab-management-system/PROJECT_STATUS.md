# PROJECT_STATUS.md — نظام إدارة مختبر الإنشاءات والمواد الهندسية
> **آخر تحديث:** 2026-04-07
> **الغرض:** مرجع سريع لتجنب إعادة قراءة الملفات في كل مهمة جديدة.
> **قاعدة:** اقرأ هذا الملف أولاً في كل مهمة جديدة قبل أي شيء آخر.

---

## 1. معلومات المشروع

| الحقل | القيمة |
|---|---|
| اسم المشروع | `lab-management-system` |
| المسار | `/home/ubuntu/lab-management-system` |
| Stack | React 19 + Tailwind 4 + Express 4 + tRPC 11 + Drizzle ORM + MySQL |
| Dev URL | `https://3000-i1nwu23ywbz7za5qhm1ic-18f4ac18.sg1.manus.computer` |
| آخر checkpoint | `0aa848d1` |

---

## 2. أدوار المستخدمين (User Roles)

```
admin | reception | lab_manager | technician | sample_manager | qc_inspector | accountant | user
```

كل دور له صلاحيات مختلفة محددة في `permissions` (JSON field في جدول `users`).

---

## 3. قاعدة البيانات — الجداول الرئيسية

| الجدول | الوصف | الحقول المهمة |
|---|---|---|
| `users` | المستخدمون | `id, role, specialty, username, passwordHash, permissions, isActive` |
| `samples` | العينات | `id, sampleCode(LAB-2026-XXXX), contractId, contractNumber, contractorName, sampleType, sector, status, batchId, location, castingDate, receivedById, receivedAt` |
| `distributions` | التوزيعات | `id, distributionCode(DIST-2026-XXX), sampleId, assignedTechnicianId, testType, testName, minAcceptable, maxAcceptable, unit, status, batchDistributionId` |
| `testResults` | نتائج الاختبارات | `id, distributionId, sampleId, technicianId, result, unit, complianceStatus, status, formData(JSON)` |
| `reviews` | المراجعات | `id, testResultId, specializedTestResultId, sampleId, reviewerId, reviewType(manager_review/qc_review), decision, comments, signature` |
| `attachments` | المرفقات | `id, sampleId, distributionId, fileKey, fileUrl, attachmentType` |
| `certificates` | شهادات الإخلاء | `id, certificateCode(CERT-2026-XXX), sampleId, issuedById, projectNumber, contractorName, testsCompleted(JSON), pdfUrl` |
| `notifications` | الإشعارات | `id, userId, sampleId, title, message, type, targetRole, sectorId, isRead` |
| `sampleHistory` | سجل تاريخ العينة | `id, sampleId, userId, action, fromStatus, toStatus` |
| `concreteTestGroups` | مجموعات كيوبات الخرسانة | `id, distributionId, sampleId, targetAge, classOfConcrete, nominalCubeSize, status` |
| `concreteCubes` | كيوبات الخرسانة | `id, groupId, cubeNumber, length, width, height, weight, breakLoad, compressiveStrength, withinSpec, testedAt` |
| `specializedTestResults` | نتائج الاختبارات المتخصصة | `id, distributionId, sampleId, technicianId, testType, formData(JSON), complianceStatus, status` |
| `clearanceRequests` | طلبات الإخلاء | `id, sampleId, contractId, status, qcReviewedAt, accountantReadAt, paymentOrderUrl, receiptNumber, certificateId` |
| `testTypes` | أنواع الاختبارات | `id, code, nameAr, nameEn, category, formTemplate, unitPrice` |
| `contractors` | المقاولون | `id, nameAr, nameEn, phone, email` |
| `contracts` | العقود | `id, contractNumber, contractName, contractorId, sectorId` |
| `sectors` | القطاعات | `id, sectorKey(sector_1..5), nameAr, nameEn` |
| `labOrders` | الطلبات متعددة الاختبارات | `id, orderCode(ORD-2026-XXXX), sampleId, status(pending/distributed/in_progress/completed/reviewed/qc_passed/rejected), assignedTechnicianId` |
| `labOrderItems` | عناصر الطلب | `id, orderId, distributionId, testTypeId, testTypeCode, testTypeName, formTemplate, status` |
| `sectorAccounts` | حسابات القطاعات | `id, sectorKey, username, passwordHash, isActive` |
| `auditLog` | سجل التدقيق | `id, userId, action, entityType, entityId, details(JSON)` |

---

## 4. سير العمل الرئيسي (Workflow)

```
الاستقبال (Reception)
  → إنشاء Sample + LabOrder (مع اختيار اختبارات متعددة)
  → status: received → pending

التوزيع (Distribution)
  → تعيين الأوردر لفني + إنشاء Distribution لكل اختبار
  → status: pending → distributed

الفني (Technician)
  → إدخال نتائج كل اختبار
  → status: distributed → in_progress → completed

مراجعة المشرف (Manager Review)
  → مراجعة الأوردر الكامل بعد اكتمال كل الاختبارات
  → status: completed → reviewed

مراجعة ضبط الجودة (QC Review)
  → status: reviewed → qc_passed / qc_failed

الإخلاء (Clearance)
  → إنشاء ClearanceRequest → مراجعة QC → محاسبة → إصدار شهادة
```

---

## 5. tRPC Routers والـ Procedures

### `auth` (السطر 169)
`me`, `logout`

### `users` (السطر 179)
`list`, `technicians`, `create`, `delete`, `updateRole`, `updatePermissions`, `update`, `changePassword`

### `audit` (السطر 357)
`list`

### `samples` (السطر 370)
`list`, `get`, `create`, `update`, `stats`, `dailyWork`, `history`, `getByBatch`, `createMultiple`, `generateSimplifiedReport`

### `distributions` (السطر 765)
`bySample`, `myAssignments`, `create`, `get`, `markRead`, `getByBatch`, `createBatch`

### `testResults` (السطر 995)
`bySample`, `get`, `getByDistribution`, `submit`

### `reviews` (السطر 1100)
`markManagerRead`, `bySample`, `managerReview`, `qcReview`

### `attachments` (السطر 1363)
`bySample`, `upload`

### `certificates` (السطر 1411)
`list`, `get`, `bySample`, `create`, `updatePdf`

### `concrete` (السطر 1489)
`groupsByDistribution`, `groupsBySample`, `createGroup`, `saveCube`, `deleteCube`, `updateGroup`, `submitGroup`

### `testTypes` (السطر 1703)
`list`, `listByCategory`, `create`, `update`, `delete`

### `contractors` (السطر 1764)
`list`, `create`, `update`, `delete`

### `contracts` (السطر 1811)
`list`, `listSimple`, `getByNumber`, `create`, `update`, `delete`

### `specializedTests` (السطر 1910)
`getByDistribution`, `getBySample`, `getByBatch`, `save`

### `clearance` (السطر 2044)
`list`, `getById`, `getByContract`, `listSectors`, `create`, `markQcRead`, `markAccountantRead`, `qcReview`, `issuePaymentOrder`, `uploadDocument`, `issueCertificate`, `saveReceiptNumber`, `updateStatus`, `getArchive`, `checkPaymentDelays`

### `analytics` (السطر 2395)
`testStats`

### `sectors` (السطر 2527)
`list`, `create`, `update`, `delete`

### `orders` (السطر 2569)
`list`, `get`, `byStatus`, `myOrders`, `create`, `distribute`, `updateItemStatus`, `completeItem`, `review`, `qcReview`, `bySample`, `getForReport`

### `notifications` (السطر 2882)
`list`, `markRead`, `markAllRead`

---

## 6. الصفحات الرئيسية (Pages)

| الصفحة | المسار | الوصف |
|---|---|---|
| `Reception.tsx` | `/reception` | استقبال العينات + إنشاء أوردر متعدد الاختبارات |
| `Distribution.tsx` | `/distribution` | توزيع الأوردرات على الفنيين |
| `Technician.tsx` | `/technician` | إدخال نتائج الاختبارات (مجمّعة بالأوردر) |
| `ManagerReview.tsx` | `/manager-review` | مراجعة المشرف للأوردرات المكتملة |
| `QCReview.tsx` | `/qc-review` | مراجعة ضبط الجودة |
| `Clearance.tsx` | `/clearance` | إدارة طلبات الإخلاء |
| `ClearanceArchive.tsx` | `/clearance-archive` | أرشيف شهادات الإخلاء |
| `UserManagement.tsx` | `/users` | إدارة المستخدمين والصلاحيات |
| `TestTypesManagement.tsx` | `/tests-management` | إدارة أنواع الاختبارات |
| `Analytics.tsx` | `/analytics` | إحصائيات وتحليلات |
| `AdminDashboard.tsx` | `/admin-dashboard` | لوحة تحكم المدير |
| `SupervisorDashboard.tsx` | `/supervisor-dashboard` | لوحة تحكم المشرف |
| `Notifications.tsx` | `/notifications` | الإشعارات |
| `SampleDetail.tsx` | `/samples/:id` | تفاصيل العينة |
| `ConcreteTest.tsx` | `/concrete-test/:distributionId` | إدخال نتائج كيوبات الخرسانة |
| `ConcreteReport.tsx` | `/concrete-report/:distributionId` | تقرير الخرسانة |
| `OrderReport.tsx` | `/order-report/:orderId` | **التقرير الموحد للطلب (ثنائي اللغة)** |
| `PrintCertificate.tsx` | `/print-certificate/:id` | طباعة شهادة الإخلاء |
| `PrintReceipt.tsx` | `/print-receipt/:id` | طباعة إيصال الاستلام |
| `TestRouter.tsx` | `/test/:distributionId` | توجيه ذكي لنموذج الاختبار المناسب |
| `SpecializedTestReport.tsx` | `/test-report/:distributionId` | تقرير الاختبارات المتخصصة |
| `BatchBlockReport.tsx` | `/batch-report/:batchId` | تقرير دفعة الطابوق |

### صفحات القطاع (Sector Portal)
| الصفحة | المسار |
|---|---|
| `SectorLogin.tsx` | `/sector/login` |
| `SectorDashboard.tsx` | `/sector/dashboard` |
| `SectorSamples.tsx` | `/sector/samples` |
| `SectorResults.tsx` | `/sector/results` |
| `SectorClearances.tsx` | `/sector/clearances` |
| `SectorInbox.tsx` | `/sector/inbox` |
| `SectorNotifications.tsx` | `/sector/notifications` |

---

## 7. نماذج الاختبارات (Test Forms) — 32 كود

### الخرسانة (Concrete)
| الكود | المكوّن | الملف |
|---|---|---|
| `CONC_CUBE` | ConcreteCubes | `tests/ConcreteCubes.tsx` |
| `CONC_CORE` | ConcreteCore | `tests/ConcreteCore.tsx` |
| `CONC_BLOCK` | ConcreteBlocks | `tests/ConcreteBlocks.tsx` |
| `CONC_INTERLOCK` | Interlock | `tests/Interlock.tsx` |
| `CONC_FOAM` | ConcreteFoam | `tests/ConcreteFoam.tsx` |
| `CONC_FOAM_DENSITY` | ConcreteFoam | `tests/ConcreteFoam.tsx` |
| `CEM_SETTING_TIME` | CementSettingTime | `tests/CementSettingTime.tsx` |
| `CONC_MORTAR_SAND` | SieveAnalysis | `tests/SieveAnalysis.tsx` |
| `CONC_BEAM_SMALL` | ConcreteBeam | `tests/ConcreteBeam.tsx` |
| `CONC_BEAM_LARGE` | ConcreteBeam | `tests/ConcreteBeam.tsx` |

### التربة (Soil)
| الكود | المكوّن | الملف |
|---|---|---|
| `SOIL_SIEVE` | SieveAnalysis | `tests/SieveAnalysis.tsx` |
| `SOIL_ATTERBERG` | SoilAtterberg | `tests/SoilAtterberg.tsx` |
| `SOIL_PROCTOR` | SoilProctor | `tests/SoilProctor.tsx` |
| `SOIL_CBR` | SoilCBR | `tests/SoilCBR.tsx` |
| `SOIL_FIELD_DENSITY` | SoilFieldDensity | `tests/SoilFieldDensity.tsx` |

### الحديد (Steel)
| الكود | المكوّن | الملف |
|---|---|---|
| `STEEL_REBAR` | SteelRebar | `tests/SteelRebar.tsx` |
| `STEEL_BEND` | SteelBendRebend | `tests/SteelBendRebend.tsx` |
| `STEEL_REBEND` | SteelBendRebend | `tests/SteelBendRebend.tsx` |
| `STEEL_ANCHOR` | SteelAnchorBolt | `tests/SteelAnchorBolt.tsx` |
| `STEEL_STRUCTURAL` | SteelStructural | `tests/SteelStructural.tsx` |

### الأسفلت (Asphalt)
| الكود | المكوّن | الملف |
|---|---|---|
| `ASPH_HOTBIN` | AsphaltHotBin | `tests/AsphaltHotBin.tsx` |
| `ASPH_BITUMEN_EXTRACT` | AsphaltBitumenExtraction | `tests/AsphaltBitumenExtraction.tsx` |
| `ASPH_EXTRACTED_SIEVE` | AsphaltExtractedSieve | `tests/AsphaltExtractedSieve.tsx` |
| `ASPH_MARSHALL` | AsphaltMarshall | `tests/AsphaltMarshall.tsx` |
| `ASPH_MARSHALL_DENSITY` | AsphaltMarshall | `tests/AsphaltMarshall.tsx` |
| `ASPH_CORE` | AsphaltCore | `tests/AsphaltCore.tsx` |

### الركام (Aggregate)
| الكود | المكوّن | الملف |
|---|---|---|
| `AGG_SIEVE` | SieveAnalysis | `tests/SieveAnalysis.tsx` |
| `AGG_SG` | AggSpecificGravity | `tests/AggSpecificGravity.tsx` |
| `AGG_FLAKINESS_ELONGATION` | AggShapeIndex | `tests/AggShapeIndex.tsx` |
| `AGG_CRUSHING` | AggCrushingImpact | `tests/AggCrushingImpact.tsx` |
| `AGG_IMPACT` | AggCrushingImpact | `tests/AggCrushingImpact.tsx` |
| `AGG_LA` | AggLAAbrasion | `tests/AggLAAbrasion.tsx` |

---

## 8. الملفات الرئيسية (Key Files)

| الملف | الوصف |
|---|---|
| `drizzle/schema.ts` | تعريف جميع الجداول |
| `server/routers.ts` | جميع tRPC procedures (~2900 سطر) |
| `server/db.ts` | دوال قاعدة البيانات |
| `client/src/App.tsx` | Routes الرئيسية |
| `client/src/components/DashboardLayout.tsx` | الـ sidebar + navigation |
| `client/src/contexts/LanguageContext.tsx` | دعم اللغتين (ar/en) |
| `client/src/lib/pdf.ts` | `generatePdfFromElement()` للطباعة |
| `server/_core/notification.ts` | `notifyOwner()` helper |
| `server/storage.ts` | `storagePut()` / `storageGet()` لـ S3 |

---

## 9. الميزات المكتملة ✅

- **الاستقبال:** إنشاء عينة + أوردر متعدد الاختبارات مع checkboxes
- **التوزيع:** توزيع أوردر كامل على فني واحد دفعة واحدة
- **الفني:** عرض أوردرات مجمّعة مع progress indicator
- **مراجعة المشرف:** مراجعة الأوردر الكامل
- **مراجعة QC:** مراجعة ضبط الجودة
- **الإخلاء:** طلبات الإخلاء + إصدار شهادات
- **أرشيف الإخلاء:** عرض وبحث في الشهادات القديمة
- **التقرير الموحد:** `/order-report/:orderId` — ثنائي اللغة، قابل للطباعة
- **تقارير الاختبارات:** تقرير لكل اختبار + تقرير دفعة الطابوق
- **نظام الإشعارات:** إشعارات تلقائية في كل خطوة + NotificationBell في الـ header
- **إدارة المستخدمين:** CRUD + صلاحيات مفصّلة
- **إدارة أنواع الاختبارات:** CRUD
- **الإحصائيات والتحليلات:** Analytics page
- **لوحتا التحكم:** Admin + Supervisor dashboards
- **بوابة القطاعات:** تسجيل دخول منفصل + عرض النتائج والإخلاءات
- **نظام Batch:** توزيع دفعة طابوق مجمّعة + تقرير موحد
- **كيوبات الخرسانة:** مجموعات عمر + withinSpec يدوي + nominalCubeSize + تقرير كامل
- **كور الخرسانة:** حساب L/D + C/F + Density + endCondition
- **سجل التدقيق:** تتبع كل تغيير في النظام

---

## 10. المهام المعلّقة (Pending Tasks)

### أولوية عالية — اختبارات
- [ ] **نسب القبول الصحيحة للكيوبات حسب العمر الفعلي:**
  - تحديث `getRequiredStrength` في `ConcreteTest.tsx` و`ConcreteReport.tsx`
  - النسب: 1d=16%, 3d=40-45%, 7d=65-70%, 14d=90%, 28d=99-100%, 56d+=105-120%
  - إضافة عمود Age (days) يحسب تلقائياً من `castingDate + testedAt`

### أولوية متوسطة — اختبارات
- [ ] مراجعة معادلات وحدود القبول لكل اختبار (32 اختبار)
- [ ] التحقق من صحة `formData` المحفوظ لكل اختبار

### أولوية متوسطة — إدارية
- [ ] **تقرير الأداء الشهري:** عدد العينات، متوسط وقت الإنجاز، نسبة النجاح/الفشل
- [ ] **إدارة الشركات والمقاولين:** تحسين واجهة البحث والتصفية
- [ ] **نظام الأرشفة:** أرشفة الطلبات القديمة وإمكانية البحث فيها

### أولوية منخفضة
- [ ] إضافة شعار المختبر ورأس الصفحة في التقرير الموحد
- [ ] تحسين قسم التوقيعات في التقارير

---

## 11. أنماط الكود المتكررة (Patterns)

### إضافة procedure جديد في routers.ts
```ts
// داخل الـ router المناسب:
newProcedure: protectedProcedure
  .input(z.object({ id: z.number() }))
  .query(async ({ input, ctx }) => {
    return await getSomethingById(input.id);
  }),
```

### إرسال إشعار
```ts
import { notifyUsersByRole } from "./db";
await notifyUsersByRole("lab_manager", {
  title: "عنوان الإشعار",
  message: "نص الإشعار",
  type: "action_required",
  sampleId: sampleId,
});
```

### استخدام التقرير الموحد
```ts
// فتح التقرير الموحد للأوردر في تبويب جديد
window.open(`/order-report/${orderId}`, "_blank");
```

### استخدام اللغة في الصفحات
```ts
import { useLanguage } from "@/contexts/LanguageContext";
const { language, t } = useLanguage();
const isAr = language === "ar";
```

### طباعة تقرير
```ts
import { generatePdfFromElement } from "@/lib/pdf";
const element = document.getElementById("report-content");
await generatePdfFromElement(element, "report-name.pdf");
```

---

## 12. ملاحظات تقنية مهمة

- **الأوردر vs التوزيع:** النظام الجديد يعمل على مستوى `labOrders` (أوردر واحد = عينة واحدة + اختبارات متعددة). كل اختبار هو `labOrderItem` مرتبط بـ `distribution`.
- **التقارير:** التقارير الفردية تستخدم `distributionId`، التقرير الموحد يستخدم `orderId`.
- **الخرسانة:** تستخدم جداول `concreteTestGroups` + `concreteCubes` بدلاً من `specializedTestResults`.
- **باقي الاختبارات:** تستخدم `specializedTestResults` مع `formData` (JSON).
- **الأخطاء الموجودة مسبقاً:** أخطاء TypeScript في السطور 118-120 من routers.ts (bcryptjs, shared/const) موجودة قبل تغييراتنا ولا تؤثر على عمل السيرفر.
- **S3:** جميع الملفات تُرفع عبر `storagePut()` في `server/storage.ts`.
- **التوقيت:** جميع التواريخ مخزّنة كـ UTC timestamps.
