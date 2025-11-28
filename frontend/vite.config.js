import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // <= DODATO OVDJE
  ],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      'react-i18next': '/src/lib/react-i18next-stub.jsx',
      i18next: '/src/lib/i18next-stub.js',
    },
  },
})
