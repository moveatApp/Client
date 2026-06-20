import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// In dev we proxy `/v1` to the platform so the browser talks to the dev server
// same-origin. The backend session cookie is `SameSite=Lax`, which browsers do
// not send/store on cross-site XHR; proxying keeps it first-party. We strip the
// cookie Domain (`cookieDomainRewrite: ''`) so it becomes host-only and works on
// any dev host — `localhost` and the LAN IP (phone testing over the same WiFi).
// Point `VITE_DEV_API_TARGET` at the platform you want (defaults to prod) and set
// `VITE_API_BASE_URL=` (empty) so the client uses the relative `/v1` path.
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
      // Bind on all interfaces so the dev server is reachable from other devices
      // on the same network (e.g. a phone at http://<lan-ip>:5173).
      host: true,
      proxy: {
        '/v1': {
          target,
          changeOrigin: true,
          secure: true,
          cookieDomainRewrite: '',
        },
        // Locally hosted media (exercise images) is served by the platform under /media.
        '/media': {
          target,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  };
});
