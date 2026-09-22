import react from '@vitejs/plugin-react';
import { pwacnOffline } from '@pwacn/offline';
import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
export default defineConfig({
  plugins: [react(), pwacnOffline()],
  resolve: {
    alias: [
      {
        find: '@pwacn/core',
        replacement: fileURLToPath(
          new URL('../../packages/core/src/index.ts', import.meta.url),
        ),
      },
      {
        find: '@pwacn/react',
        replacement: fileURLToPath(
          new URL('../../packages/react/src/index.ts', import.meta.url),
        ),
      },
      {
        find: /^react\/jsx-runtime$/,
        replacement: fileURLToPath(
          new URL('./node_modules/react/jsx-runtime.js', import.meta.url),
        ),
      },
      {
        find: /^react$/,
        replacement: fileURLToPath(
          new URL('./node_modules/react/index.js', import.meta.url),
        ),
      },
    ],
  },
});
