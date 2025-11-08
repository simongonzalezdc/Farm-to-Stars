import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'generateSW',
      manifest: false,
      includeAssets: ['icons/icon.svg'],
      workbox: {
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true
      },
      devOptions: {
        enabled: true,
        suppressWarnings: true,
        navigateFallback: 'index.html'
      }
    })
  ],
  server: { port: 5173 }
});
