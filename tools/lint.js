#!/usr/bin/env node

import { spawn } from "node:child_process";
import { chdir, cwd } from "node:process";
import { isAbsolute, join } from "node:path";

const current = cwd();
chdir(process.env.PROJECT_CWD);

const [_1, _2, ...args] = process.argv;
const pargs = args.map(p =>
  p.startsWith("--") || isAbsolute(p) ? p : join(current, p))

spawn("yarn", ["xo", ...pargs], {stdio: "inherit"});
