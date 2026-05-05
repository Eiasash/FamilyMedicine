import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages: https://eiasash.github.io/FamilyMedicine/
  base: '/FamilyMedicine/',

  server: {
    port: 3737,
    open: '/mishpacha-mega.html',
  },

  build: {
    rollupOptions: {
      input: 'mishpacha-mega.html',
    },
    outDir: 'dist',
    emptyOutDir: true,
  },

  // Disable default publicDir — build script copies static assets
  publicDir: false,

  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: ['src/**/*.js'],
      exclude: ['**/node_modules/**', '**/dist/**', 'tests/**', 'shared/**'],
    },
  },
});
