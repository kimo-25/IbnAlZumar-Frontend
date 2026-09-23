// File: vite.config.js
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const DEFAULT_API_ORIGIN = 'https://ibnal-ibnalzumar-api-ddf9h3cdafc6bxat.francecentral-01.azurewebsites.net'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const API_URL = env.VITE_API_URL || env.VITE_API_BASE_URL || DEFAULT_API_ORIGIN

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          // تغيير hash لملفات البناء يجعل العملاء يتخلّصون من النسخ القديمة.
          cleanupOutdatedCaches: true,
          globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
          runtimeCaching: [
            {
              // يشمل Azure API حتى لو كان المسار لا يبدأ بـ /api على نفس origin.
              urlPattern: ({ url }) => url.origin === new URL(API_URL).origin && url.pathname.includes('/api'),
              handler: 'NetworkOnly',
              options: {
                cacheName: 'api-network-only',
                expiration: { maxEntries: 0 },
              },
            },
          ],
        },
        manifest: {
          name: 'ابن الزمر',
          short_name: 'IbnAlZumar',
          start_url: '/IbnAlZumar-Frontend/',
          scope: '/IbnAlZumar-Frontend/',
          display: 'standalone',
          background_color: '#F4F5F7',
          theme_color: '#F2A900',
        },
      }),
    ],
    base: '/IbnAlZumar-Frontend/',
    define: {
      'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(
        env.VITE_GOOGLE_CLIENT_ID || '907304137172-h5o0a0qjcmp9is84rqgv17odgmovao0c.apps.googleusercontent.com',
      ),
    },
    server: {
      port: 5173,
      proxy: {
        '/api': { target: API_URL, changeOrigin: true, secure: true },
        '/uploads': { target: API_URL, changeOrigin: true, secure: true },
      },
    },
  }
})
