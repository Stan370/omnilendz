import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    // Suppress warnings during build
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress unused parameter warnings
        if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return;
        if (warning.code === 'UNRESOLVED_IMPORT') return;
        warn(warning);
      }
    }
  },
  esbuild: {
    // Suppress specific warnings
    logOverride: {
      'this-is-undefined-in-esm': 'silent'
    }
  }
});
