import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const repoBase = '/kid_typing_game/'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? repoBase : '/',
})
