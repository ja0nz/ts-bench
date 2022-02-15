import { qlrequest } from "./net.js";
import { getGHGM_data_route, getGHGM_data_tags, getGHGM_data_title, get_GHGM_raw, GitHubGrayMatter as GHW } from "../api.js";

const create = `
  mutation createIssue(
    $ID: String!,
    $title: String!,
    $route: String = null,
    $labels: [String] = [""],
    $body: String = null) {
      createIssue(input: {
        repositoryId: $ID
        title: $title
        milestoneId: $route
        labelIds: $labels
        body: $body
        }) {
          issue {
            id
            title
            state
          }
        }
     }
  `;

const update = `
  mutation updateIssue(
    $ID: String!,
    $title: String!,
    $route: String = null,
    $labels: [String] = [""],
    $body: String = null) {
      updateIssue(input: {
        id: $ID
        title: $title
        milestoneId: $route
        labelIds: $labels
        body: $body
        }) {
          issue {
            id
            title
            state
          }
        }
     }
  `;

const close = `
  mutation closeIssue(
    $ID: String!) {
      updateIssue(input: {id: ID, state: CLOSED}) {
        clientMutationId
      }
    }
  `;

// CREATES
export function createIssue(url: string, i: GHW) {
    return () => qlrequest(url)(i.issueID ? update : create, {
        ID: i.issueID ? i.issueID : i.repoID,
        title: getGHGM_data_title(i),
        body: get_GHGM_raw(i),
        route: getGHGM_data_route(i),
        labels: getGHGM_data_tags(i)
    })
}

// CLOSE
export function closeIssue(url: string, ID: string) {
    return () => qlrequest(url)(close, {
        ID
    })
}
