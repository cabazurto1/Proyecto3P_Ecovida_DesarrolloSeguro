import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,       // Puerto que deseas usar
    strictPort: true, // Si el puerto está ocupado, no busca otro, sino que falla
    proxy: {
      '/api/fruit': {
        target: 'https://www.fruityvice.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/fruit/, '/api/fruit')
      }
    }
  }
})
