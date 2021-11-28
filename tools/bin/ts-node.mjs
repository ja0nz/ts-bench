#!/usr/bin/env node

import { spawn } from "child_process";
const [node, _, ...args] = process.argv;

const p = spawn(node, ["--loader", "tsm", ...args]);

p.stdout.pipe(process.stdout);
p.stderr.on('data', d => {
  const dStr = d.toString().trim();
  !dStr.includes("ExperimentalWarning") ? console.log(dStr) : "";
});
