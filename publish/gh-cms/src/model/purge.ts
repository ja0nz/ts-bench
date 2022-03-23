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
import { mutateRestM, mutateL, getNumberM, getIdL, getIssueCountL } from 'gh-cms-ql';
import type { PurgeOpts } from '../cmd/purge';
import type { Logger } from '../logger';
import { qlClient, restClient } from './io/net';

type PIn = Label | Milestone;

export function purge(
  opts: PurgeOpts,
  logger: Logger
): FnAnyT<PIn[], Fn0<Promise<any>>[]> {
  return (...rows) => {
    return transduce(
      comp(
        // throw all out which have an related issue
        filter((x: PIn) => !getIssueCountL(x)),
        map((x: PIn) => {
          if (opts.dryRun) return x;
          const n = getNumberM(x)
          if (n !== undefined) {
            return {
              type: 'delete',
              number: n
            }
          }
          return {
            type: 'delete',
            id: getIdL(x)
          }
        }),
        map<DeleteLabel | DeleteMilestone, Fn0<unknown>>((x) => {
          const n = getNumberM(x)
          if (opts.dryRun)
            return () => logger.info(
              `DRY; Subject to removal, ${
                n ? 'Milestone' : 'Label'
              } ${logger.pp(x as object)}`
            );

          if (n !== undefined) {
            const [str, pl] = mutateRestM(x);
            return () => restClient(opts.repoUrl)(str, pl);
          }
          return () => qlClient(opts.repoUrl)(mutateL(x));
          }
        )
      ),
      push(),
      flatten<PIn[]>(rows)
    );
  };
}
