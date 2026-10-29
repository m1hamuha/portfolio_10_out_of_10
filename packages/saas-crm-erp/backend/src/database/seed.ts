/**
 * Demo data seeder.
 *
 * Creates a demo organization, an admin user and a few sample customers so a
 * fresh installation can be logged into right away (the API has no public
 * registration endpoint by design).
 *
 * Usage:
 *   npm run seed                # uses .env / environment variables
 *
 * Idempotent: running it twice will not duplicate data.
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { config as loadEnv } from 'dotenv';

loadEnv();

const DEMO_ORG_SLUG = 'demo';
const DEMO_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@demo.local';
const DEMO_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'Demo1234!';

async function main(): Promise<void> {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_DATABASE ?? 'crm_erp',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: process.env.NODE_ENV !== 'production',
  });

  await dataSource.initialize();

  try {
    // 1. Organization
    let org = await dataSource.query(
      'SELECT id FROM organizations WHERE slug = $1',
      [DEMO_ORG_SLUG],
    );
    if (org.length === 0) {
      org = await dataSource.query(
        `INSERT INTO organizations (name, slug, status, settings)
         VALUES ($1, $2, 'active', '{}') RETURNING id`,
        ['Demo Organization', DEMO_ORG_SLUG],
      );
      console.log('Created demo organization');
    } else {
      console.log('Demo organization already exists');
    }
    const orgId: string = org[0].id;

    // 2. Admin user
    const existingUser = await dataSource.query(
      'SELECT id FROM users WHERE email = $1',
      [DEMO_ADMIN_EMAIL],
    );
    if (existingUser.length === 0) {
      const passwordHash = await bcrypt.hash(DEMO_ADMIN_PASSWORD, 10);
      await dataSource.query(
        `INSERT INTO users
           (organization_id, email, password_hash, first_name, last_name, role, permissions, email_verified)
         VALUES ($1, $2, $3, 'Demo', 'Admin', 'admin', '[]', true)`,
        [orgId, DEMO_ADMIN_EMAIL, passwordHash],
      );
      console.log(`Created admin user ${DEMO_ADMIN_EMAIL}`);
    } else {
      console.log('Admin user already exists');
    }

    // 3. Sample customers
    const customerCount = await dataSource.query(
      'SELECT COUNT(*)::int AS count FROM customers WHERE organization_id = $1',
      [orgId],
    );
    if (customerCount[0].count === 0) {
      const samples: Array<[string, string, string]> = [
        ['Acme Corporation', 'contact@acme.example', 'active'],
        ['Globex Inc', 'hello@globex.example', 'lead'],
        ['Initech LLC', 'info@initech.example', 'active'],
      ];
      for (const [name, email, status] of samples) {
        await dataSource.query(
          `INSERT INTO customers (organization_id, name, email, status, metadata)
           VALUES ($1, $2, $3, $4, '{}')`,
          [orgId, name, email, status],
        );
      }
      console.log(`Created ${samples.length} sample customers`);
    } else {
      console.log('Sample customers already exist');
    }

    console.log('\nSeed complete. Login credentials:');
    console.log(`  email:    ${DEMO_ADMIN_EMAIL}`);
    console.log(`  password: ${DEMO_ADMIN_PASSWORD}`);
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
