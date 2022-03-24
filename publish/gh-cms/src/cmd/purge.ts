import { Args, flag } from '@thi.ng/args';
import { compL } from '@thi.ng/compose';
import { assert } from '@thi.ng/errors';
import type { Milestone, Label } from 'gh-cms-ql';
import { queryTitleM, queryNameL } from 'gh-cms-ql';
import { getL, getM, getNodes, getR, queryIdL, queryIssueCountL, queryIssueCountM, queryL, queryM, queryNumberM, queryR } from 'gh-cms-ql';
import type { CLIOpts, CommandSpec, DryRunOpts } from '../api';
import type { Repository } from '../model/api';
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

    // CONF
    const l = opts.labels;
    const m = opts.milestones;

    // INPUT
    const far: Repository = await qlClient(opts.repoUrl)(
      queryR(
        l ? queryL()(queryIdL, queryNameL, queryIssueCountL) : '',
        m ? queryM()(queryNumberM, queryTitleM, queryIssueCountM) : ''
      )
    );

    const labels: Label[] = compL(getR, getL, getNodes<Labels>)(far) ?? [];
    const milestones: Milestone[] = compL(getR, getM, getNodes)(far) ?? [];

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
