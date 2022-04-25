import type { RequestParameters } from '@octokit/types';
import type { Fn, Fn2 } from '@thi.ng/api';
import type { Logger } from '../logger.js';

export type Fx = Fn2<string, RequestParameters, Promise<unknown>>;
export type Either<T> = [
  Fn<{ logger: Logger }, void>,
  Fn<{ repoQ: Fx; repoR: Fx; repoId: string }, Promise<T>>,
];

export type BuildContent = {
    rId: string | null;
    id: unknown;
    date: unknown;
    title: string;
    state: 'OPEN' | 'CLOSED',
    body: string[];
    labels: string[];
    milestone: string;
}
