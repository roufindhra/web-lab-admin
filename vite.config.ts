import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    host: true, // listen di 0.0.0.0 supaya bisa diakses dari LAN
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:8000',
    },
  },
})
