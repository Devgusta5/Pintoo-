import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    strictPort: true,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Configurações de build
    target: "esnext",
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false, // Desabilita sourcemaps em produção
    minify: "terser", // Usa Terser para minificação
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs em produção
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Separa vendors em chunks diferentes
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('@supabase') || id.includes('framer-motion')) {
              return 'vendor';
            }
            if (id.includes('@radix-ui') || id.includes('class-variance-authority') || id.includes('clsx')) {
              return 'ui';
            }
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
}));
