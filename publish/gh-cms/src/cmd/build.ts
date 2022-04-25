import { Args, string } from '@thi.ng/args';
import { comp } from '@thi.ng/compose';
import { assert } from '@thi.ng/errors';
import { zip } from '@thi.ng/transducers';
import {
  getCreateL,
  getNameL,
  getI,
  getM,
  Issues,
  Labels,
  Milestones,
  getIdI,
  getL,
  queryR,
  getIdR,
  getR,
  getCreateIdM,
  getCreateTitleM,
  CreateIssueQL,
  UpdateIssueQL,
  getIdL,
  CreateLabelQL,
} from 'gh-cms-ql';
import grayMatter from 'gray-matter';
import type { Fn } from '@thi.ng/api';
import {
  CLIOptions,
  DryRunOptions,
  CommandSpec,
  CONTENT_PATH,
  ensureEnv,
  REQUIRED,
  MDENV,
} from '../api.js';
import {
  fetchExhaust,
  buildDag,
  dag2MDActionMap,
  nearFarMerge,
  parseIssues,
  queryIPager,
  patchedIssued2Map,
  queryLPager,
  queryMPager,
  labelsMilestones2Map,
  preBuildModel,
  buildModel,
  issues2Map,
  postBuildModel,
} from '../model/build.js';
import { getInFs } from '../io/fs.js';
import { qlClient, restClient } from '../io/net.js';
import type { BuildContent, PreBuildContent } from '../model/api.js';
import { ARG_DRY } from './args.js';

export interface BuildOptions extends CLIOptions, DryRunOptions {
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
    const repoId = comp(getIdR, getR)(await repoQ(queryR()));

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
      issuesFar.map((x) => getIdI(x)),
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

    const rows: BuildContent[] = nearFarMerge(
      zip(idDateNear, mdNearRaw),
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

    const preBuild: Array<void | PreBuildContent> = await Promise.all(
      preBuildModel(rows, labelsMap, milestonesMap).map(([left, right]) =>
        (dry ? left : right)({
          logger,
          repoQ,
          repoR,
          repoId,
        }),
      ),
    );
    logger.debug(`Build: Finished prebuild`);

    // Pushing new labels milestones in related list
    const getCreateNameL: Fn<CreateLabelQL, string | undefined> = comp(
      getNameL,
      getCreateL,
    );
    const getCreateIdL: Fn<CreateLabelQL, string> = comp(getIdL, getCreateL);
    for (const row of preBuild) {
      if (row === undefined) break;
      const [k, v] = row;
      const id =
        (k === 'label' ? getCreateNameL : getCreateTitleM)(v as any) ?? '';
      const value = (k === 'label' ? getCreateIdL : getCreateIdM)(v as any);
      assert(
        value !== undefined,
        `Build: ${k}; Value is unset. Stack trace: ${logger.pp(v)}`,
      );
      const vmap = k === 'label' ? labelsMap : milestonesMap;
      vmap.set(id, value);
    }

    logger.debug(`Build: Finished prebuild key remapping`);

    // 6. Build (issues)
    const build: Array<void | CreateIssueQL | UpdateIssueQL> =
      await Promise.all(
        buildModel(rows, labelsMap, milestonesMap).map(([left, right]) =>
          (dry ? left : right)({
            logger,
            repoQ,
            repoR,
            repoId,
          }),
        ),
      );
    logger.debug(`Build: Finished build`);

    // 7. Postbuild (issues)
    if (!dry) {
      const buildMap = issues2Map(
        build as Array<CreateIssueQL | UpdateIssueQL>,
      );
      await Promise.all(
        postBuildModel(rows, buildMap).map(([left, right]) =>
          (dry ? left : right)({
            logger,
            repoQ,
            repoR,
            repoId,
          }),
        ),
      );
    }

    logger.debug(`Build: Finished postbuild`);
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
