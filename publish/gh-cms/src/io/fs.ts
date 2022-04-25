import { opendir, readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { readFileSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import type { IObjectOf } from '@thi.ng/api';

export const readJson = (path: string): IObjectOf<string> =>
  JSON.parse(<any>readFileSync(path));

async function* fswalk(dir: string): AsyncGenerator<string> {
  for await (const d of await opendir(dir)) {
    const entry = join(dir, d.name);
    if (d.isDirectory()) yield* fswalk(entry);
    else if (d.isFile()) yield entry;
  }
}

// Local content files
export async function getInFs(contentDir: string): Promise<string[]> {
  const fxs: string[] = [];
  for await (const f of fswalk(contentDir)) {
    if (extname(f) === '.md') {
      const file = await readFile(f);
      const buffer = Buffer.from(file).toString('utf-8');
      fxs.push(buffer);
    }
  }

  return fxs;
}
