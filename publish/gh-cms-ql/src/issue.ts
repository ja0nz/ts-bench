import { defGetter } from '@thi.ng/paths';
import { comp } from '@thi.ng/compose';
import { jSt, jNl, Issue, R1 } from './api.js';
import { endCursor, getR, hasNextPage, pageInfo, totalCount } from './repo.js';

/*
 * Nodes Query
 */
export const queryIdI = "id";
export const queryStateI = "state";
export const queryTitleI = "title";
export const queryBodyI = "body";

export const queryI =
  (n = 100, after = '', owner = '$owner') =>
  (...query: string[]) =>
    `issues(first: ${n} ${
      after && jSt('after: ', after, '')
    } filterBy: {createdBy: ${owner}}) {
        nodes { ${queryIdI} ${jNl(...query)} }
        ${totalCount}
        ${pageInfo} { ${endCursor} ${hasNextPage} }
      }`;

/*
 * Getters
 */
// Repository
export const getI = comp(defGetter<R1, 'issues'>(['issues']), getR);

// Nodes
export const getIdI = comp(
  defGetter<Issue, 'id'>([queryIdI]),
);
export const getStateI = comp(defGetter<Issue, 'state'>([queryStateI]));
export const getBodyI = comp(defGetter<Issue, 'body'>([queryBodyI]));
export const getTitleI = comp(
  defGetter<Issue, 'title'>([queryTitleI]),
);


