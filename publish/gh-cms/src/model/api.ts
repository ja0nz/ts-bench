import type { OctokitResponse, RequestParameters } from '@octokit/types';
import type { Fn, Fn2 } from '@thi.ng/api';
import type { CreateLabelQL } from 'gh-cms-ql';
import type { Logger } from '../logger.js';

export type QlFx<T> = Fn2<string, RequestParameters, Promise<T>>;
// Bit of a hack to please OctokitResponse
export type ReFx = Fn2<string, RequestParameters, Promise<any>>;
export type Either<T> = [
  Fn<{ logger: Logger }, void>,
  Fn<
    {
      repoQ: QlFx<T extends [string, any] ? T[1] : T>;
      repoR: ReFx;
      repoId: string;
    },
    Promise<T>
  >,
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
