import { graphql } from '@octokit/graphql';
import { request } from '@octokit/request';
import { GH_TOKEN } from './api.js';

export const qlrequest = (url: string) => {
    const { pathname } = new URL(url);
    const [OWNER, REPO] = pathname.split('/').filter(Boolean);
    return graphql.defaults({
        headers: {
            authorization: `token ${GH_TOKEN}`,
            accept: 'application/vnd.github.bane-preview+json',
        },
        variables: {
            owner: OWNER,
            repo: REPO,
        },
    });
};

export const rerequest = (url: string) => {
    const { pathname } = new URL(url);
    const [OWNER, REPO] = pathname.split('/').filter(Boolean);
    return request.defaults({
        headers: {
            authorization: `token ${GH_TOKEN}`,
            accept: 'application/vnd.github.v3+json',
        },
        owner: OWNER,
        repo: REPO,
    });
};
