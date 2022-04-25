import type { OctokitResponse, RequestParameters } from '@octokit/types';
import type { Fn, Fn2 } from '@thi.ng/api';
import type { CreateLabelQL } from 'gh-cms-ql';
import type { Logger } from '../logger.js';

export type Fx<T> = Fn2<string, RequestParameters, Promise<T>>;
export type Either<T> = [
  Fn<{ logger: Logger }, void>,
  Fn<{ repoQ: Fx<T>; repoR: Fx<T>; repoId: string }, Promise<T>>,
];

export type BuildContent = {
  rId: string | undefined;
  id: unknown;
  date: unknown;
  title: string;
  state: 'OPEN' | 'CLOSED';
  body: string[];
  labels: string[];
  milestone: string;
};

export type OctoR = OctokitResponse<{ node_id: string; title: string }>;
export type PreBuildContent = ['label', CreateLabelQL] | ['milestone', OctoR];
