#!/usr/bin/env node

import { spawn } from "node:child_process";
import { join, dirname } from "node:path";
const [node, cwd, ...args] = process.argv;

process.env.TS_NODE_PROJECT = join(dirname(cwd), "tsconfig.json");
const p = spawn(node, ["--loader", "ts-node/esm", ...args]);

p.stdout.pipe(process.stdout);
p.stderr.on('data', d => {
  const dStr = d.toString().trim();
  !dStr.includes("ExperimentalWarning") ? console.log(dStr) : "";
});
