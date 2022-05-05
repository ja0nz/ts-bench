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
  state?: string;
  title?: string;
  body?: string;
  milestone?: Milestone;
  labels?: R2<Labels>;
  comments?: { nodes: IssueComment[] };
  reactions?: { nodes: Reaction[] };
};

export type IssueComment = {
  author: {
    login: string;
    avatarUrl: URL;
  }
}

export type Reaction = {
  content: "THUMBS_UP" | "THUMBS_DOWN" | "LAUGH" | "HOORAY" | "CONFUSED" | "HEART" | "ROCKET" | "EYES"
}

export type Label = {
  id: string;
  name?: string;
  issues?: { totalCount: number };
};

export type Milestone = {
  id: string;
  title?: string;
  number?: number;
  issues?: { totalCount: number };
};

export type Issues = { issues: Issue };
export type Labels = { labels: Label };
export type Milestones = { milestones: Milestone };
export type Combined = Issues | Labels | Milestones;

export type R0<T extends Combined> = {
  repository: {
    [id in keyof T]: {
      nodes: Array<T[id]>;
      totalCount: number;
      pageInfo: {
        endCursor: string;
        hasNextPage: boolean;
      };
    };
  } & { id: string };
};

/*
 * Indexed Shorthands
 */
export type R1<T extends Combined> = R0<T>['repository'];
export type R2<T extends Combined> = R1<T>[keyof T];

/*
 * Mutation Query
 */
export type CreateLabelQL = { createLabel: { label: Label } }
export type CreateIssueQL = { createIssue: { issue: Issue } }
export type UpdateIssueQL = { updateIssue: { issue: Issue } }
