const esbuild = require("esbuild");

esbuild.build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  outfile: "dist/bundle.js",
  platform: "browser",
  format: "iife",
  treeShaking: false,
  target: ["es2019"],
  allowOverwrite: true,
}).catch(() => process.exit(1));
