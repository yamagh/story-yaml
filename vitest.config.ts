import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/web/view/**/*.test.ts', 'src/web/view/**/*.test.tsx', 'src/web/services/**/*.test.ts'],
    setupFiles: ['src/web/test/setup.ts'],
    watchOptions: {
      usePolling: true,
      interval: 100,
    },
  },
});