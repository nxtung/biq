import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Tải các biến môi trường từ file .env.local
dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in the .env.local file');
}

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql', // Đây chính là 'dialect' bị thiếu
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});