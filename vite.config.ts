import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    base: "./",
    root: "src",
    build: {
      outDir: "../",
      emptyOutDir: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Vendor chunks
            if (id.includes("node_modules")) {
              if (id.includes("react-dom") || id.includes("react/")) {
                return "react-vendor";
              }
              if (id.includes("lucide-react")) {
                return "ui-vendor";
              }
              if (id.includes("uuid")) {
                return "helper-vendor";
              }
              if (id.includes("@loadable")) {
                return "loadable-vendor";
              }
              // Other node_modules go to common vendor
              return "vendor";
            }
            // Split components into their own chunks for lazy loading
            if (id.includes("/components/")) {
              const componentName = id.split("/components/")[1]?.split(".")[0];
              if (componentName) {
                return `component-${componentName.toLowerCase()}`;
              }
            }
          },
        },
      },
    },
    server: {
      port: 3000,
      host: "0.0.0.0",
    },
    plugins: [react()],
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  };
});
