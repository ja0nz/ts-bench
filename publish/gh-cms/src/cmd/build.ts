import type { Fn0 } from '@thi.ng/api';
import { Args, string } from '@thi.ng/args';
import { comp } from '@thi.ng/compose';
import { assert } from '@thi.ng/errors';
import type { Issue } from 'gh-cms-ql';
import {
  CLIOpts,
  DryRunOpts,
  CommandSpec,
  CONTENT_PATH,
  ensureEnv,
  REQUIRED,
  MDENV,
} from '../api';
import type { Repository } from '../model/api';
import {
    allIssues,
  build,
  buildDag,
  dagAction,
  latestContentRows,
  parseContentRows,
  postBuild,
  preBuild,
  preFarPageFn,
} from '../model/build';
import { getInFs } from '../model/io/fs';
import {
  queryStrRepo,
  getInRepo,
  qlClient,
  queryQLIssues,
  queryQLLabels,
  queryQLMilestones,
  queryQLID,
} from '../model/io/net';
import { ARG_DRY } from './args';

export interface BuildOptions extends CLIOpts, DryRunOpts {
  contentPath: string;
}

export const buildCmd: CommandSpec<BuildOptions> = {
  fn: async (ctx) => {
    const { opts, logger } = ctx;
    // Guards
    ensureEnv('--content-path', 'env.CONTENT_PATH', opts.contentPath);
    logger.info('Starting build');

    // CMD
    const dry = opts.dryRun;
    const repoUrl = opts.repoUrl;
    const contentPath = opts.contentPath;
    const repoQ = qlClient(repoUrl);

    console.log(repoUrl)
    console.log(contentPath)
    console.log(MDENV)

    // 1. Build DAG
    const dag = buildDag(MDENV);
    // 2. Expand to action map
    const actionMap = dagAction(dag);
    // 2. Preflight - Get essential MD2ID, MD2DATE in memory
    // 2.1. Fetch preflight (title, state, ... or body?)
    const preIssues: Issue[] = await allIssues(repoQ, preFarPageFn(actionMap));
    // 2.1. Retrieve local fs
    const pnear: Issue[] = await getInFs(contentPath);
    console.log(pnear)

    // 2.2. Parse
    // 2.3. Check if all keys are set properly

    // INPUT
    // const pfar: Fn0<Promise<Repository>> = () =>
    //   qlClient(repoUrl)(
    //     queryStrRepo(
    //       queryQLID(),
    //       queryQLIssues('body'),
    //       queryQLLabels(),
    //       queryQLMilestones()
    //     )
    //   );
    // const near = await pnear;
    // let far = await pfar();

    // // transform
    // const content2Build = comp(
    //   // extract
    //   latestContentRows,
    //   // parse content with grayMatter and group them by id
    //   parseContentRows(far)
    // )(getInRepo(far, 'issues')?.nodes ?? [], near);

    // // Prebuild
    // const preBuildFx = preBuild(opts, logger, far)(content2Build);

    // // OUTPUT
    // if (!dry) {
    //   await Promise.all(preBuildFx.map((x) => x()));
    // }

    // // Build
    // far = await pfar();
    // const buildFx = build(opts, logger, far)(content2Build);

    // // OUTPUT
    // let issues;
    // if (!dry) {
    //   issues = await Promise.all(buildFx.map((x) => x()));

    //   // Postbuild
    //   const postBuildFx = postBuild(opts, logger, issues)(content2Build);
    //   if (!dry) {
    //     await Promise.all(postBuildFx.map((x) => x()));
    //   }
    // }

    logger.info('Successfully build');
  },
  opts: <Args<BuildOptions>>{
    ...ARG_DRY,
    contentPath: string({
      alias: 'p',
      hint: 'PATH',
      default: CONTENT_PATH || REQUIRED,
      desc: 'Markdown content (abs|rel) path',
    }),
  },
  usage: 'Transform markdown files to GH issues',
};
