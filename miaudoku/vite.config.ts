import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

// "base: './'" faz o jogo funcionar em qualquer endereço (ex.: .../jogos-sem-anuncio/miaudoku/).
export default defineConfig({
  base: './',
  plugins: [
    // Vira "app": dá para pôr na Tela de Início e jogar sem internet
    // (o jogo inteiro, com todas as fases, fica guardado no aparelho no primeiro acesso).
    VitePWA({
      registerType: 'autoUpdate', // versão nova é baixada sozinha e vale na próxima vez que abrir
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'Miaudoku',
        short_name: 'Miaudoku',
        description: 'Cada gato no seu cantinho. Quebra-cabeça de lógica, sem anúncios.',
        lang: 'pt-BR',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        background_color: '#fbf6ee',
        theme_color: '#fbf6ee',
        icons: [
          { src: 'icone-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icone-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png}'],
        maximumFileSizeToCacheInBytes: 3_000_000,
      },
    }),
  ],
  test: {
    include: ['tests/**/*.test.ts'],
    testTimeout: 60000,
  },
});
