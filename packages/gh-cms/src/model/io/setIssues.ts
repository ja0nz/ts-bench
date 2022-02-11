import { qlrequest } from "./net.js";
import type { Blogpost } from "../api.js";

const create = `
  mutation createIssue(
    $ID: String!,
    $title: String!,
    $slug: String = null,
    $labels: [String] = [""],
    $body: String = null,
    $) {
      createIssue(input: {
        repositoryId: $ID
        title: $title
        milestoneId: $slug
        labelIds: $labels
        body: $body
        }) {
          issue {
            id
            title
          }
        }
     }
  `;

const update = `
  mutation updateIssue(
    $ID: String!,
    $title: String!,
    $slug: String = null,
    $labels: [String] = [""],
    $body: String = null,
    $) {
      updateIssue(input: {
        id: $ID
        title: $title
        milestoneId: $slug
        labelIds: $labels
        body: $body
        }) {
          issue {
            id
            title
          }
        }
     }
  `;

export function createBlogPost(
  title: string,
  body: string,
  slug: string = "",
  labels: string[] = []
): Blogpost {
  return {
    title,
    body,
    slug,
    labels
  };
}

export async function setIssues(ID: string, issuexs: Blogpost[], up: boolean = false) {
  const promxs = issuexs.map((i) => {
    return qlrequest(up ? update : create, {
      ID,
      title: i.title,
      body: i.body,
      slug: i.slug,
      labels: i.labels
    });
  });
  return await Promise.all(promxs);
}
