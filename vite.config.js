import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'],
      manifest: {
        name: 'ウッドデッキ床板計算ツール',
        short_name: '床板計算',
        description: 'ウッドデッキ・木道施工用の床板幅調整計算ツール',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#f59e0b',
        orientation: 'portrait',
        lang: 'ja',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/_vercel/]
      }
    })
  ],
  server: {
    host: true,
    port: 3000
  }
})
