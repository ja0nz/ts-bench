import { comp } from "@thi.ng/compose";
import { defGetter, getIn } from "@thi.ng/paths";
import { jNl, R1, R2, Repository } from "./api.js";

/*
 * Nodes Query
 */
// Repository
export const queryIdR = "id";

export const queryR = (...query: string[]) =>
  `query ($repo: String!, $owner: String!) {
    repository(name: $repo, owner: $owner) {
      id
      ${jNl(...query)}
    }
  }`;

// R2
export const totalCount = `totalCount`;
export const nodes = `nodes`;
export const pageInfo = `pageInfo`;
export const endCursor = `endCursor`;
export const hasNextPage = `hasNextPage`;

/*
 * Getters
 */
// Repository
export const getR = defGetter<Repository, 'repository'>(['repository']);
export const getIdR = comp(defGetter<R1, 'id'>([queryIdR]), getR);

// R2
export const getNodes = (x: R2) => x && getIn(x, [nodes]);
export const getTotalCount = (x: R2) => x && getIn(x, [totalCount]);
export const getPageInfo = (x: R2) => x && getIn(x, [pageInfo]);
export const getEndCursor = comp(
  (x) => x && getIn(x, [endCursor]),
  getPageInfo,
);
export const getHasNextPage = comp(
  (x) => x && getIn(x, [hasNextPage]),
  getPageInfo,
);
