import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// In dev we proxy `/v1` to the platform so the browser talks to the dev server
// same-origin. The backend session cookie is `SameSite=Lax`, which browsers do
// not send/store on cross-site XHR; proxying keeps it first-party and rewrites
// its domain to localhost. Point `VITE_DEV_API_TARGET` at the platform you want
// (defaults to prod) and set `VITE_API_BASE_URL=` (empty) so the client uses
// the relative `/v1` path.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_DEV_API_TARGET || 'https://api.mov-eat.app';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/v1': {
          target,
          changeOrigin: true,
          secure: true,
          cookieDomainRewrite: 'localhost',
        },
      },
    },
  };
});
