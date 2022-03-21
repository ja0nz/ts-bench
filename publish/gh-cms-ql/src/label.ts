import { comp } from '@thi.ng/compose';
import { defGetter } from '@thi.ng/paths';
import { jNl, Label, R1 } from './api.js';
import { endCursor, getR, hasNextPage, pageInfo, totalCount } from './repo.js';

/*
 * Nodes Query
 */
export const queryIdL = 'id';
export const queryNameL = 'name';
export const queryIssueCountL = `issues { ${totalCount} }`;

export const queryL =
  (n = 100, after = '') =>
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
export const getL = comp(defGetter<R1, 'labels'>(['labels']), getR);

// Nodes
export const getIdL = comp(defGetter<Label, 'id'>([queryIdL]));
export const getNameL = comp(defGetter<Label, 'name'>([queryNameL]));
export const getIssueCountL = comp(
  defGetter<Label, 'issues', 'totalCount'>(['issues', 'totalCount']),
);

/*
 * Mutation
 */
export type CreateLabel = {
  type: 'create';
  id: string;
  name: string;
  color?: string;
};
export type DeleteLabel = {
  type: 'delete';
  id: string;
};
export const mutateL = (a: CreateLabel | DeleteLabel) =>
  `mutation {
     ${a.type === 'create' ? 'createLabel' : 'deleteLabel'}(input: {
      ${a.type === 'create' ? 'repositoryId' : 'id'}: "${a.id}"
      ${
        a.type === 'create'
          ? `name: "${a.name}"
         color: "${
           a.color ?? Math.floor(Math.random() * 16_777_215).toString(16)
         }"`
          : ''
      }
    }) {
        ${a.type === 'create' ? 'label{name}' : 'clientMutationId'}
      }
    }
  `;
