import { flag } from "@thi.ng/args";

/**
 * Don't push new changes, instead log new content
 */
export const ARG_DRY = {
  dryRun: flag({ desc: "Dry run" })
};
