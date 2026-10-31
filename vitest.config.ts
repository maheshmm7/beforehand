import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./vitest.setup.ts'],
    include: ['{src,shared,server,api}/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'lcov'],
      include: ['src/**/*.{ts,tsx}', 'shared/**/*.ts', 'server/**/*.ts', 'api/**/*.ts'],
      exclude: [
        '**/*.test.{ts,tsx}',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/testing/**',
        'server/dev.ts',
        '**/types.ts',
      ],
      // Set just under what the suite actually reaches, so a change that
      // drops coverage fails here rather than being noticed later.
      thresholds: {
        statements: 97,
        branches: 92,
        functions: 96,
        lines: 97,
      },
    },
  },
});
