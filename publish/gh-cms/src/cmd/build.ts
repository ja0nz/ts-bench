import type { Fn0 } from '@thi.ng/api';
import { Args, string } from '@thi.ng/args';
import { comp } from '@thi.ng/compose';
import { assert } from '@thi.ng/errors';
import { assocMap, cat, map, trace, transduce, zip } from '@thi.ng/transducers';
import { getIdI, Issue } from 'gh-cms-ql';
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
  fetchIssues,
  build,
  buildDag,
  dag2MDActionMap,
  changedNewRows,
  parseContentRows,
  parseIssues,
  postBuild,
  preBuild,
  query,
  setGrayMatter,
  patchedIssued2Map,
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
  async fn(ctx) {
    const { opts, logger } = ctx;
    // Guards
    ensureEnv('--content-path', 'env.CONTENT_PATH', opts.contentPath);
    logger.info('Starting build');

    // CMD
    const dry = opts.dryRun;
    const repoUrl = opts.repoUrl;
    const contentPath = opts.contentPath;
    const repoQ = qlClient(repoUrl);

    console.log(repoUrl);
    console.log(contentPath);
    console.log(MDENV);

    // 1. Build DAG
    const dag = buildDag(MDENV);
    // 2. Expand to action map
    const actionMap = dag2MDActionMap(dag);
    // 3. FAR part
    const issuesFar: Issue[] = await fetchIssues(
      repoQ,
      query(actionMap.get('MD2ID'), actionMap.get('MD2DATE')),
    );
    const patchedIdFar = comp(
      (xs) => zip(xs, issuesFar.map(getIdI)),
      parseIssues,
    )(issuesFar, actionMap.get('MD2ID'), actionMap.get('MD2DATE'));
    const idDateFar = patchedIssued2Map(patchedIdFar);
    console.log('far', idDateFar);

    // 4. NEAR part
    const mdNearRaw = await getInFs(contentPath);
    const mdNearParsed = setGrayMatter(mdNearRaw);

    const idDateNear = parseIssues(
      mdNearParsed,
      actionMap.get('MD2ID'),
      actionMap.get('MD2DATE'),
      actionMap.get('MD2TITLE'),
      actionMap.get('MD2LABELS'),
      actionMap.get('MD2MILESTONE'),
      actionMap.get('MD2STATE'),
    );
    console.log('near', idDateNear);

    const rows = changedNewRows(
      zip(
        idDateNear,
        // MdNearRaw
      ),
      idDateFar,
    );
    console.log('update', rows);

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
