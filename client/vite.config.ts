import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    pool: 'vmThreads',
  },
  server: {
    port: Number(process.env.CLIENT_PORT ?? 5173),
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.API_PORT ?? 5000}`,
        changeOrigin: true,
      },
    },
  },
});
