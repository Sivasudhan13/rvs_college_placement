import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],

    server: {
      port: 5173,
      proxy: mode === 'development'
        ? {
            // In dev: proxy /api → localhost:5000 (same-origin, no CORS)
            '/api': {
              target: 'http://localhost:5000',
              changeOrigin: true,
              secure: false,
            },
          }
        : undefined,
    },

    build: {
      // Warn only above 1 MB (Monaco editor is large)
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          // Split large vendor chunks so Vercel serves them faster
          // Vite 8 (Rolldown) requires manualChunks as a function
          manualChunks(id) {
            if (id.includes('@monaco-editor') || id.includes('monaco-editor')) {
              return 'vendor-monaco';
            }
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'vendor-charts';
            }
            if (id.includes('react-router-dom') || id.includes('react-router/')) {
              return 'vendor-router';
            }
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
              return 'vendor-react';
            }
            if (id.includes('node_modules/axios/')) {
              return 'vendor-axios';
            }
          },
        },
      },
    },

    define: {
      // Make current mode available as a global constant
      __APP_MODE__: JSON.stringify(mode),
    },
  }
})
