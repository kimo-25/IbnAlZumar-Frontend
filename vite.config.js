import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/', 
  server: {
    port: 5173,
    proxy: {
      '/api': {
        // حطينا لينك Railway هنا
        target: 'https://ibn-al-zumar-backend-production-f3dc.up.railway.app',
        changeOrigin: true,
        secure: true, // يفضل تكون true للـ Production
      },
      '/uploads': {
        // وهنا كمان
        target: 'https://ibn-al-zumar-backend-production-f3dc.up.railway.app',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})