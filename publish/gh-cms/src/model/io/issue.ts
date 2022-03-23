import { qlClient } from './net.js';
import {
  getMilestone,
  getLabels,
  getTitle,
  get_CMS_raw,
  GH_CMS,
  get_CMS_id,
  get_CMS_rid,
  get_CMS_state,
} from '../api.js';

const create = `
  mutation createIssue(
    $ID: ID!,
    $title: String!,
    $route: ID = null,
    $labels: [ID!] = [""],
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
    $ID: ID!,
    $title: String!,
    $state: IssueState,
    $route: ID = null,
    $labels: [ID!] = [""],
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
    $ID: ID!
    $state: IssueState) {
      updateIssue(input: {id: $ID, state: $state}) {
        clientMutationId
      }
    }
  `;

// CREATES
export function createIssue(url: string, i: GH_CMS) {
  const id = get_CMS_id(i);
  const rid = get_CMS_rid(i);
  return () =>
    qlClient(url)(id ? update : create, {
      ID: id ? id : rid,
      title: getTitle(i),
      route: getMilestone(i),
      labels: getLabels(i),
      body: get_CMS_raw(i),
      state: get_CMS_state(i),
    });
}

// UPDATE
export function modifyState(url: string, ID: string, state: string) {
  return () =>
    qlClient(url)(close, {
      ID,
      state,
    });
}
