import mysql from 'mysql2/promise';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL not set'); process.exit(1); }

const conn = await mysql.createConnection(url);

// 1. Create lab_orders table
try {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS lab_order_items (
      id int AUTO_INCREMENT NOT NULL,
      orderId int NOT NULL,
      distributionId int,
      testTypeId int NOT NULL,
      testTypeCode varchar(64) NOT NULL,
      testTypeName varchar(256) NOT NULL,
      formTemplate varchar(64),
      testSubType varchar(64),
      quantity int NOT NULL DEFAULT 1,
      unitPrice decimal(10,2) DEFAULT '0',
      status enum('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
      completedAt timestamp,
      createdAt timestamp NOT NULL DEFAULT (now()),
      updatedAt timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT lab_order_items_id PRIMARY KEY(id)
    )
  `);
  console.log('✅ lab_order_items table created');
} catch (e) {
  console.log('⚠️ lab_order_items:', e.message);
}

try {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS lab_orders (
      id int AUTO_INCREMENT NOT NULL,
      orderCode varchar(32) NOT NULL,
      sampleId int NOT NULL,
      contractNumber varchar(128),
      contractName varchar(512),
      contractorName varchar(256),
      sampleType varchar(64),
      location varchar(256),
      castingDate timestamp,
      notes text,
      createdById int NOT NULL,
      distributedById int,
      distributedAt timestamp,
      assignedTechnicianId int,
      priority enum('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
      status enum('pending','distributed','in_progress','completed','reviewed','qc_passed','rejected') NOT NULL DEFAULT 'pending',
      completedAt timestamp,
      createdAt timestamp NOT NULL DEFAULT (now()),
      updatedAt timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT lab_orders_id PRIMARY KEY(id),
      CONSTRAINT lab_orders_orderCode_unique UNIQUE(orderCode)
    )
  `);
  console.log('✅ lab_orders table created');
} catch (e) {
  console.log('⚠️ lab_orders:', e.message);
}

// 2. Delete old sample/test data (keep contractors, contracts, sectors, users, test_types)
const deleteTables = [
  'concrete_cubes',
  'concrete_test_groups',
  'specialized_test_results',
  'test_results',
  'reviews',
  'attachments',
  'notifications',
  'sample_history',
  'distributions',
  'lab_order_items',
  'lab_orders',
  'certificates',
  'samples',
];

for (const table of deleteTables) {
  try {
    await conn.execute(`DELETE FROM \`${table}\``);
    console.log(`🗑️  Cleared: ${table}`);
  } catch (e) {
    console.log(`⚠️ Skip ${table}: ${e.message}`);
  }
}

// Reset auto-increment
for (const table of deleteTables) {
  try {
    await conn.execute(`ALTER TABLE \`${table}\` AUTO_INCREMENT = 1`);
  } catch (e) { /* ignore */ }
}

console.log('\n✅ Migration complete! Tables created and old data cleared.');
await conn.end();
