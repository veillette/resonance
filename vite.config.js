import { defineConfig } from "vite";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import packageJson from "./package.json";

// Simple splash SVG placeholder for brands
const splashSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#1a1a2e"/>
  <text x="300" y="200" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle">Loading...</text>
</svg>`;

// Brands that SceneryStack might request splash images for
const brands = ["made-with-scenerystack", "adapted-from-phet", "phet"];

// Plugin to generate splash SVGs during build
function generateSplashPlugin() {
  return {
    name: "generate-splash-svgs",
    async writeBundle(options) {
      const outDir = options.dir || "dist";
      for (const brand of brands) {
        const dir = join(outDir, "brand", brand, "images");
        await mkdir(dir, { recursive: true });
        await writeFile(join(dir, "splash.svg"), splashSvg);
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  // So the build can be served from an arbitrary path
  base: "./",
  define: {
    // Provide packageObject for SceneryStack's update checker
    "phet.chipper.packageObject": JSON.stringify(packageJson),
  },
  plugins: [generateSplashPlugin()],
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
