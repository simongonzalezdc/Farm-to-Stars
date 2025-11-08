import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    exclude: ['tests/**', 'node_modules/**'],
    coverage: {
      reporter: ['text', 'html']
    }
  }
});
