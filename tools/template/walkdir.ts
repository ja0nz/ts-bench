import { opendir } from "node:fs/promises";
import { join } from "node:path";

export async function* walk(dir: string): any {
    for await (const d of await opendir(dir)) {
        const entry = join(dir, d.name);
        if (d.isDirectory()) yield* walk(entry);
        else if (d.isFile()) yield entry;
    }
}
