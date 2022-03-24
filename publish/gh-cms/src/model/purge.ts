import type { Fn0, FnAnyT } from '@thi.ng/api';
import {
  comp,
  flatten,
  map,
  filter,
  transduce,
  push,
} from '@thi.ng/transducers';
import type { Label, DeleteLabel, DeleteMilestone, Milestone } from 'gh-cms-ql';
import {
  mutateRestM,
  mutateL,
  getNumberM,
  getIdL,
  getIssueCountL,
} from 'gh-cms-ql';
import type { PurgeOptions } from '../cmd/purge';
import type { Logger } from '../logger';
import { qlClient, restClient } from './io/net.js';

type LnM = Label | Milestone;

export function purgeModel(
  options: PurgeOptions,
  logger: Logger,
): FnAnyT<LnM[], Array<Fn0<Promise<unknown>>>> {
  return (...rows) => {
    return transduce(
      comp(
        // Throw all out which have an related issue
        filter((x: LnM) => !getIssueCountL(x)),
        // Transform to action
        map((x: LnM) => {
          const n = getNumberM(x);
          let r: DeleteLabel | DeleteMilestone;
          if (n === undefined) {
            r = {
              type: 'label',
              action: 'delete',
              id: getIdL(x),
            };
          } else {
            r = {
              type: 'milestone',
              action: 'delete',
              number: n,
            };
          }

          return r;
        }),
        // Wrap action with client
        map((x): Fn0<Promise<unknown>> => {
          if (options.dryRun)
            return async () => {
              logger.info(
                `DRY; Subject to removal, ${logger.pp(
                  x as Record<string, unknown>,
                )}`,
              );
            };

          if (x.type === 'milestone') {
            return async () => restClient(options.repoUrl)(...mutateRestM(x));
          }

          return async () => qlClient(options.repoUrl)(mutateL(x));
        }),
      ),
      push(),
      flatten<LnM[]>(rows),
    );
  };
}
