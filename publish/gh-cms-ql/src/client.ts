import type Process from 'node:process';
import process from 'node:process';

import { graphql } from '@octokit/graphql';
import type { RequestParameters } from '@octokit/graphql/dist-types/types';
import { request } from '@octokit/request';
import { defGetter } from '@thi.ng/paths';
import type { OctokitResponse } from '@octokit/types';

// Process.env
const getEnv = (env: string) =>
  defGetter<typeof Process, 'env'>(['env'])(process)[env];
const ghToken = getEnv('GH_TOKEN') ?? ''; // Github.com -> Settings -> Developer Settings -> Personal access tokens -> token for public repo

export const qlClient = (url: string) => {
  const { pathname } = new URL(url);
  const [owner, repo] = pathname.split('/').filter(Boolean);
  return graphql.defaults({
    headers: {
      authorization: `token ${ghToken}`,
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
        authorization: `token ${ghToken}`,
        accept: 'application/vnd.github.v3+json',
      },
      owner,
      repo,
    })(request_, payload);
  };
