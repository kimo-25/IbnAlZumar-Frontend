import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/IbnAlZumar-Frontend/', // <--- السطر ده هو الأساس اللي بيمنع خطأ الـ 404
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://localhost:7223',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'https://localhost:7223',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})