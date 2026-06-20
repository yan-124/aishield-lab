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
        target: 'https://api.coze.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/coze/, ''),
      },
    },
  },
  build: {
    outDir: 'dist3',
    emptyOutDir: true,
  },
})
