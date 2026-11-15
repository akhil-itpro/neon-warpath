import { defineConfig } from 'vite';

// base './' so the built game works from any folder (itch.io zip, Electron/Tauri wrapper, file host).
export default defineConfig({
  base: './',
  server: { port: 5173, strictPort: true },
  build: { chunkSizeWarningLimit: 2000 },
});
