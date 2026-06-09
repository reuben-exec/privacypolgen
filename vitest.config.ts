// vitest.config.ts
// Unit-test configuration. Mirrors the @/ alias from tsconfig.json.
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    // generator.ts is a pure module with no shared state, so parallel runs
    // are safe. Keep isolation per-file just in case future tests add
    // mocks/spies.
    isolate: true,
  },
});
