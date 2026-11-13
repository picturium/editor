import { defineConfig } from 'vite';

// Built as a plain entry rather than in lib mode: lib mode inlines every asset,
// which would put all font subsets into the stylesheet as base64.
export default defineConfig({
  // relative asset URLs, so dist/ works from any directory or CDN path
  base: './',
  build: {
    cssCodeSplit: false,
    rollupOptions: {
      input: 'src/index.tsx',
      preserveEntrySignatures: 'strict',
      output: {
        format: 'es',
        entryFileNames: 'picturium-editor.js',
        assetFileNames: (asset) => (asset.names?.[0]?.endsWith('.css') ? 'picturium-editor.css' : 'assets/[name][extname]'),
      },
    },
  },
});
