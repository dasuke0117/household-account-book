import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages（https://<ユーザー名>.github.io/household-account-book/）で公開するためのパス
  base: '/household-account-book/',
  plugins: [
    react(),
    VitePWA({
      // 新しいバージョンを公開したら、次に開いたときに自動で更新する
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: '無駄遣いストッパー家計簿',
        short_name: '家計簿',
        description: '無駄遣いを防ぐための家計簿アプリ',
        lang: 'ja',
        display: 'standalone',
        theme_color: '#16a34a',
        background_color: '#ffffff',
        start_url: '/household-account-book/',
        scope: '/household-account-book/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
