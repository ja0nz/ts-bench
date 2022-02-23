import { graphql } from "@octokit/graphql";
import { request } from "@octokit/request";
import { GH_TOKEN } from "../../api.js";

import { URL } from "node:url";

export const qlrequest = (url: string) => {
  const { pathname } = new URL(url)
  const [OWNER, REPO] = pathname.split("/").filter(Boolean)
  return graphql.defaults({
    headers: {
      authorization: `token ${GH_TOKEN}`,
      accept: "application/vnd.github.bane-preview+json"
    },
    variables: {
      owner: OWNER,
      repo: REPO
    }
  })
};

// Not happy with this, but there is no 'createMilestone' endpoint in graphq
// https://github.community/t/feature-request-create-and-mutate-milestones-using-the-v4-api/14189
export const rerequest = (url: string) => {
  const { pathname } = new URL(url)
  const [OWNER, REPO] = pathname.split("/").filter(Boolean)
  return request.defaults({
    headers: {
      authorization: `token ${GH_TOKEN}`,
      accept: "application/vnd.github.v3+json"
    },
    owner: OWNER,
    repo: REPO
  })
}

export * from "./queryRepo.js";
export * from "./milestone.js";
export * from "./label.js";
export * from "./issue.js";
