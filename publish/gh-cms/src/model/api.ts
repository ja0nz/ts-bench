import type { RequestParameters } from '@octokit/types';
import type { Fn, Fn2 } from '@thi.ng/api';
import type { Logger } from '../logger.js';

export type Fx = Fn2<string, RequestParameters, Promise<unknown>>;
export type Either = [
  Fn<{ logger: Logger }, void>,
  Fn<{ repoQ: Fx; repoR: Fx; repoId: string }, Promise<unknown>>,
];
