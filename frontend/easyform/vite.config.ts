import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // During `npm run dev`, forward all /api/* requests to the FastAPI backend.
      // This means VITE_API_URL can be left empty in .env for both dev and production.
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
