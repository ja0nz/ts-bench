import { Args, oneOf, parse, string } from "@thi.ng/args";
type Template = "project" | "package" | "tool";

// CLI args will be validated against this interface
export interface CLIOpts {
    template: Template;
    prefix?: string;
}

// arg specifications
const specs: Args<CLIOpts> = {
    // string arg
    prefix: string({
        alias: "p",
        hint: "PREFIX",
        desc: "Alternating prefix will determine location of the asset",
    }),
    // enum value (mandatory)
    template: oneOf(["project", "package", "tool"], {
        alias: "t",
        hint: "ID",
        desc: "Template type",
        // mandatory args require a `default` value and/or `optional: false`
        optional: false,
    }),
};

try {
    // parse argv w/ above argument specs & default options
    // (by default usage is shown if error occurs)
    const args = parse(specs, process.argv);
    console.log(args);
} catch (_) { }
