import { graphql } from "@octokit/graphql";
import { GH_TOKEN } from "../api/node.js"

import { URL } from 'node:url';

export const request = (OWNER, REPO) => {
    return graphql.defaults({
        headers: {
            authorization: `token ${GH_TOKEN}`,
            accept: 'application/vnd.github.v3+json',
        },
        variables: {
            owner: OWNER,
            repo: REPO,
        },
    });
};
