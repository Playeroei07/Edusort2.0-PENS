import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, '../backend/dist'),
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    proxy: {
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
      }
    }
  }
})
