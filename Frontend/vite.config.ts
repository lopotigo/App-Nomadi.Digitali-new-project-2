import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // durante lo sviluppo inoltra le richieste /api al backend locale
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  // se in futuro usi un base path diverso (es. deploy su subpath), impostalo qui:
  // base: '/',
})