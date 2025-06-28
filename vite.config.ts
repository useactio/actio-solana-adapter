import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { resolve } from "path";

export default defineConfig({
  build: {
    lib: {
      entry: [
        resolve(__dirname, "src/adapter/adapter.ts"),
        resolve(__dirname, "src/ui/actio.ts"),
      ],
      formats: ["es"],
      fileName: (_, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      // Ensure no index.html is used
      input: {
        adapter: resolve(__dirname, "src/adapter/adapter.ts"),
        actio: resolve(__dirname, "src/ui/actio.ts"),
      },
      output: {
        // Separate chunks for each entry
        entryFileNames: "[name].js",
      },
    },
    outDir: "dist",
    emptyOutDir: true,
  },
  plugins: [dts({ tsconfigPath: "tsconfig.json" })],
});
