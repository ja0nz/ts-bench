import type { Fn } from '@thi.ng/api';
import { defGetter } from '@thi.ng/paths';
import { CreateLabelQL, jNl, Label, Labels, R1, R2 } from './api.js';
import { endCursor, hasNextPage, pageInfo, totalCount } from './repo.js';

/*
 * Nodes Query
 */
export const queryIdL = 'id';
export const queryNameL = 'name';
export const queryIssueCountL = `issues { ${totalCount} }`;

export const queryL =
  (after = '', n = 100) =>
  (...query: string[]) =>
    `labels(first: ${n} ${after && `after: "${after}"`}) {
        nodes { ${queryIdL} ${jNl(...query)} }
        ${totalCount}
        ${pageInfo} { ${endCursor} ${hasNextPage} }
      }`;

/*
 * Getters
 */
// Repository
export const getL: Fn<R1<Labels>, R2<Labels>> = defGetter<R1<Labels>, 'labels'>(
  ['labels'],
);

// Nodes
export const getIdL = defGetter<Label, 'id'>([queryIdL]);
export const getNameL = defGetter<Label, 'name'>([queryNameL]);
export const getIssueCountL = defGetter<Label, 'issues', 'totalCount'>([
  'issues',
  'totalCount',
]);

/*
 * Mutation
 */
export type CreateLabel = {
  type: 'label';
  action: 'create';
  id: string;
  name: string;
  color?: string;
};
export type DeleteLabel = {
  type: 'label';
  action: 'delete';
  id: string;
};

export const mutateL = (a: CreateLabel | DeleteLabel) =>
  (a.action === 'create'
    ? [
        'mutation label(',
        '$id: ID!',
        '$name: String!',
        '$color: String = '.concat(
          '"',
          Math.trunc(Math.random() * 0xff_ff_ff).toString(16),
          '"',
        ),
        ') {',
        'createLabel(input: {',
        'repositoryId: $id',
        'name: $name',
        'color: $color',
        '}) {',
        'label{id name}',
        '}}',
      ]
    : [
        'mutation label(',
        '$id: ID!',
        ') {',
        'deleteLabel(input: {',
        'id: $id',
        '}) {',
        'clientMutationId',
        '}}',
      ]
  ).join(' ');

/*
 * Mutation Getter
 */
export const getCreateL = defGetter<CreateLabelQL, 'createLabel', 'label'>([
  'createLabel',
  'label',
]);
