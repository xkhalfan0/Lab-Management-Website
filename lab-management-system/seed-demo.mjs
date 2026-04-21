import mysql from 'mysql2/promise';
import { config } from 'dotenv';
config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

try {
  // نتائج الاختبارات
  const results = [
    { id: 90001, distId: 80001, sampleId: 70001, vals: '[32.5, 33.1, 31.8]', unit: 'MPa', avg: 32.467, std: 0.533, min: 31.800, max: 33.100, pct: 129.87, comp: 'pass', status: 'approved', daysAgo: 32 },
    { id: 90002, distId: 80002, sampleId: 70002, vals: '[15.2, 14.8, 16.1]', unit: 'MPa', avg: 15.367, std: 0.553, min: 14.800, max: 16.100, pct: 61.47, comp: 'fail', status: 'approved', daysAgo: 17 },
    { id: 90003, distId: 80003, sampleId: 70003, vals: '[18.5]', unit: 'kN/m3', avg: 18.500, std: 0.000, min: 18.500, max: 18.500, pct: null, comp: 'pass', status: 'approved', daysAgo: 22 },
    { id: 90004, distId: 80004, sampleId: 70004, vals: '[545.0, 552.0, 538.0]', unit: 'MPa', avg: 545.000, std: 5.715, min: 538.000, max: 552.000, pct: 109.00, comp: 'pass', status: 'approved', daysAgo: 15 },
    { id: 90005, distId: 80005, sampleId: 70005, vals: '[98.5]', unit: '%', avg: 98.500, std: 0.000, min: 98.500, max: 98.500, pct: null, comp: 'pass', status: 'approved', daysAgo: 8 },
    { id: 90006, distId: 80006, sampleId: 70006, vals: '[8.5, 8.8, 8.3]', unit: 'kN', avg: 8.533, std: 0.208, min: 8.300, max: 8.800, pct: null, comp: 'pass', status: 'processed', daysAgo: 6 },
  ];

  for (const r of results) {
    const processedAt = new Date(Date.now() - r.daysAgo * 24 * 3600 * 1000);
    const createdAt = new Date(Date.now() - (r.daysAgo + 1) * 24 * 3600 * 1000);
    await conn.execute(
      'INSERT IGNORE INTO test_results (id, distributionId, sampleId, technicianId, rawValues, unit, average, stdDeviation, percentage, `minValue`, `maxValue`, complianceStatus, `status`, processedAt, createdAt, updatedAt) VALUES (?, ?, ?, 990794, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
      [r.id, r.distId, r.sampleId, r.vals, r.unit, r.avg, r.std, r.pct, r.min, r.max, r.comp, r.status, processedAt, createdAt]
    );
    console.log(`Inserted test_result ${r.id}`);
  }

  // إضافة سجلات المراجعة للعينات المعتمدة
  const reviews = [
    { id: 95001, testResultId: 90001, sampleId: 70001, reviewerId: 990795, type: 'manager_review', decision: 'approved' },
    { id: 95002, testResultId: 90001, sampleId: 70001, reviewerId: 990796, type: 'qc_review', decision: 'approved' },
    { id: 95003, testResultId: 90002, sampleId: 70002, reviewerId: 990795, type: 'manager_review', decision: 'approved' },
    { id: 95004, testResultId: 90002, sampleId: 70002, reviewerId: 990796, type: 'qc_review', decision: 'approved' },
    { id: 95005, testResultId: 90003, sampleId: 70003, reviewerId: 990795, type: 'manager_review', decision: 'approved' },
    { id: 95006, testResultId: 90003, sampleId: 70003, reviewerId: 990796, type: 'qc_review', decision: 'approved' },
    { id: 95007, testResultId: 90004, sampleId: 70004, reviewerId: 990795, type: 'manager_review', decision: 'approved' },
    { id: 95008, testResultId: 90004, sampleId: 70004, reviewerId: 990796, type: 'qc_review', decision: 'approved' },
  ];

  for (const rv of reviews) {
    await conn.execute(
      `INSERT IGNORE INTO reviews (id, testResultId, sampleId, reviewerId, reviewType, decision, reviewedAt, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [rv.id, rv.testResultId, rv.sampleId, rv.reviewerId, rv.type, rv.decision]
    );
    console.log(`Inserted review ${rv.id}`);
  }

  // إضافة طلب براءة ذمة للعقد
  // فحص هيكل جدول clearance_requests
  const [cols] = await conn.execute("DESCRIBE clearance_requests");
  console.log('clearance_requests columns:', cols.map(c => c.Field));

  console.log('Done!');
} catch (err) {
  console.error('Error:', err.message);
} finally {
  await conn.end();
}
