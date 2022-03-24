import { Args, flag } from '@thi.ng/args';
import { assert } from '@thi.ng/errors';
import type { Labels, R0, Milestones } from 'gh-cms-ql';
import { queryTitleM, queryNameL } from 'gh-cms-ql';
import { getL, getM, getNodes, getR, queryIdL, queryIssueCountL, queryIssueCountM, queryL, queryM, queryNumberM, queryR } from 'gh-cms-ql';
import type { CLIOpts, CommandSpec, DryRunOpts } from '../api';
import {
  qlClient,
} from '../model/io/net';
import { purge } from '../model/purge';
import { ARG_DRY } from './args';

export interface PurgeOpts extends CLIOpts, DryRunOpts {
  labels: boolean;
  milestones: boolean;
}

export const PURGE: CommandSpec<PurgeOpts> = {
  fn: async (ctx) => {
    const { opts, logger } = ctx;
    assert(
      opts.labels || opts.milestones,
      'At least one flag (-l || -m || --help) required'
    );
    logger.info('Starting purge');

    // INPUT
    const far: R0<Labels & Milestones> = await qlClient(opts.repoUrl)(
      queryR(
        queryL()(queryIdL, queryNameL, queryIssueCountL),
        queryM()(queryNumberM, queryTitleM, queryIssueCountM)
      )
    );

    const labels = getNodes<Labels>(getL(getR<Labels>(far)));
    const milestones = getNodes<Milestones>(getM(getR<Milestones>(far)));

    const outFx = purge(opts, logger)(labels, milestones);

    // OUTPUT
    await Promise.all(outFx.map((x) => x()));

    logger.info('Successfully purged');
  },
  opts: <Args<PurgeOpts>>{
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
