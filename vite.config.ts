import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Шлях для GitHub Pages: https://<owner>.github.io/psycho_program/
  base: '/psycho_program/',
  plugins: [react()],
})
