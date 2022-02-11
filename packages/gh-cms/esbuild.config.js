import { buildSync } from "esbuild";
buildSync({
  entryPoints: [
    "./src/index.ts",
  ],
  bundle: true,
  outfile: "./bin/index.cjs",
  minify: false,
  sourcemap: false,
  target: ["node16"],
  platform: "node",
});
