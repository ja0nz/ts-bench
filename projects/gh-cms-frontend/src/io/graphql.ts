import { graphql } from "@octokit/graphql";
import { GH_TOKEN } from "../api/node.js"

export const request = (owner: string, repo: string) => {
    return graphql.defaults({
        headers: {
            authorization: `token ${GH_TOKEN}`,
            accept: 'application/vnd.github.v3+json',
        },
        variables: {
            owner,
            repo
        },
    });
};
