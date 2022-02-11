import { request } from "./io";
import type { Label } from "./api";

const query = `
  mutation createLabel(
    $repoID: String!,
    $lname: String!,
    $ldesc: String = null,
    $lcolor: String = "000000") {
      createLabel(input: {
        repositoryId: $repoID
        name: $lname
        description: $ldesc
        color: $lcolor
        }) {
          label {
            name
          }
        }
     }
  `;

export function createLabel(name: string, description: string = null): Label {
  return {
    name,
    description
  };
}

export async function setLabel(repoID: string, l: Label) {
  return await request(query, {
    repoID,
    lname: l.name,
    ldesc: l.description,
    lcolor: Math.floor(Math.random() * 16777215).toString(16)
  });
}

export async function setLabels(repoID: string, lxs: Label[]) {
  return await Promise.all(lxs.map((l) => setLabel(repoID, l)));
}
