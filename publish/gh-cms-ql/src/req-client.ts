import { graphql } from '@octokit/graphql';
import { request } from '@octokit/request';
import { GH_TOKEN } from './api.js';

export const qlClient = (url: string) => {
  const { pathname } = new URL(url);
  const [owner, repo] = pathname.split('/').filter(Boolean);
  return graphql.defaults({
    headers: {
      authorization: `token ${GH_TOKEN}`,
      // https://docs.github.com/en/graphql/overview/schema-previews#labels-preview
      // Mutation.createLabel
      // Mutation.deleteLabel
      // Mutation.updateLabel
      accept: 'application/vnd.github.bane-preview+json',
    },
    variables: {
      owner,
      repo,
    },
  });
};

export const restClient = (url: string) => {
  const { pathname } = new URL(url);
  const [owner, repo] = pathname.split('/').filter(Boolean);
  return request.defaults({
    headers: {
      authorization: `token ${GH_TOKEN}`,
      accept: 'application/vnd.github.v3+json',
    },
    owner,
    repo,
  });
};
