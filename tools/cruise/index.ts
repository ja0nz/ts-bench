import { cruise, IReporterOutput, ICruiseOptions } from "dependency-cruiser";
import { writeFileSync } from "node:fs";

/**
 *
 *  https://github.com/sverweij/dependency-cruiser/blob/develop/doc/api.md
 */
const ARRAY_OF_FILES_AND_DIRS_TO_CRUISE: string[] = ["src"];
const cruiseOptions: ICruiseOptions = {
    includeOnly: "src",
    outputType: "dot"
};
const cruiseResult: IReporterOutput = cruise(
    ARRAY_OF_FILES_AND_DIRS_TO_CRUISE,
    cruiseOptions);

writeFileSync("deps.dot", <string>cruiseResult.output);
