import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  build: {
    // Split large vendor bundles for faster page loads on mobile
    // NOTE: Vite 8 uses Rolldown which requires manualChunks as a function
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/recharts') ||
              id.includes('node_modules/d3-') ||
              id.includes('node_modules/victory-')) {
            return 'vendor-charts';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          if (id.includes('node_modules/react-dom') ||
              id.includes('node_modules/react-router') ||
              id.includes('node_modules/react/')) {
            return 'vendor-react';
          }
        },
      },
    },
    // Warn if any chunk exceeds 500 KB
    chunkSizeWarningLimit: 500,
  },

  server: {
    proxy: {
      // Proxy /api calls → backend (safety net if VITE_API_URL is missing)
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // Proxy /uploads → backend so images load from the same Vite origin
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
