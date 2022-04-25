import {
  comp,
  flatten,
  map,
  filter,
  transduce,
  push,
} from '@thi.ng/transducers';
import {
  Label,
  DeleteLabel,
  DeleteMilestone,
  Milestone,
  mutateRestM,
  mutateL,
  getNumberM,
  getIdL,
  getIssueCountL,
} from 'gh-cms-ql';
import type { Either } from './api';

type LnM = Label | Milestone;

export function purgeModel(...rows: LnM[][]): Either<unknown>[] {
  return transduce(
    comp(
      // Throw all out which have an related issue
      filter((x: LnM) => !getIssueCountL(x)),
      // Transform to action
      map<LnM, Either<unknown>>((x: LnM) => {
        const n = getNumberM(x);
        const ql: DeleteMilestone | DeleteLabel = {
          type: n === undefined ? 'label' : 'milestone',
          action: 'delete',
          id: n === undefined ? getIdL(x) : String(n),
        };

        return [
          ({ logger }) => {
            logger.info(`DRY; ${ql.type} removal, ${logger.pp(x)}`);
          },
          ({ repoQ, repoR }) =>
            ql.type === 'milestone'
              ? repoR(...mutateRestM(ql))
              : repoQ(mutateL(ql), ql),
        ];
      }),
    ),
    push(),
    flatten<LnM[]>(rows),
  );
}
