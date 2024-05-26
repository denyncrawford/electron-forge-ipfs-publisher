import { defineConfig } from "vite";
import nodeResolve from "@rollup/plugin-node-resolve";
import dts from "vite-plugin-dts";
import nodeExternals from "rollup-plugin-node-externals";

export default defineConfig({
  build: {
    outDir: "dist",
    lib: {
      entry: "src/index.ts",
      formats: ["cjs", "es"],
      fileName: "index",
    },
    commonjsOptions: {},
  },
  plugins: [
    nodeExternals({
      exclude: [
        "debug",
        "@web3-storage/w3up-client",
        "node-persist",
        "w3name",
        "mime",
        "@electron-forge/publisher-static",
        "@web-std/file",
        "fake-indexeddb/auto",
      ],
    }),
    nodeResolve(),
    dts(),
  ],
});
