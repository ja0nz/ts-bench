import { request } from "../io/graphql";
import { get_req_route } from "../api/svelte";
import { REPO } from "../api/node";
import type { RequestEvent } from "@sveltejs/kit/types/internal";
import { URL } from 'node:url';

/**
 * Fetch all issues which (1) are created by me and (2) CLOSED
 * https://docs.github.com/en/graphql/reference/objects#issue
 * */
export const allBlogPosts = `
  query allBlogPosts($owner: String!, $repo: String!, $num: Int = 100) {
    repository(owner: $owner, name: $repo) {
      issues(first: $num, filterBy: {createdBy: $owner, states: CLOSED}) {
        nodes {
          title
          createdAt
          labels(first: 1) {
            nodes {
              name
            }
          }
          # bodyHTML # I may need this
          bodyText # should be fine for fuzzy search
        }
      }
    }
 }
`;

export async function get(req: RequestEvent) {
  let path: string;
  if (REPO && REPO.length) {
    path = new URL(REPO).pathname;
  } else {
    path = get_req_route(req);
  }
  const [owner, repo] = path.split("/").filter(Boolean);

  try {
    const data = await request(owner, repo)(allBlogPosts);
    return {
      body: {
        data: JSON.stringify(data)
      }
    };
  } catch (err) {
    return {
      status: 404,
      body: (<Error>err).message
    }
  }
}
