import { qlrequest, rerequest } from './net';

const cLabel = `
  mutation createLabel(
    $repoID: String!,
    $lname: String!,
    $lcolor: String = "000000") {
      createLabel(input: {
        repositoryId: $repoID
        name: $lname
        color: $lcolor
        }) {
          label {
            name
          }
        }
     }
  `;

// const dLabel = `
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
  return () =>
    rerequest(url)('DELETE /repos/{owner}/{repo}/labels/{name}', {
      name,
    } as any);
}

// CREATES
export function createLabel(url: string, repoID: string, lname: string) {
  return () =>
    qlrequest(url)(cLabel, {
      repoID,
      lname,
      lcolor: Math.floor(Math.random() * 16777215).toString(16),
    });
}
