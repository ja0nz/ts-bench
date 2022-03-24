import type { Fn0 } from '@thi.ng/api';
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
import { qlClient } from '../model/io/net.js';
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

    // INPUT
    const qFn = l
      ? queryL()(queryIdL, queryNameL, queryIssueCountL)
      : queryM()(queryNumberM, queryTitleM, queryIssueCountM);

    const far: R0<Labels & Milestones> = await qlClient(opts.repoUrl)(
      queryR(qFn),
    );

    const qLoad = l
      ? getNodes<Labels>(getL(getR<Labels>(far)))
      : getNodes<Milestones>(getM(getR<Milestones>(far)));

    const outFx = purgeModel(opts, logger)(qLoad);

    // OUTPUT
    await Promise.all(outFx.map(async (x: Fn0<Promise<unknown>>) => x()));

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
