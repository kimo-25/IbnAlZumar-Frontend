import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // مسار الريبو بتاعك على GitHub Pages
  base: '/IbnAlZumar-Frontend/',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://ibn-al-zumar-backend-production-f3dc.up.railway.app',
        changeOrigin: true,
        secure: true,
      },
      '/uploads': {
        target: 'https://ibn-al-zumar-backend-production-f3dc.up.railway.app',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})