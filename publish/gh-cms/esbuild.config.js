import { buildSync } from "esbuild";

buildSync({
  entryPoints: ["./src/index.ts"],
  bundle: true,
  outfile: "./dist/index.cjs",
  minify: false,
  sourcemap: false,
  target: ["node18"],
  platform: "node",
});
