#!/usr/bin/env node

import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const src = "index.ts";
const [node, _, ...args] = process.argv;

const binDir = dirname(fileURLToPath(import.meta.url));
const cli = join(binDir, src);
const p = spawn(node, ["--loader", "ts-node/esm", cli, ...args]);

p.stdout.pipe(process.stdout);
p.stderr.on('data', d => {
  const dStr = d.toString().trim();
  !dStr.includes("ExperimentalWarning") ? console.log(dStr) : "";
});
