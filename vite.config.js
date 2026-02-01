import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  // So the build can be served from an arbitrary path
  base: "./",
  build: {
    rollupOptions: {
      output: {
        // Split scenerystack into its own chunk for better caching and to address chunk size warning
        manualChunks: (id) =>
          id.includes("node_modules/scenerystack") ? "scenerystack" : undefined,
      },
    },
  },
});
