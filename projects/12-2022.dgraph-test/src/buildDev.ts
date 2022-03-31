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
import { assert } from '@thi.ng/errors';
import { env } from './index.js';

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
  issue2valueFn: any[];
  gm2valueFn: any[];
  qlToken: string;
  gmToken: string;
};
const knownKeys: Record<string, Partial<ReturnValue>> = {
  MD2TITLE: {
    qlToken: 'title',
    issue2valueFn: ['titlePath'],
  },
  MD2LABELS: {
    qlToken: 'labels',
    issue2valueFn: ['labelPath'],
  },
  MD2MILESTONE: {
    qlToken: 'milestone',
    issue2valueFn: ['milestonePath', 'milestoneObjectPath'],
  },
  MD2STATE: {
    qlToken: 'state',
    issue2valueFn: ['statePath'],
  },
};

type R = Reduced<ReturnValue>;
export function stepTree(
  acc: Map<PropertyKey, ReturnValue[]>,
  key: string,
  g: DGraph<string>,
): ReturnValue[] | ReturnValue {
  return step(
    comp(
      trace('1. traversing ROOT value (gray matter):'),
      map<string, string | R>((k) => {
        if (g.isRoot(k))
          return new Reduced({
            gm2valueFn: [k + 'GmFn'],
            gmToken: k,
            qlToken: 'body',
            issue2valueFn: ['extractBodyFn'],
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
                issue2valueFn: knownKeys[key].issue2valueFn ?? [''],
              }),
          );
        return [node];
      }),
      trace('4. Indexed keys[0]:'),
      mapcat<R | ReturnValue[], R | ReturnValue[]>((node) => {
        if (isReduced(node)) return [node];
        const k = key.match(reIndexd);
        if (k) {
          const k0 = Number(k[0]);
          return node.length === 1
            ? node.map(
                (n: ReturnValue) =>
                  new Reduced({
                    ...n,
                    gm2valueFn: [k0, ...n.gm2valueFn],
                  }),
              )
            : [node[k0]].map(
                (n: ReturnValue) =>
                  new Reduced({
                    ...n,
                    issue2valueFn: [k0, ...n.issue2valueFn],
                  }),
              );
        }

        return [node];
      }),
      trace('5. LEAVE values just copy:'),
      mapcat((node) => {
        if (isReduced(node)) return [node];
        return node.map((n) => new Reduced(n));
      }),
      // Trace("6. All values Reduced; extract/deref!"),
      map((node) => node.deref()),
      // Trace("7. Finished!"),
      // trace("---------------------"),
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
