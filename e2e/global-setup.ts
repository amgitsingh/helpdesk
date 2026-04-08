import { execSync } from 'child_process';
import path from 'path';

const serverDir = path.resolve(__dirname, '../server');

export default async function globalSetup() {
  const databaseUrl = process.env.TEST_DATABASE_URL;
  if (!databaseUrl) throw new Error('TEST_DATABASE_URL is not set in .env.test');

  const seedEmail = process.env.TEST_SEED_EMAIL;
  const seedPassword = process.env.TEST_SEED_PASSWORD;
  if (!seedEmail || !seedPassword) {
    throw new Error('TEST_SEED_EMAIL and TEST_SEED_PASSWORD must be set in .env.test');
  }

  // Reset the test database and apply all migrations from scratch
  execSync('npx prisma migrate reset --force', {
    cwd: serverDir,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
  });

  // Seed the test admin user
  execSync('npm run seed', {
    cwd: serverDir,
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      SEED_EMAIL: seedEmail,
      SEED_PASSWORD: seedPassword,
      SEED_NAME: process.env.TEST_SEED_NAME ?? 'Test Admin',
    },
    stdio: 'inherit',
  });
}
