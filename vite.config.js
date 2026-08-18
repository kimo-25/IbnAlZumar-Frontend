import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // Cache the app shell so it loads offline at all.
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        // Don't let the service worker cache your API calls —
        // Dexie is your offline data layer, not the SW cache.
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
        display: 'standalone',
        background_color: '#F4F5F7',
        theme_color: '#F2A900',
      },
    }),
  ],
  // مسار الريبو بتاعك على GitHub Pages
  base: '/IbnAlZumar-Frontend/',
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
})