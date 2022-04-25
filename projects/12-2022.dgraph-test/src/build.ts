import { DGraph } from '@thi.ng/dgraph';
import {
  comp,
  iterator,
  last,
  map,
  mapcat,
  reducer,
  scan,
  trace,
  step,
  Reduced,
  isReduced,
} from '@thi.ng/transducers';
import { comp as c } from "@thi.ng/compose";
import { assert } from '@thi.ng/errors';
import { defGetterUnsafe } from '@thi.ng/paths';
import type { Fn } from '@thi.ng/api';
import {
  getBodyI,
  getLabelsI,
  getMilestoneI,
  getStateI,
  getTitleI,
  getTitleM,
  Issue,
  queryBodyI,
  queryL,
  queryMilestoneI,
  queryNameL,
  queryStateI,
  queryTitleI,
} from 'gh-cms-ql';
import { env } from './index.js';
import type { NumOrString } from '@thi.ng/api';

// Make const
const reIndexd = /(?<=\[)(\d+?)(?=])/g;
export function buildDag() {
  const g = new DGraph<string>();

  type Stup = [string, string];
  const out: IterableIterator<Stup> = iterator(
    comp(
      mapcat<Stup, Stup>(([k, v]) => v.split(',').map((v1) => [k, v1])),
      mapcat<Stup, Stup>(([k, v]) => {
        const indexs = v.match(reIndexd);
        const returnValue: Stup[] = [];
        if (indexs !== null) {
          assert(indexs.length < 2, `Only one index level allowed: ${v}`);
          const [v1] = v.split('[');
          returnValue.push([v, v1]);
        }

        returnValue.push([k, v]);
        return returnValue;
      }),
    ),
    Object.entries(env),
  );
  for (const row of out) {
    g.addDependency(...row);
  }

  return g;
}

/*
 * QlToken -> comp(qlTokenI(), qlTokenR, repoQ)(qlToken)
 * gm2valueFn -> GH_CMS / GrayMatter only! -> value
 * gmToken -> keys that needs to be present
 * issue2valueFn -> parsedIssue -> value
 */
type ReturnValue = {
  issue2valueFn: Array<Fn<Issue | any, unknown>>;
  gm2valueFn: any;
  qlToken: string;
  gmToken: string;
};
const knownKeys: Record<string, Partial<ReturnValue>> = {
  MD2TITLE: {
    qlToken: queryTitleI,
    issue2valueFn: [getTitleI],
  },
  MD2LABELS: {
    qlToken: queryL()(queryNameL),
    issue2valueFn: [getLabelsI],
  },
  MD2MILESTONE: {
    qlToken: queryMilestoneI,
    issue2valueFn: [getTitleM, getMilestoneI],
  },
  MD2STATE: {
    qlToken: queryStateI,
    issue2valueFn: [getStateI],
  },
};

// GetInParsed -> compressed
const getInParsed = (key: NumOrString) =>
    defGetterUnsafe<string>(["parsed", "data", key])

type R = Reduced<ReturnValue>;
export function stepTree(
  acc: Map<PropertyKey, ReturnValue[]>,
  key: string,
  g: DGraph<string>,
): ReturnValue[] | ReturnValue {
  return step(
    comp(
      // Trace('1. traversing ROOT value (gray matter):'),
      map<string, string | R>((k) => {
        if (g.isRoot(k))
          return new Reduced({
            gm2valueFn: [getInParsed(k)],
            gmToken: k,
            qlToken: queryBodyI,
            issue2valueFn: [getBodyI],
          });
        return k;
      }),
      // Trace("2. expand dependencies:"),
      mapcat<R | string, R | string>((x) => {
        if (isReduced(x)) return [x];
        return g.immediateDependencies(x);
      }),
      // Trace("2.1. map dependencies to nodes:"),
      map<R | string, R | ReturnValue[]>((x) => {
        if (isReduced(x)) return x;
        return acc.get(x) ?? [];
      }),
      // Trace("3. Known keys (set in .env):"),
      mapcat<R | ReturnValue[], R | ReturnValue[]>((node) => {
        if (isReduced(node)) return [node];
        if (knownKeys[key])
          return node.map(
            (n) =>
              new Reduced({
                ...n,
                qlToken: knownKeys[key].qlToken ?? '',
                issue2valueFn: knownKeys[key].issue2valueFn ?? [],
              }),
          );
        return [node];
      }),
      // Trace('4. Indexed keys[0]:'),
      mapcat<R | ReturnValue[], R | ReturnValue[]>((node) => {
        if (isReduced(node)) return [node];
        const k = key.match(reIndexd);
        const getIndex =
          (n: number): Fn<string, string> =>
          (x: string) =>
            typeof x === 'string' ? x.split(',')[n] : x;
        if (k) {
          const k0 = Number(k[0]);
          return node.length === 1
            ? node.map(
                (n: ReturnValue) =>
                  new Reduced({
                    ...n,
                    gm2valueFn: [getIndex(k0), ...n.gm2valueFn],
                  }),
              )
            : [node[k0]].map(
                (n: ReturnValue) =>
                  new Reduced({
                    ...n,
                    issue2valueFn: [getIndex(k0), ...n.issue2valueFn],
                  }),
              );
        }

        return [node];
      }),
      // Trace('5. LEAF values just copy:'),
      mapcat((node) => {
        if (isReduced(node)) return [node];
        return node.map((n) => new Reduced(n));
      }),
      // Trace("6. All values Reduced; extract/deref!"),
      map((node) => node.deref()),
      // Trace("7. Finished!"),
      trace('---------------------'),
    ),
  )(key);
}

export function dagAction(g: DGraph<string>) {
  return last(
    scan(
      reducer(
        () => new Map<PropertyKey, ReturnValue[]>(),
        (acc, key: string) => {
          const returnValue = stepTree(acc, key, g);
          return acc.set(
            key,
            Array.isArray(returnValue) ? returnValue : [returnValue],
          );
        },
      ),
      new Map(),
      g,
    ),
  );
}
