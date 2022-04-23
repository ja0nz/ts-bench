import { defGetter } from '@thi.ng/paths';
import type { Fn } from '@thi.ng/api';
import { comp } from '@thi.ng/compose';
import { jNl, Issue, Issues, Labels, R1, R2, Label } from './api.js';
import {
  endCursor,
  getNodes,
  hasNextPage,
  pageInfo,
  totalCount,
} from './repo.js';
import { queryIdM, queryTitleM } from './milestone.js';

/*
 * Nodes Query
 */
export const queryIdI = 'id';
export const queryStateI = 'state';
export const queryTitleI = 'title';
export const queryBodyI = 'body';
export const queryMilestoneI = `milestone { ${queryIdM} ${queryTitleM} }`;

export const queryI =
  (after = '', n = 100, owner = '$owner') =>
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
export const getMilestoneI = defGetter<Issue, 'milestone'>(['milestone']);
export const getLabelsI: Fn<Issue, Label[] | undefined> = comp(
  (x) => (x ? getNodes<Labels>(x) : x),
  defGetter<Issue, 'labels'>(['labels']),
);
export const getIdI = defGetter<Issue, 'id'>([queryIdI]);
export const getStateI = defGetter<Issue, 'state'>([queryStateI]);
export const getBodyI = defGetter<Issue, 'body'>([queryBodyI]);
export const getTitleI = defGetter<Issue, 'title'>([queryTitleI]);

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
  [
    'mutation issue(',
    '$id: ID!',
    a.title ? '$title: String!' : '',
    a.body ? '$body: String = null' : '',
    a.labelIds ? '$labelIds: [ID!] = [""]' : '',
    a.milestoneId ? '$milestoneId: ID = null' : '',
    a.action === 'update' && a.state ? '$state: IssueState' : '',
    ') {',
    (a.action === 'update' ? 'updateIssue' : 'createIssue').concat('(input: {'),
    (a.action === 'update' ? 'id' : 'repositoryId').concat(': $id'),
    a.title ? 'title: $title' : '',
    a.body ? 'body: $body' : '',
    a.labelIds ? 'labelIds: $labelIds' : '',
    a.milestoneId ? 'milestoneId: $milestoneId' : '',
    a.action === 'update' && a.state ? 'state: $state' : '',
    '}) {',
    'issue {id title state}',
    '}}',
  ].join(' ');
