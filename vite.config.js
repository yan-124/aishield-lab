import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  cacheDir: '.vite-cache-v2',
  server: {
    port: 5201,
    host: true,
    proxy: {
      '/api/coze': {
        target: 'https://092ba516.aishield-lab.pages.dev',
        changeOrigin: true,
        secure: true,
      },
      '/api/dashscope': {
        target: 'https://092ba516.aishield-lab.pages.dev',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    outDir: 'dist3',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three') || id.includes('@react-three')) {
              return 'three';
            }
            if (id.includes('pdfjs-dist')) {
              return 'pdf';
            }
            if (id.includes('@coze')) {
              return 'api';
            }
            if (id.includes('framer-motion')) {
              return 'motion';
            }
            return 'vendor';
          }
        },
      },
    },
    minify: 'terser',
    sourcemap: false,
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 1000,
  },
})
