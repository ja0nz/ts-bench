import { Args, flag } from '@thi.ng/args';
import { assert } from '@thi.ng/errors';
import type { Labels, R0, Milestones } from 'gh-cms-ql';
import {
  queryTitleM,
  queryNameL,
  getL,
  getM,
  getNodes,
  getR,
  queryIdL,
  queryIssueCountL,
  queryIssueCountM,
  queryL,
  queryM,
  queryNumberM,
  queryR,
} from 'gh-cms-ql';
import type { CLIOpts, CommandSpec, DryRunOpts } from '../api.js';
import { qlClient, restClient } from '../io/net.js';
import { purgeModel } from '../model/purge.js';
import { ARG_DRY } from './args.js';

export interface PurgeOptions extends CLIOpts, DryRunOpts {
  labels: boolean;
  milestones: boolean;
}

export const purgeCmd: CommandSpec<PurgeOptions> = {
  async fn(ctx) {
    const { opts, logger } = ctx;
    assert(
      opts.labels || opts.milestones,
      'At least one flag (-l || -m || --help) required',
    );
    logger.info('Starting purge');

    // CMD
    const l = opts.labels;
    const dry = opts.dryRun;
    const repoUrl = opts.repoUrl;
    const repoQ = qlClient(repoUrl);
    const repoR = restClient(repoUrl);

    // INPUT
    const qFn = l
      ? queryL()(queryIdL, queryNameL, queryIssueCountL)
      : queryM()(queryNumberM, queryTitleM, queryIssueCountM);

    const far: R0<Labels & Milestones> = await qlClient(opts.repoUrl)(
      queryR(qFn),
    );

    const rows = l
      ? getNodes<Labels>(getL(getR<Labels>(far)))
      : getNodes<Milestones>(getM(getR<Milestones>(far)));

    // OUTPUT
    await Promise.all(
      purgeModel(rows).map(([left, right]) =>
        (dry ? left : right)({
          repoQ,
          repoR,
          logger,
        }),
      ),
    );

    logger.info('Successfully purged');
  },
  opts: <Args<PurgeOptions>>{
    ...ARG_DRY,
    labels: flag({
      alias: 'l',
      desc: 'Purge unused labels',
    }),
    milestones: flag({
      alias: 'm',
      desc: 'Purge unused milestones',
    }),
  },
  usage: 'Purge unused labels & routes (aka milestones)',
};
