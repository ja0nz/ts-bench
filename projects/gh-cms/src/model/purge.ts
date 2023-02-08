import {
  comp,
  filter,
  flatten,
  map,
  push,
  transduce,
} from "@thi.ng/transducers";
import {
  DeleteLabel,
  DeleteMilestone,
  getIdL,
  getIssueCountL,
  getNumberM,
  Label,
  Milestone,
  mutateL,
  mutateRestM,
} from "gh-cms-ql";
import type { Either } from "./api";

type LnM = Label | Milestone;

export function purgeModel(...rows: LnM[][]): Array<Either<unknown>> {
  return transduce(
    comp(
      // Throw all out which have an related issue
      filter((x: LnM) => !getIssueCountL(x)),
      // Transform to action
      map<LnM, Either<unknown>>((x: LnM) => {
        const n = getNumberM(x);
        const ql: DeleteMilestone | DeleteLabel = {
          type: n === undefined ? "label" : "milestone",
          action: "delete",
          id: n === undefined ? getIdL(x) : String(n),
        };

        return [
          ({ logger }) => {
            logger.info(`DRY; ${ql.type} removal, ${logger.pp(x)}`);
          },
          async ({ repoQ, repoR }) =>
            ql.type === "milestone"
              ? repoR(...mutateRestM(ql))
              : repoQ(mutateL(ql), ql),
        ];
      }),
    ),
    push(),
    flatten<LnM[]>(rows),
  );
}
