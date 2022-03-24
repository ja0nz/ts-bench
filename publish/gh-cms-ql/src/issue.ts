import { defGetter } from '@thi.ng/paths';
import { comp } from '@thi.ng/compose';
import type { Fn } from '@thi.ng/api';
import { jNl, Issue, Issues, R1, R2 } from './api.js';
import { endCursor, hasNextPage, pageInfo, totalCount } from './repo.js';

/*
 * Nodes Query
 */
export const queryIdI = 'id';
export const queryStateI = 'state';
export const queryTitleI = 'title';
export const queryBodyI = 'body';

export const queryI =
  (n = 100, after = '', owner = '$owner') =>
  (...query: string[]) =>
    `issues(first: ${n} ${
      after && `after: "${after}"`
    } filterBy: {createdBy: ${owner}}) {
        nodes { ${queryIdI} ${jNl(...query)} }
        ${totalCount}
        ${pageInfo} { ${endCursor} ${hasNextPage} }
      }`;

/*
 * Getters
 */
// Repository
export const getI: Fn<R1<Issues>, R2<Issues>> = defGetter<R1<Issues>, 'issues'>(
  ['issues'],
);

// Nodes
export const getIdI = comp(defGetter<Issue, 'id'>([queryIdI]));
export const getStateI = comp(defGetter<Issue, 'state'>([queryStateI]));
export const getBodyI = comp(defGetter<Issue, 'body'>([queryBodyI]));
export const getTitleI = comp(defGetter<Issue, 'title'>([queryTitleI]));

/*
 * Mutation
 */
type IssueAction = {
  type: 'issue';
  id: string;
  title?: string;
  body?: string;
  labelIds?: string[];
  milestoneId?: string;
};
export type CreateIssue = IssueAction & { action: 'create'; title: string };
export type UpdateIssue = IssueAction & {
  action: 'update';
  state?: 'OPEN' | 'CLOSED';
};

export const mutateI = (a: CreateIssue | UpdateIssue) =>
  `mutation {
     ${a.action === 'update' ? 'updateIssue' : 'createIssue'}(input: {
        ${a.action === 'update' ? 'id' : 'repositoryId'}: "${a.id}"
        ${a.title ? `title: "${a.title}"` : ''}
        ${a.body ? `body: "${a.body}"` : ''}
        ${
          a.labelIds
            ? `labelIds: [${a.labelIds.map((x) => `"${x}"`).join(',')}]`
            : ''
        }
        ${a.milestoneId ? `milestoneId: "${a.milestoneId}"` : ''}
        ${a.action === 'update' && a.state ? `state: ${a.state}` : ''}
      }) {
        issue {
          id
          title
          state
        }
      }
   }`;
