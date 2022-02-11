#!/usr/bin/env node

const src = "index.ts";
import { spawn } from "child_process";
import { join } from "path";
const [node, toolsDir, ...args] = process.argv;

const cli = join(toolsDir, "..", "..", "cruise", src);
const p = spawn(node, ["--loader", "tsm", cli, ...args]);

p.stdout.pipe(process.stdout);
p.stderr.on('data', d => {
  const dStr = d.toString().trim();
  !dStr.includes("ExperimentalWarning") ? console.log(dStr) : "";
});
