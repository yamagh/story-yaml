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
    deps: {
      inline: [
        /@testing-library\/react/,
        './src/web/view/components/ConfirmDialog.tsx',
        './src/web/view/components/ParentInfoCard.tsx',
        './src/web/view/components/ChildrenList.tsx',
        './src/web/view/components/ItemProperties.tsx',
        './src/web/view/components/Badge.tsx',
      ],
    },
  },
});