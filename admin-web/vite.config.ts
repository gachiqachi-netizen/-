import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/admin/',
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8801'
    }
  },
  build: {
    outDir: '../server/static/admin',
    emptyOutDir: false,
    rollupOptions: {
      input: 'src/main.tsx',
      output: {
        entryFileNames: 'shadcn-admin.js',
        chunkFileNames: 'shadcn-chunk-[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'shadcn-admin.css';
          }
          return 'assets/[name][extname]';
        }
      }
    }
  }
});
