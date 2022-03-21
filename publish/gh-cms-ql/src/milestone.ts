import type { RequestParameters } from '@octokit/graphql/dist-types/types';
import { comp } from '@thi.ng/compose';
import { defGetter } from '@thi.ng/paths';
import { jNl, Milestone, R1 } from './api.js';
import { endCursor, getR, hasNextPage, pageInfo, totalCount } from './repo.js';

/*
 * Nodes Query
 */
export const queryIdM = 'id';
export const queryNumberM = 'number';
export const queryTitleM = 'title';
export const queryIssueCountM = `issues { ${totalCount} }`;

export const queryM =
  (n = 100, after = '') =>
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
export const getM = comp(defGetter<R1, 'milestones'>(['milestones']), getR);

// Nodes
export const getIdM = comp(defGetter<Milestone, 'id'>([queryIdM]));
export const getNumberM = comp(defGetter<Milestone, 'number'>([queryNumberM]));
export const getTitleM = comp(defGetter<Milestone, 'title'>([queryTitleM]));
export const getIssueCountM = comp(
  defGetter<Milestone, 'issues', 'totalCount'>(['issues', 'totalCount']),
);

/*
 * Mutation
 */
export type CreateMilestone = {
  type: 'create';
  title: string;
};
export type DeleteMilestone = {
  type: 'delete';
  number: number; // Milestone number
};

/**
 * Milestones modification is the only query with no GraphQL endpoint
 * Hence the 'Rest' in the name
 * @param a Action for either creating or deleting milestones
 */
export function mutateRestM(
  a: CreateMilestone | DeleteMilestone,
): [string, RequestParameters] {
  if (a.type === 'create') {
    return [`POST /repos/{owner}/{repo}/milestones`, { title: a.title }];
  }

  return [`DELETE /repos/{owner}/{repo}/milestones/${a.number}`, {}];
}
