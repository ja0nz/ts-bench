import { Args, string } from "@thi.ng/args";
import { comp } from "@thi.ng/compose";
import { CLIOpts, DryRunOpts, CommandSpec, CONTENT_PATH, ensureEnv, REQUIRED } from "../api";
import type { Issue, Repository } from "../model/api";
import { latestContentRows, parseContentRows, preFilter } from "../model/build";
import { getInFs } from "../model/io/fs";
import { queryStrRepo, getInRepo, qlrequest, queryQLIssues, queryQLLabels, queryQLMilestones } from "../model/io/net";
import { ARG_DRY } from "./args";

export interface BuildOpts extends CLIOpts, DryRunOpts {
  contentPath: string;
}

export const BUILD: CommandSpec<BuildOpts> = {
  fn: async (ctx) => {
    const { opts, config, logger } = ctx;
    // Guards
    ensureEnv("--content-path", "env.CONTENT_PATH", opts.contentPath);
    logger.info("Starting build")
    /*
     * opts
     * {
         "repoUrl": "https://github.com/ja0nz/ja.nz",
         "dryRun": false,
         "contentPath": "./content"
     }
    */
    logger.info(logger.pp(opts))

    // INPUT
    const pnear: Promise<Issue[]> = getInFs(opts.contentPath);
    const pfar: Promise<Repository> = qlrequest(opts.repoUrl)(
      queryStrRepo(
        queryQLIssues("body"),
        queryQLLabels(),
        queryQLMilestones()
      ))
    const [far, near] = await Promise.all([pfar, pnear])

    // transform
    const out = comp(
      //genWorkMap(far),
      // extract
      latestContentRows,
      // filter only relevant rows
      preFilter,
      // parse content with grayMatter and group them by id
      parseContentRows
    )(
      getInRepo(far, "issues")?.nodes ?? [],
      near
    );
    console.log(out)

    // const workload: Promise<any>[] = transduce(
    //   comp(
    //     map(x => new Promise(x)) // into workload
    //   ),
    //   reducer(
    //     () => [],
    //     (acc, x) => {
    //       // TODO
    //       // labels
    //       // milestones
    //       // modify i
    //       // create i
    //     }
    //   ),
    //   await latestContent(opts)
    // )

    // // OUTPUT
    // for (let p of workload) {
    //   await p;
    // }

    //console.log(c)
    // FIXME debug only
    // opts.dryRun = true;
    // TODO implement build logic
    logger.info("Successfully build");
  },
  opts: <Args<BuildOpts>>{
    ...ARG_DRY,
    contentPath: string({
      alias: "p",
      hint: "PATH",
      default: CONTENT_PATH || REQUIRED,
      desc: "Markdown content (abs|rel) path"
    })
  },
  usage: "Transform markdown files to GH issues"
};

