/*
 * Helper
 */
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
