import mysql from 'mysql2/promise';
import { config } from 'dotenv';
config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

try {
  // إضافة طلب براءة ذمة في مرحلة "payment_pending" - جاهز لاختبار إصدار أمر الدفع
  await conn.execute(
    `INSERT IGNORE INTO clearance_requests 
     (id, requestCode, contractId, contractorId, contractNumber, contractName, contractorName, 
      requestedById, totalTests, passedTests, failedTests, pendingTests, totalAmount, 
      \`status\`, notes, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      60001, 'CLR-2026-T001', 40001, 50001, 
      'DOI-2025-T001', 'مشروع تطوير البنية التحتية - الدفعة الأولى', 'شركة الإنشاءات المتحدة',
      990792, // requestedById (reception)
      6, 5, 1, 0, // totalTests, passedTests, failedTests, pendingTests
      2460.00, // totalAmount (450+450+200+540+120+750 - but one failed)
      'payment_pending',
      'طلب براءة ذمة تجريبي - جاهز لإصدار أمر الدفع'
    ]
  );
  console.log('Inserted clearance request 60001 (payment_pending)');

  // إضافة طلب براءة ذمة ثانٍ في مرحلة "submitted" - جاهز لمراجعة QC
  await conn.execute(
    `INSERT IGNORE INTO clearance_requests 
     (id, requestCode, contractId, contractorId, contractNumber, contractName, contractorName, 
      requestedById, totalTests, passedTests, failedTests, pendingTests, totalAmount, 
      paymentOrderNumber, paymentOrderDate, paymentOrderIssuedById,
      \`status\`, notes, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL 5 DAY), NOW())`,
    [
      60002, 'CLR-2026-T002', 40001, 50001,
      'DOI-2025-T001', 'مشروع تطوير البنية التحتية - الدفعة الأولى', 'شركة الإنشاءات المتحدة',
      990792,
      4, 4, 0, 0,
      1310.00,
      'PO-2026-0042', new Date(Date.now() - 4 * 24 * 3600 * 1000), 990797, // accountant
      'submitted',
      'طلب براءة ذمة تجريبي - مقدم لمراجعة QC'
    ]
  );
  console.log('Inserted clearance request 60002 (submitted)');

  console.log('Done!');
} catch (err) {
  console.error('Error:', err.message);
} finally {
  await conn.end();
}
