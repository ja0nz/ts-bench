import { jNl, R1, R2, R0, Combined } from './api.js';

/*
 * Nodes Query
 */
// Repository
export const queryIdR = 'id';

export const queryR = (...query: string[]) =>
  `query ($repo: String!, $owner: String!) {
    repository(name: $repo, owner: $owner) {
      id
      ${jNl(...query)}
    }
  }`;

/*
 * Mutation
 */
export const mutateR = (mutation: string) =>
  `mutation (
     $id: ID!
     # Label
     # $name: String = "label"
     $color: String = "000000"
     # Issue
     $title: String = "issue"
     # $body: String = null
     # $labelIds: [ID] = [""]
     # $milestoneId: ID = null
     # $state: IssueState
   ) {
     ${mutation}
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
export const getR = <T extends Combined>(x: R0<T>) => x.repository;
export const getIdR = <T extends Combined>(x: R1<T>) => x.id;

// R2
export const getNodes = <T extends Combined>(x: R2<T>): R2<T>['nodes'] =>
  x.nodes;
export const getTotalCount = <T extends Combined>(x: R2<T>) => x.totalCount;
export const getPageInfo = <T extends Combined>(x: R2<T>) => x.pageInfo;
export const getEndCursor = <T extends Combined>(x: R2<T>) =>
  getPageInfo<T>(x).endCursor;
export const getHasNextPage = <T extends Combined>(x: R2<T>) =>
  getPageInfo<T>(x).hasNextPage;
