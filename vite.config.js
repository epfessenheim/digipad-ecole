import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/digipad-ecole/',  // ← IMPORTANT : nom de ton futur dépôt GitHub
})
