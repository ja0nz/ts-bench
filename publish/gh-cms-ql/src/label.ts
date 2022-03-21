import { comp } from '@thi.ng/compose';
import { defGetter } from '@thi.ng/paths';
import { jNl, jSt, Label, R1 } from './api.js';
import { endCursor, getR, hasNextPage, pageInfo, totalCount } from './repo.js';
import { qlClient, restClient } from './req-client.js';

/*
 * Nodes Query
 */
export const queryIdL = "id";
export const queryNameL = "name";
export const queryIssueCountL = `issues { ${totalCount} }`;

export const queryL =
  (n = 100, after = '') =>
  (...query: string[]) =>
    `labels(first: ${n} ${after && jSt('after: ', after, '')}) {
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
export const getIdL = comp(
  defGetter<Label, 'id'>([queryIdL]),
);
export const getNameL = comp(defGetter<Label, 'name'>([queryNameL]));
export const getIssueCountL = comp(
  defGetter<Label, 'issues', 'totalCount'>([
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


const cLabel = `
  mutation createLabel(
    $repoId: ID!,
    $lname: String!,
    $lcolor: String = "000000") {
      createLabel(input: {
        repositoryId: $repoId
        name: $lname
        color: $lcolor
        }) {
          label {
            name
          }
        }
     }
  `;

// Const dLabel = `
//   mutation deleteLabel(
//     $ID: String!) {
//       deleteLabel(input: {id: $ID}) {
//         clientMutationId
//     }
//   `;

// DELETES
// export function deleteLabel(url: string, ID: string) {
//   console.log("delete", ID, url)
//   return () => qlrequest(url)(dLabel, {
//     ID
//   });
// }

// DELETES
export function deleteLabel(url: string, name: string) {
  return async () =>
    restClient(url)('DELETE /repos/{owner}/{repo}/labels/{name}', {
      name,
    } as any);
}

// CREATES
export function createLabel(url: string, repoId: string, lname: string) {
  return async () =>
    qlClient(url)(cLabel, {
      repoId,
      lname,
      lcolor: Math.floor(Math.random() * 16_777_215).toString(16),
    });
}
