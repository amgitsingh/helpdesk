import 'dotenv/config'; // must be first — loads env before any other module reads process.env
import app from './app';

const requiredEnv = ['BETTER_AUTH_SECRET', 'BETTER_AUTH_URL', 'DATABASE_URL', 'CLIENT_URL'];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}
if (process.env.BETTER_AUTH_SECRET!.length < 32) {
  console.error('BETTER_AUTH_SECRET must be at least 32 characters');
  process.exit(1);
}

const PORT = process.env.PORT ?? 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
