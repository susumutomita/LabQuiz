import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: {
      '@content': path.resolve(__dirname, '../content'),
    },
  },
  server: {
    fs: {
      allow: [path.resolve(__dirname, '..')],
    },
  },
  build: {
    // Single file output for GAS HtmlService
    assetsInlineLimit: Infinity,
  },
})
