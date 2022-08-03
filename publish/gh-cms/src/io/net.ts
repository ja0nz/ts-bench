import type { RequestParameters } from '@octokit/graphql/dist-types/types';
import type { OctokitResponse } from '@octokit/types';
import { graphql } from '@octokit/graphql';
import { request } from '@octokit/request';
import { URL } from 'node:url';
import { GH_TOKEN } from '../api.js';

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


/**
 * Query the GitHub API with REST (only needed with milestone modification)
 * @param url A repostitory url related to the injected GH_TOKEN
 */
export const restClient =
  (url: string) =>
  /**
   * Fn2; Use with spread paramenter
   * ```typescript
   * restClient(url)(...spread)
   * ```
   * @param request_ A **GET / POST** uri; see https://docs.github.com/en/rest/reference
   * @param payload A payload object with request parameters
   */
  async (
    request_: string,
    payload: RequestParameters,
  ): Promise<OctokitResponse<any>> => {
    const { pathname } = new URL(url);
    const [owner, repo] = pathname.split('/').filter(Boolean);
    return request.defaults({
      headers: {
        authorization: `token ${GH_TOKEN}`,
        accept: 'application/vnd.github.v3+json',
      },
      owner,
      repo,
    })(request_, payload);
  };
