import { qlrequest } from "./net";

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

const dLabel = `
  mutation deleteLabel(
    $id: String!) {
      deleteLabel(input: {
        id: $id
      }) {
        clientMutationId
    }
  `;

// DELETES
export function deleteLabel(url: string, id: string) {
    return () => qlrequest(url)(dLabel, {
        id
    });
}

// CREATES
export function createLabel(url: string, repoID: string, lname: string) {
    return () => qlrequest(url)(cLabel, {
        repoID,
        lname,
        lcolor: Math.floor(Math.random() * 16777215).toString(16)
    });
}
