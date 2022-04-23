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

type LnM = Label | Milestone;

export function purgeModel(
  ...rows: any[]
): FnAnyT<LnM[], Array<Fn0<Promise<unknown>>>> {
  return transduce(
    comp(
      // Throw all out which have an related issue
      filter((x: LnM) => !getIssueCountL(x)),
      // Transform to action
      map<LnM, DeleteLabel | DeleteMilestone>((x: LnM) => {
        const n = getNumberM(x);
        const ql = {
          action: 'delete',
          type: n === undefined ? 'label' : 'milestone',
          [n === undefined ? 'id' : 'number']: n === undefined ? getIdL(x) : n,
        };

        return [
          ({ logger }) =>
            logger.info(`DRY; ${ql.type} removal, ${logger.pp(x)}`),
          ({ repoQ, repoR }) => {
            if (ql.type === 'milestone') {
              return repoR(...mutateRestM(ql));
            }

            return repoQ(mutateL(ql), ql);
          },
        ];
      }),
    ),
    push(),
    flatten<LnM[]>(rows),
  );
}
