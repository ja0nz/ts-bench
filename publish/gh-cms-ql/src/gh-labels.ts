import { qlClient, restClient } from './req-client.js';

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
