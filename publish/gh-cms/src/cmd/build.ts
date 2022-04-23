import { graphql } from '@octokit/graphql';
import type { Fn0 } from '@thi.ng/api';
import { Args, string } from '@thi.ng/args';
import { comp } from '@thi.ng/compose';
import { assert } from '@thi.ng/errors';
import { assocMap, cat, map, trace, transduce, zip } from '@thi.ng/transducers';
import {
  getI,
  getM,
  Issues,
  Labels,
  Milestones,
  getIdI,
  getL,
  Issue,
  queryR,
  getIdR,
  getR,
  getCreateNameL,
  getCreateIdL,
  getCreateIdM,
  getCreateTitleM,
} from 'gh-cms-ql';
import grayMatter from 'gray-matter';
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
  fetchExhaust,
  build,
  buildDag,
  dag2MDActionMap,
  changedNewRows,
  parseContentRows,
  parseIssues,
  postBuild,
  preBuild,
  queryIPager,
  patchedIssued2Map,
  queryLPager,
  queryMPager,
  labelsMilestones2Map,
  preBuildModel,
  buildModel,
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
  restClient,
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
    logger.debug(`Build: Mapping envs to fields: ${logger.pp(MDENV)}`);

    // CMD
    const dry = opts.dryRun;
    const contentPath = opts.contentPath;
    const repoUrl = opts.repoUrl;
    const repoQ = qlClient(repoUrl);
    const repoR = restClient(repoUrl);
    const repoID = comp(getIdR, getR)(await repoQ(queryR()));

    // 1. Build DAG
    const dag = buildDag(MDENV);
    logger.debug(
      `Build: Dependency graph (leave->root): ${logger.pp(dag.sort())}`,
    );
    // 2. Expand to action map
    const actionMap = dag2MDActionMap(dag);
    // 3. FAR part
    const issuesFar = await fetchExhaust<Issues>(
      repoQ,
      queryIPager(actionMap.get('MD2ID'), actionMap.get('MD2DATE')),
      getI,
    );
    logger.debug(`Build: GH issues fetched: ${logger.pp(issuesFar)}`);

    const patchedIdFar: IterableIterator<[unknown[], string]> = zip(
      parseIssues(issuesFar, actionMap.get('MD2ID'), actionMap.get('MD2DATE')),
      issuesFar.map(getIdI),
    );
    const idDateFar = patchedIssued2Map(patchedIdFar);
    // Logger.debug(
    //   `Build: GH Issue (key => [date,remoteID]): ${logger.pp(idDateFar)}`,
    // );

    // 4. NEAR part
    const mdNearRaw = await getInFs(contentPath);
    const mdNearParsed = mdNearRaw.map((i) => grayMatter(i));

    const idDateNear = parseIssues(
      mdNearParsed,
      actionMap.get('MD2ID'),
      actionMap.get('MD2DATE'),
      actionMap.get('MD2TITLE'),
      actionMap.get('MD2LABELS'),
      actionMap.get('MD2MILESTONE'),
      actionMap.get('MD2STATE'),
    );
    // Logger.debug(`Build: Parsed local content: ${logger.pp(idDateNear)}`);

    const rows = changedNewRows(
      zip(
        idDateNear,
        mdNearRaw
      ),
      idDateFar,
    );
    logger.debug(`Build: Content to build: ${logger.pp(rows)}`);

    // 5. Prebuild (labels, milestones)
    const labelsFar = await fetchExhaust<Labels>(repoQ, queryLPager(), getL);
    const labelsMap = labelsMilestones2Map(labelsFar);
    logger.debug(`Build: GH labels fetched: ${logger.pp(labelsFar)}`);
    const milestonesFar = await fetchExhaust<Milestones>(
      repoQ,
      queryMPager(),
      getM,
    );
    const milestonesMap = labelsMilestones2Map(milestonesFar);
    logger.debug(`Build: GH milestones fetched: ${logger.pp(milestonesFar)}`);

    const preBuild: Array<['label' | 'milestone', any]> = await Promise.all(
      preBuildModel(rows, labelsMap, milestonesMap)
        .map(([left, right]) =>
          (dry ? left : right)({
            repoQ,
            repoR,
            repoUrl,
            repoID,
            logger,
          }),
        )
    );

    // Pushing new labels milestones in related list
    for (const row of preBuild) {
      if (row === undefined) break;
      const [k, v] = row;
      const id = (k === 'label' ? getCreateNameL : getCreateTitleM)(v) ?? '';
      const value = (k === 'label' ? getCreateIdL : getCreateIdM)(v);
      assert(
        value !== undefined,
        `Build: ${k}; Value is unset. Stack trace: ${logger.pp(v)}`,
      );
      const vmap = k === 'label' ? labelsMap : milestonesMap;
      vmap.set(id, value);
    }

    // 6. Build (issues)
    const build: Array<['label' | 'milestone', any]> = await Promise.all(
      buildModel(rows, labelsMap, milestonesMap)
        .map(([left, right]) =>
          (dry ? left : right)({
            repoQ,
            repoID,
            logger,
          }),
        ),
    );

    /*
     [
      {
      createIssue: {
        issue: {
          id: 'I_kwDOG-ZMMM5ISezT',
          title: 'zigzag-10-m,1650412800000',
          state: 'OPEN'
        }
      }
    },
    {
      updateIssue: {
        issue: {
          id: 'I_kwDOG-ZMMM5GOY4-',
          title: 'zig-7-m,1650412800003',
          state: 'OPEN'
        }
      }
    }
    ]
     */

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
