#!/usr/bin/env node

import { exec } from "node:child_process";
exec("yarn set version latest", (error, stdout, stderr) => {
  if (error) console.error(error.message);
  if (stderr) console.error(stderr);
  if (stdout) console.log(stdout);
});
