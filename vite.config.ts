import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/events': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        ws: true, //allow SSE traffic
        headers: {
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive'
        }
      }
    }
  }
})
