import { defGetter, getIn } from '@thi.ng/paths';
import { comp } from '@thi.ng/compose';
import { jSt, jNl, Repository, Label, Milestone, Issue } from './api.js';

// Access
const queryId = `id`;
const totalCount = `totalCount`;
const nodes = `nodes`;
const pageInfo = `pageInfo`;
const endCursor = `endCursor`;
const hasNextPage = `hasNextPage`;
// Issues
const queryStateI = `state`;
const queryTitleInM = `title`;
const queryBodyI = `body`;
// Labels
const queryNameL = `name`;
// Milestones
// Title
const queryNumberM = `number`;

type R = Repository['repository'];
type R2 = R['issues'] | R['labels'] | R['milestones'];

// Repo - Layer 1
// Usage: getRepoI(repo)
export const getRepo = defGetter<Repository, 'repository'>(['repository']);
export const getRepoI = comp(defGetter<R, 'issues'>(['issues']), getRepo);
export const getRepoL = comp(defGetter<R, 'labels'>(['labels']), getRepo);
export const getRepoM = comp(
  defGetter<R, 'milestones'>(['milestones']),
  getRepo,
);
export const getRepoId = comp(defGetter<R, 'id'>([queryId]), getRepo);

// Repo - Layer 2
// Usage: comp(getNodes, <layer1>)(repo)
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

// Nodes - Array!
// Usage: for/map -> comp(getNodes <layer1>)(repo)
export const getId = comp(
  defGetter<Issue | Label | Milestone, 'id'>([queryId]),
);
export const getState = comp(defGetter<Issue, 'state'>([queryStateI]));
export const getBody = comp(defGetter<Issue, 'body'>([queryBodyI]));
export const getName = comp(defGetter<Label, 'name'>([queryNameL]));
export const getTitle = comp(
  defGetter<Issue | Milestone, 'title'>([queryTitleInM]),
);
export const getNumber = comp(defGetter<Milestone, 'number'>([queryNumberM]));
export const getIssueCount = comp(
  defGetter<Milestone | Label, 'issues', 'totalCount'>([
    'issues',
    'totalCount',
  ]),
);

export const queryRepo = (...query: string[]) => `
  query ($repo: String!, $owner: String!) {
    repository(name: $repo, owner: $owner) {
      id
      ${jNl(...query)}
    }
  }`;

export const queryIssues =
  (n = 100, after = '', owner = '$owner') =>
  (...query: string[]) =>
    `issues(first: ${n} ${
      after && jSt('after: ', after, '')
    } filterBy: {createdBy: ${owner}}) {
        nodes { ${queryId} ${queryStateI} ${jNl(...query)} }
        ${totalCount}
        ${pageInfo} { ${endCursor} ${hasNextPage} }
      }`;

export const queryLabels =
  (n = 100, after = '') =>
  (...query: string[]) =>
    `labels(first: ${n} ${after && jSt('after: ', after, '')}) {
        nodes { ${queryId} ${queryNameL} ${jNl(...query)} }
        ${totalCount}
        ${pageInfo} { ${endCursor} ${hasNextPage} }
      }`;

export const queryMilestones =
  (n = 100, after = '') =>
  (...query: string[]) =>
    `milestones(first: ${n} ${after && jSt('after: ', after, '')}) {
        nodes { id title number ${jNl(...query)} }
        ${totalCount}
        ${pageInfo} { ${endCursor} ${hasNextPage} }
      }`;
