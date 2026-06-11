import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Відносні шляхи: працює і на psychoprogram.com, і на <owner>.github.io/psycho_program/
  base: './',
  plugins: [react()],
})
