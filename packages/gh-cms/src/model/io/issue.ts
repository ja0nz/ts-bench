import { qlrequest } from "./net.js";
import { get_parsed_route, get_parsed_tags, get_parsed_title, get_CMS_raw, GH_CMS, get_CMS_id, get_CMS_rid, get_CMS_state } from "../api.js";

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
    $state: String!,
    $route: String = null,
    $labels: [String] = [""],
    $body: String = null) {
      updateIssue(input: {
        id: $ID
        title: $title
        milestoneId: $route
        labelIds: $labels
        state: $state
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
    $ID: String!
    $state: String!) {
      updateIssue(input: {id: $ID, state: $state}) {
        clientMutationId
      }
    }
  `;

// CREATES
export function createIssue(url: string, i: GH_CMS) {
  const id = get_CMS_id(i)
  const rid = get_CMS_rid(i)
  const state = get_CMS_state(i)
  return () => qlrequest(url)(id ? update : create, {
    ID: id ? id : rid,
    title: get_parsed_title(i),
    body: get_CMS_raw(i),
    route: get_parsed_route(i),
    state: state ? state : "OPEN", //TODO
    labels: get_parsed_tags(i)
  })
}

// CLOSE
export function closeIssue(url: string, ID: string, state: string) {
  return () => qlrequest(url)(close, {
    ID,
    state
  })
}
