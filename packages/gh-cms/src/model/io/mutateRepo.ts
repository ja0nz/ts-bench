import { qlrequest, rerequest } from "./net";

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

export function deleteMilestone(url: string, milestone_number: number) {
  return () => rerequest(url)(
    'DELETE /repos/{owner}/{repo}/milestones/{milestone_number}',
    { milestone_number } as any
  );
}

// CREATES
export function createLabel(url: string, repoID: string, lname: string) {
  return () => qlrequest(url)(cLabel, {
    repoID,
    lname,
    lcolor: Math.floor(Math.random() * 16777215).toString(16)
  });
}

export function createMilestone(url: string, title: string) {
  return () => rerequest(url)(
    'POST /repos/{owner}/{repo}/milestones',
    { title } as any
  );
}
