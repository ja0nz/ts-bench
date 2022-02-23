import { opendir, readFile } from "node:fs/promises";
import { join, extname } from "node:path";
import type { Issue } from "../api";

async function* fswalk(dir: string): AsyncGenerator<string> {
    for await (const d of await opendir(dir)) {
        const entry = join(dir, d.name);
        if (d.isDirectory()) yield* fswalk(entry);
        else if (d.isFile()) yield entry;
    }
}

// Local content files
export async function getInFs(contentDir: string): Promise<Issue[]> {
    const fxs: Issue[] = [];
    for await (const f of fswalk(contentDir)) {
        if (extname(f) === ".md") {
            const file = await readFile(f);
            const buffer = Buffer.from(file).toString("utf-8");
            // Wrap in empty issue
            fxs.push({ id: "", state: "", body: buffer });
        }
    }
    return fxs;
}
