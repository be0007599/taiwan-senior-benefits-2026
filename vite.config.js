import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sites } from '@openai/sites-vite-plugin'

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/taiwan-senior-benefits-2026/' : '/',
  plugins: [react(), sites()],
  server: { host: '127.0.0.1' },
})
