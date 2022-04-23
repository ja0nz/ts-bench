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
  [
    'mutation label(',
    '$id: ID!',
    a.action === 'create' ? '$name: String!' : '',
    a.action === 'create'
      ? '$color: String = '.concat(
          '"',
          Math.floor(Math.random() * 16_777_215).toString(16),
          '"',
        )
      : '',
    ') {',
    (a.action === 'create' ? 'createLabel' : 'deleteLabel').concat('(input: {'),
    (a.action === 'create' ? 'repositoryId' : 'id').concat(': $id'),
    a.action === 'create' ? 'name: $name' : '',
    a.action === 'create' ? 'color: $color' : '',
    '}) {',
    a.action === 'create' ? 'label{id name}' : 'clientMutationId',
    '}}',
  ].join(' ');

/*
 * Mutation Getter
 */
export const getCreateIdL = defGetter<
  CreateLabelQL,
  'createLabel',
  'label',
  'id'
>(['createLabel', 'label', 'id']);
export const getCreateNameL = defGetter<
  CreateLabelQL,
  'createLabel',
  'label',
  'name'
>(['createLabel', 'label', 'name']);
