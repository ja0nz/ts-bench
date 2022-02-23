import { cruise, IReporterOutput, ICruiseOptions } from "dependency-cruiser";
import { writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { renderGraphFromSource } from 'graphviz-cli'

const [_0, _1, ...args] = process.argv;

(async () => {
    if (args.length === 0) args.push(process.cwd())

    for (let dest of args) {
        dest = resolve(dest);

        //  https://github.com/sverweij/dependency-cruiser/blob/develop/doc/api.md
        const ARRAY_OF_FILES_AND_DIRS_TO_CRUISE: string[] = [
            "src"
        ];
        const cruiseOptions: ICruiseOptions = {
            maxDepth: 1,
            baseDir: dest,
            outputType: "dot"
        };
        const cruiseResult: IReporterOutput = cruise(
            ARRAY_OF_FILES_AND_DIRS_TO_CRUISE,
            cruiseOptions);

        const svg = await renderGraphFromSource(
            { input: <string>cruiseResult.output }, { format: 'svg' }
        )

        writeFileSync(join(dest, "deps.html"), svg);
    }
})();
