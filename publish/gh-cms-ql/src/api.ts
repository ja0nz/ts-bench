import type Process from 'node:process';
import process from 'node:process';
import { defGetter, getIn } from '@thi.ng/paths';
import { comp } from '@thi.ng/compose';

// Process.env
const getEnv = (env: string) =>
  defGetter<typeof Process, 'env'>(['env'])(process)[env];
const ghToken = getEnv('GH_TOKEN') ?? ''; // Github.com -> Settings -> Developer Settings -> Personal access tokens -> token for public repo
export { ghToken as GH_TOKEN };

/*
 * Helper
 */
export function jSt(...args: string[]) {
  return args.join('"');
}

export function jNl(...args: string[]) {
  return args.join('\n');
}

/*
 * GraphQL
 */
export type Issue = {
  id: string;
  state: string;
  title?: string;
  body?: string;
};
export type Label = {
  id: string;
  name: string;
  issues?: { totalCount: number };
};

export type Milestone = {
  id: string;
  title: string;
  number: number;
  issues?: { totalCount: number };
};

type MappedGhFields = {
  issues: Issue;
  labels: Label;
  milestones: Milestone;
};

type MappedRep = {
  repository: {
    [id in keyof Partial<MappedGhFields>]: {
      nodes: Array<MappedGhFields[id]>;
      totalCount: number;
      pageInfo: {
        endCursor: string;
        hasNextPage: boolean;
      };
    };
  };
};

export type Repository = MappedRep & { repository: { id: string } };
/*
 * Indexed Shorthands
 */
export type R1 = Repository['repository'];
export type R2 = R1['issues'] | R1['labels'] | R1['milestones'];



// Const obj: Repository = {
//   "repository": {
//     "id": "foo",
//     "issues": {
//       nodes: [{ id: "a", state: "b" }],
//       totalCount: 33,
//       pageInfo: {
//         endCursor: "fo",
//         hasNextPage: true
//       }
//     }
//   }
// }
// const obj1: Repository = {
//   "repository": {
//     "id": "fo"
//   }
// }
// console.log(obj)
// console.log(obj1)
