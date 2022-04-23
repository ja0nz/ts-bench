import type { RequestParameters, OctokitResponse } from '@octokit/types';
import type { Fn } from '@thi.ng/api';
import { defGetter } from '@thi.ng/paths';
import { jNl, Milestone, Milestones, R1, R2 } from './api.js';
import { endCursor, hasNextPage, pageInfo, totalCount } from './repo.js';

/*
 * Nodes Query
 */
export const queryIdM = 'id';
export const queryNumberM = 'number';
export const queryTitleM = 'title';
export const queryIssueCountM = `issues { ${totalCount} }`;

export const queryM =
  (after = '', n = 100) =>
  (...query: string[]) =>
    `milestones(first: ${n} ${after && `after: "${after}"`}) {
        nodes { ${queryIdM} ${jNl(...query)} }
        ${totalCount}
        ${pageInfo} { ${endCursor} ${hasNextPage} }
      }`;

/*
 * Getters
 */
// Repository
export const getM: Fn<R1<Milestones>, R2<Milestones>> = defGetter<
  R1<Milestones>,
  'milestones'
>(['milestones']);

// Nodes/Leaves
export const getIdM = defGetter<Milestone, 'id'>([queryIdM]);
export const getNumberM = defGetter<Milestone, 'number'>([queryNumberM]);
export const getTitleM = defGetter<Milestone, 'title'>([queryTitleM]);
export const getIssueCountM = defGetter<Milestone, 'issues', 'totalCount'>([
  'issues',
  'totalCount',
]);

/*
 * Mutation
 */
export type CreateMilestone = {
  type: 'milestone';
  action: 'create';
  title: string;
};
export type DeleteMilestone = {
  type: 'milestone';
  action: 'delete';
  id: string; // Milestone number, not node id!
};

/**
 * Milestones modification is the only query with no GraphQL endpoint
 * Hence the 'Rest' in the name
 * @param a Action for either creating or deleting milestones
 */
export function mutateRestM(
  a: CreateMilestone | DeleteMilestone,
): [string, RequestParameters] {
  if (a.action === 'create') {
    return [`POST /repos/{owner}/{repo}/milestones`, { title: a.title }];
  }

  return [`DELETE /repos/{owner}/{repo}/milestones/${a.id}`, {}];
}

/*
 * Mutation Getter
 */
export const getCreateIdM = defGetter<OctokitResponse<any>, 'data', 'node_id'>([
  'data',
  'node_id',
]);
export const getCreateTitleM = defGetter<OctokitResponse<any>, 'data', 'title'>(
  ['data', 'title'],
);
