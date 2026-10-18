import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  publicDir: mode === 'preview' ? '.preview-public' : 'public',
  server: { proxy: { '/api': 'http://127.0.0.1:3001' } },
  plugins: [react()],
}))
