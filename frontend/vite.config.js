import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',   // Important for Electron file:// protocol
  server: {
    port: 5173,
    host: 'localhost'
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})
