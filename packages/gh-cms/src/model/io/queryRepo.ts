import { getIn } from "@thi.ng/paths";
import type { Repository } from "../api.js";

export const queryStrRepo = (...query: string[]) => `
  query ($repo: String!, $owner: String!) {
    repository(name: $repo, owner: $owner) {
      ${query}
    }
  }`;

export const queryQLIssues = (...query: string[]) => `
      issues(first: 100, filterBy: {createdBy: $owner, states: CLOSED}) {
        nodes { id ${query.length ? query : ""} }
      }`

export const queryQLLabels = (...query: string[]) => `
      labels(first: 100) {
        nodes { id name ${query.length ? query : ""} }
      }`

export const queryQLMilestones = (...query: string[]) => `
      milestones(first: 100) {
        nodes { id title number ${query.length ? query : ""} }
      }`

export function getInRepo<T extends keyof Repository["repository"]>(state: Repository, k: T): Repository["repository"][T] {
  const res = getIn<Repository, "repository">(state, ["repository"]);
  return res[k];
}
