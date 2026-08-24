// File: vite.config.js
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  // تحميل متغيرات البيئة من ملفات .env لضمان قرائتها في الـ Build
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.pathname.startsWith('/api'),
              handler: 'NetworkOnly',
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
    // المسار المعتمد على GitHub Pages
    base: '/IbnAlZumar-Frontend/',
    define: {
      // ضمان تمرير VITE_GOOGLE_CLIENT_ID أثناء الـ Build حتى لو لم يقرأ الـ CI المتغير تلقائياً
      'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(
        env.VITE_GOOGLE_CLIENT_ID || '907304137172-h5o0a0qjcmp9is84rqgv17odgmovao0c.apps.googleusercontent.com'
      ),
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'https://ibnalzumar-api-bub8fyaceheggxec.southafricanorth-01.azurewebsites.net',
          changeOrigin: true,
          secure: true,
        },
        '/uploads': {
          target: 'https://ibnalzumar-api-bub8fyaceheggxec.southafricanorth-01.azurewebsites.net',
          changeOrigin: true,
          secure: true,
        },
      },
    },
  }
})