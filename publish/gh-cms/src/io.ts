import { readFileSync } from "node:fs";

export const readJSON = (path: string) => JSON.parse(<any>readFileSync(path));
