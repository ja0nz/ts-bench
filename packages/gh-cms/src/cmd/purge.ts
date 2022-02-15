import { Args, flag } from "@thi.ng/args";
import { assert } from "@thi.ng/errors";
import type { CLIOpts, CommandSpec, DryRunOpts } from "../api";
import type { Repository } from "../model/api";
import { getInRepo, qlrequest, queryQLIssues, queryQLLabels, queryQLMilestones, queryStrRepo } from "../model/io/net";
import { purge } from "../model/purge";
import { ARG_DRY } from "./args";

export interface PurgeOpts extends CLIOpts, DryRunOpts {
  labels: boolean;
  milestones: boolean;
}

export const PURGE: CommandSpec<PurgeOpts> = {
  fn: async (ctx) => {
    const { opts, logger } = ctx;
    assert(opts.labels || opts.milestones, "At least one flag (-l || -m || --help) required")
    logger.info("Starting purge")

    // CONF
    const dry = opts.dryRun;
    const l = opts.labels
    const m = opts.milestones

    // INPUT
    const far: Repository = await qlrequest(opts.repoUrl)(
      queryStrRepo(
        !l ? "" : queryQLLabels(
          queryQLIssues()
        ),
        !m ? "" : queryQLMilestones(
          queryQLIssues()
        )
      )
    )
    const labels = !l ? [] : getInRepo(far, "labels")?.nodes ?? [];
    const milestones = !m ? [] : getInRepo(far, "milestones")?.nodes ?? [];

    const outFx = purge(opts, logger)(labels, milestones)

    // OUTPUT
    if (!dry) {
      await Promise.all(outFx.map(x => x()))
    }

    logger.info("Successfully purged");
  },
  opts: <Args<PurgeOpts>>{
    ...ARG_DRY,
    labels: flag({
      alias: "l",
      desc: "Purge unused labels"
    }),
    milestones: flag({
      alias: "m",
      desc: "Purge unused milestones"
    })
  },
  usage: "Purge unused labels & routes (aka milestones)"
};
