import { defineConfig } from "vite";
import packageJson from "./package.json";

// https://vitejs.dev/config/
export default defineConfig({
  // So the build can be served from an arbitrary path
  base: "./",
  define: {
    // Provide packageJSON for SceneryStack's update checker
    "phet.chipper.packageJSON": JSON.stringify(packageJson),
  },
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
