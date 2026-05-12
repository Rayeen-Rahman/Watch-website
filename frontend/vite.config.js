import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy /api calls → backend (safety net if VITE_API_URL is missing)
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // Proxy /uploads → backend so images load from the same Vite origin,
      // bypassing any CORS / Cross-Origin-Resource-Policy issues entirely.
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
