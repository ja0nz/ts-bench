import { defGetter } from '@thi.ng/paths';
import { comp } from '@thi.ng/compose';
import { jNl, Issue, R1 } from './api.js';
import { endCursor, getR, hasNextPage, pageInfo, totalCount } from './repo.js';

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
export const getI = comp(defGetter<R1, 'issues'>(['issues']), getR);

// Nodes
export const getIdI = comp(defGetter<Issue, 'id'>([queryIdI]));
export const getStateI = comp(defGetter<Issue, 'state'>([queryStateI]));
export const getBodyI = comp(defGetter<Issue, 'body'>([queryBodyI]));
export const getTitleI = comp(defGetter<Issue, 'title'>([queryTitleI]));

/*
 * Mutation
 */
type IssueAction = {
  id: string;
  title?: string;
  body?: string;
  labelIds?: string[];
  milestoneId?: string;
};
export type CreateIssue = IssueAction & { type: 'create'; title: string };
export type UpdateIssue = IssueAction & {
  type: 'update';
  state?: 'OPEN' | 'CLOSED';
};

export const mutateI = (a: CreateIssue | UpdateIssue) =>
  `mutation {
     ${a.type === 'update' ? 'updateIssue' : 'createIssue'}(input: {
        ${a.type === 'update' ? 'id' : 'repositoryId'}: "${a.id}"
        ${a.title ? `title: "${a.title}"` : ''}
        ${a.body ? `body: "${a.body}"` : ''}
        ${
          a.labelIds
            ? `labelIds: [${a.labelIds.map((x) => `"${x}"`).join(',')}]`
            : ''
        }
        ${a.milestoneId ? `milestoneId: "${a.milestoneId}"` : ''}
        ${a.type === 'update' && a.state ? `state: ${a.state}` : ''}
      }) {
        issue {
          id
          title
          state
        }
      }
   }`;
