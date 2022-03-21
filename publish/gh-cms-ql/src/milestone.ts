import { comp } from "@thi.ng/compose";
import { defGetter } from "@thi.ng/paths";
import { jNl, jSt, Milestone, R1 } from "./api.js";
import { endCursor, getR, hasNextPage, pageInfo, totalCount } from "./repo.js";

/*
 * Nodes Query
 */
export const queryIdM = "id";
export const queryNumberM = "number";
export const queryTitleM = "title";
export const queryIssueCountM = `issues { ${totalCount} }`;

export const queryM =
  (n = 100, after = '') =>
  (...query: string[]) =>
    `milestones(first: ${n} ${after && jSt('after: ', after, '')}) {
        nodes { ${queryIdM} ${jNl(...query)} }
        ${totalCount}
        ${pageInfo} { ${endCursor} ${hasNextPage} }
      }`;

/*
 * Getters
 */
// Repository
export const getM = comp(
  defGetter<R1, 'milestones'>(['milestones']),
  getR,
);

// Nodes
export const getIdM = comp(
  defGetter<Milestone, 'id'>([queryIdM]),
);
export const getNumberM = comp(defGetter<Milestone, 'number'>([queryNumberM]));
export const getTitleM = comp(
  defGetter<Milestone, 'title'>([queryTitleM]),
);
export const getIssueCountM = comp(
  defGetter<Milestone, 'issues', 'totalCount'>([
    'issues',
    'totalCount',
  ]),
);

/*
 * Setters
 */


/*
 * Mutation
 */
