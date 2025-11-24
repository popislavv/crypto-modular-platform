import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // <= DODATO OVDJE
  ],
  resolve: {
    alias: {
      i18next: path.resolve(__dirname, 'src/shims/i18next.js'),
      'react-i18next': path.resolve(__dirname, 'src/shims/react-i18next.js'),
    },
  },
})
