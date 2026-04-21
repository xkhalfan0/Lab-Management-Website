import { createConnection } from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config();

const conn = await createConnection(process.env.DATABASE_URL);
try {
  await conn.execute('ALTER TABLE `concrete_cubes` ADD COLUMN `withinSpec` boolean DEFAULT NULL');
  console.log('✓ Migration applied: withinSpec column added to concrete_cubes');
} catch (err) {
  if (err.code === 'ER_DUP_FIELDNAME') {
    console.log('Column already exists, skipping.');
  } else {
    throw err;
  }
} finally {
  await conn.end();
}
