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