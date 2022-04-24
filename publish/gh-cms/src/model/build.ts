import {
  comp,
  reducer,
  partition,
  filter,
  flatten,
  map,
  mapcat,
  multiplex,
  push,
  transduce,
  last,
  scan,
  distinct,
  iterator,
  step,
  Reduced,
  isReduced,
  cat,
  str,
  assocMap,
} from '@thi.ng/transducers';
import { comp as c } from '@thi.ng/compose';
import grayMatter, { GrayMatterFile } from 'gray-matter';
import type { Fn } from '@thi.ng/api';
import { DGraph } from '@thi.ng/dgraph';
import { assert } from '@thi.ng/errors';
import {
  getBodyI,
  getEndCursor,
  getHasNextPage,
  getLabelsI,
  getMilestoneI,
  getNodes,
  getR,
  getStateI,
  getTitleI,
  Milestone,
  queryBodyI,
  queryI,
  queryL,
  queryMilestoneI,
  queryNameL,
  queryR,
  queryStateI,
  queryTitleI,
  getTitleM,
  Issue,
  R2,
  R1,
  Combined,
  queryM,
  queryTitleM,
  Label,
  getIdL,
  getNameL,
  mutateL,
  mutateRestM,
  mutateI,
  CreateIssueQL,
  UpdateIssueQL,
  getCreateI,
  getUpdateI,
  getIdI,
} from 'gh-cms-ql';
import type { graphql } from '@octokit/graphql/dist-types/types';
import type { ActionObj, DGraphFields, MDActionMap, MDENV } from '../api.js';
import {
  modifyState,
  createIssue,
  createLabel,
  createMilestone,
} from './io/net.js';
import { getInParsed, indexdIdentifier } from './api.js';

/*
 * IN: { "MD2ID": string, ... }
 * OUT: DGraph<string> (MD2TITLE, MD2TITLE[2], draft)
 */
export function buildDag(env: typeof MDENV): DGraph<DGraphFields> {
  const g = new DGraph<DGraphFields>();

  type ROW = [string, string];
  const out: IterableIterator<ROW> = iterator(
    comp(
      mapcat<ROW, ROW>(([k, v]) => v.split(',').map((v1) => [k, v1])),
      mapcat(([k, v]) => {
        const indexs = v.match(indexdIdentifier);
        const returnValue: ROW[] = [];
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

const knownKeys: Record<string, Partial<ActionObj>> = {
  MD2TITLE: {
    qlToken: queryTitleI,
    issue2valueFn: getTitleI,
  },
  MD2LABELS: {
    qlToken: queryL()(queryNameL),
    issue2valueFn: getLabelsI,
  },
  MD2MILESTONE: {
    qlToken: queryMilestoneI,
    issue2valueFn: c(
      (m: Milestone | undefined) => m && getTitleM(m),
      getMilestoneI,
    ),
  },
  MD2STATE: {
    qlToken: queryStateI,
    issue2valueFn: getStateI,
  },
};

function stepTree(
  acc: MDActionMap,
  key: DGraphFields,
  g: DGraph<DGraphFields>,
): ActionObj[] | ActionObj {
  // May be MD2ID, MD2ID[2], id, or Reduced
  type ActionFieldsReduced = DGraphFields | Reduced<ActionObj>;
  type ActionReduced = Reduced<ActionObj> | ActionObj[];
  return step(
    comp(
      // Trace('1. traversing ROOT value (gray matter):'),
      map<DGraphFields, ActionFieldsReduced>((k) => {
        if (g.isRoot(k))
          return new Reduced({
            gm2valueFn: getInParsed(k),
            gmToken: k,
            qlToken: queryBodyI,
            issue2valueFn: getBodyI,
          });
        return k;
      }),
      // Trace("2. expand dependencies:"),
      mapcat<ActionFieldsReduced, ActionFieldsReduced>((x) => {
        if (isReduced(x)) return [x];
        return g.immediateDependencies(x);
      }),
      // Trace("2.1. map dependencies to nodes:"),
      map<ActionFieldsReduced, ActionReduced>((x) => {
        if (isReduced(x)) return x;
        return acc.get(x) ?? [];
      }),
      // Trace("3. Known keys (set in .env):"),
      mapcat<ActionReduced, ActionReduced>((node) => {
        if (isReduced(node)) return [node];
        if (knownKeys[key])
          return node.map(
            (n) =>
              new Reduced({
                ...n,
                qlToken: knownKeys[key].qlToken ?? '',
                issue2valueFn: knownKeys[key].issue2valueFn ?? ((x) => x),
              }),
          );
        return [node];
      }),
      // Trace('4. Indexed keys[0]:'),
      mapcat<ActionReduced, ActionReduced>((node) => {
        if (isReduced(node)) return [node];
        const k = key.match(indexdIdentifier);
        const getIndex =
          (n: number): Fn<string, string> =>
          (x: string) =>
            typeof x === 'string' ? x.split(',')[n] : x;
        if (k) {
          const k0 = Number(k[0]);
          return node.length === 1
            ? node.map(
                (n: ActionObj) =>
                  new Reduced({
                    ...n,
                    gm2valueFn: c(getIndex(k0), n.gm2valueFn),
                  }),
              )
            : [node[k0]].map(
                (n: ActionObj) =>
                  new Reduced({
                    ...n,
                    issue2valueFn: c(getIndex(k0), n.issue2valueFn),
                  }),
              );
        }

        return [node];
      }),
      // Trace('5. LEAF values just copy:'),
      mapcat<ActionReduced, Reduced<ActionObj>>((node) => {
        if (isReduced(node)) return [node];
        return node.map((n) => new Reduced(n));
      }),
      // Trace("6. All values Reduced; extract/deref!"),
      map((node) => node.deref()),
      // Trace("7. Finished!"),
      // trace('---------------------'),
    ),
  )(key);
}

/*
 * IN: DGraph<string>
 * OUT: Map<string, ActionObj[]>
 */
export function dag2MDActionMap(g: DGraph<DGraphFields>): MDActionMap {
  return last(
    scan(
      reducer(
        () => new Map<DGraphFields, ActionObj[]>(),
        (acc, key: DGraphFields) => {
          const actionObject = stepTree(acc, key, g);
          return acc.set(
            key,
            Array.isArray(actionObject) ? actionObject : [actionObject],
          );
        },
      ),
      new Map(),
      g,
    ),
  );
}

/*
 * A function that helps to page through GitHub Issues
 */
type GHCursor = string;
export function queryIPager(
  ...actionObject: Array<ActionObj[] | undefined>
): Fn<GHCursor, string> {
  const join = transduce(
    comp(
      filter(Array.isArray),
      cat<ActionObj>(),
      map((x: ActionObj) => x.qlToken),
    ),
    str('\n'),
    actionObject,
  );
  return (s: GHCursor) => c(queryR, queryI(s))(join);
}

export function queryLPager(): Fn<GHCursor, string> {
  return (s: GHCursor) => c(queryR, queryL(s))(queryNameL);
}

export function queryMPager(): Fn<GHCursor, string> {
  return (s: GHCursor) => c(queryR, queryM(s))(queryTitleM);
}

export async function fetchExhaust<T extends Combined>(
  client: graphql,
  query: Fn<GHCursor, string>,
  getter: Fn<R1<T>, R2<T>>,
): Promise<Array<T[keyof T]>> {
  const nodes: Array<T[keyof T]> = [];
  let cursor: GHCursor = '';
  while (true) {
    const ql = await client(query(cursor));
    const qPayLoad = c(getter, getR)(ql);
    nodes.push(...(getNodes<T>(qPayLoad) as Array<T[keyof T]>));
    if (getHasNextPage<T>(qPayLoad)) {
      cursor = getEndCursor<T>(qPayLoad);
      continue;
    }

    break;
  }

  return nodes;
}

type NewIssue = {
  id: string;
  date: Date;
  iId: string;
  iTitle: string;
  iLabels: string[];
  iMilestone: string;
  iState: boolean;
  isEmpty: boolean;
  raw: string;
} & GrayMatterFile<string>;

/*
 * Parse remote or local issues
 * depending on the number of actionObjects the output rows differ
 * in size and shape. Therefore unkown[] typed.
 */
export function parseIssues(
  iXs: Array<Issue | GrayMatterFile<string>>,
  ...actionObject: Array<ActionObj[] | undefined>
): unknown[][] {
  // --- iXs (issues)
  return transduce(
    map(
      (issue) =>
        // --- aXs (actions)
        transduce(
          comp(
            filter(Array.isArray),
            map(
              (aXs: ActionObj[]) =>
                // --- each action
                map((a: ActionObj) => {
                  const pValue = a.issue2valueFn(issue) ?? a.gm2valueFn(issue);
                  // Must be a issues far
                  if (typeof pValue === 'string' && a.qlToken === 'body') {
                    return a.gm2valueFn(grayMatter(pValue));
                  }

                  return pValue;
                }, aXs),
              // -- end each action
            ),
            map((a) => [...a]), // Flat iterator
            mapcat((a) => (a.length > 1 ? [a.join(',')] : a)), // Join if combined value (= must be string)
          ),
          push(),
          actionObject,
        ),
      // -- end aXs
    ),
    push(),
    iXs,
  );
  // -- end iXs
}

/*
 * Just a little helper to pull in the remote ID to parsedIssues
 * A lot of unknown here. Is on purpose as various datatypes (string, date, number,...)
 * can be used for decode the specific variable
 */
export function patchedIssued2Map(
  patchedIdFar: IterableIterator<[unknown[], string]>,
) {
  type I = IterableIterator<[[unknown, unknown, ...unknown[]], string]>;
  type O = [unknown, unknown[]];
  return transduce(
    map<I, O>(([[id, date], rId]) => [id, [date, rId]]),
    assocMap<unknown, unknown[]>(),
    patchedIdFar as any,
  );
}

export function labelsMilestones2Map<T extends Label | Milestone>(
  labelMilestoneNodes: T[],
): Map<string, string> {
  return transduce(
    comp(
      map((x) => {
        const id = getIdL(x);
        const key = getNameL(x) ?? getTitleM(x);
        return [key, id];
      }),
    ),
    assocMap(),
    labelMilestoneNodes,
  );
}

export function nearFarMerge(near: any, far: any) {
  // A bit of a hack
  const isValidDate = (dateLike: any): boolean =>
    dateLike instanceof Date && !isNaN(dateLike as any);

  return transduce(
    comp(
      // Flatten out zipped content
      // Interleave remote GH issue id
      map(([[id, date, ...r1], ...r2]) => {
        // 'Null' from no remote id
        if (!far.has(id)) return [null, id, date, ...r1, ...r2];
        const [_, rId] = far.get(id);
        // Prepend remote id
        return [rId, id, date, ...r1, ...r2];
      }),
      // Filter content for rows without update
      filter(([_, id, date]) => {
        // 1. no far equivalent == new content
        if (!far.has(id)) return true;

        // 2. no near date means push anyway - no dropping here
        const nearDate = new Date(isNaN(date) ? date : Number(date));
        if (!isValidDate(nearDate)) return true;

        // 3. no far date means push anyway - after this far has a date
        const [dateFar] = far.get(id);
        const farDate = new Date(isNaN(dateFar) ? dateFar : Number(dateFar));
        if (!isValidDate(farDate)) return true;

        // 4. if modified content push it
        if (nearDate > farDate) return true;
        return false;
      }),
      // 5. Flip row to object
      map(([rId, id, date, title, labels, milestone, state, ...body]) => ({
        rId,
        id,
        date,
        title,
        labels,
        milestone,
        state,
        body,
      })),
      // 5. Labels and Milestones to string (GH issue format):
      // transform dates to ISO strings because String(date) is not portable
      map(({ labels, milestone, ...r }) => {
        const lMapped =
          labels?.map?.((x: unknown) =>
            String((x as Date)?.toISOString?.() ?? x),
          ) ?? String(labels);
        const mMapped = String(milestone?.toISOString?.() ?? milestone);
        return { ...r, labels: lMapped, milestone: mMapped };
      }),
    ),
    push(),
    near,
  );
}

/*
 * Generate sideEffects
 * - labels and milestones
 */
export function preBuildModel(
  rows: any[],
  lM: Map<string, string>,
  mM: Map<string, string>,
): Array<[Fn<any, any>, Fn<any, any>]> {
  return transduce(
    comp(
      multiplex(
        comp(
          // Labels
          mapcat(({ labels }) => (Array.isArray(labels) ? labels : [labels])),
          filter((l) => l !== 'undefined' && !lM.has(l)), // String(undefined)
          distinct(),
          map((l) => [
            ({ logger }) => {
              logger.info(`DRY; Create missing label: ${l}`);
            },
            ({ repoQ, repoId }) => {
              const ql = {
                type: 'label',
                action: 'create',
                id: repoId,
                name: l,
              };
              return repoQ(mutateL(ql), ql).then((x) => ['label', x]);
            },
          ]),
        ),
        comp(
          // Milestones
          map(({ milestone }) => milestone),
          filter((m) => m !== 'undefined' && !mM.has(m)), // String(undefined)
          distinct(),
          map((m) => [
            ({ logger }) => {
              logger.info(`DRY; Create missing milestone: ${m}`);
            },
            ({ repoR }) =>
              repoR(
                ...mutateRestM({
                  type: 'milestone',
                  action: 'create',
                  title: m,
                }),
              ).then((x) => ['milestone', x]),
          ]),
        ),
      ),
      cat(), // Flatting to remove undefined (labels or milestones)
      filter((x) => x !== undefined),
      flatten(), // Completely flatten
      partition(2), // Repartition by 2
    ),
    push(),
    rows,
  );
}

/*
 * Generate sideEffects
 * - issues
 */
export function buildModel(
  rows: any[],
  lM: Map<string, string>,
  mM: Map<string, string>,
): Array<[Fn<any, any>, Fn<any, any>]> {
  return transduce(
    comp(
      map(({ rId, title, labels, milestone, body }) => {
        const action = rId ? 'update' : 'create';
        const data = {
          type: 'issue',
          action,
          title,
          body: body.join(''),
          labelIds: labels?.map?.((l) => lM.get(l) ?? `DRY:${l}`) ?? [],
          milestoneId: mM.get(milestone) ?? '',
        };
        return [
          ({ logger }) => {
            logger.info(`DRY; ${action} issue: ${logger.pp(data)}`);
          },
          ({ repoQ, repoId }) => {
            const ql = { ...data, id: rId ?? repoId };
            return repoQ(mutateI(ql), ql);
          },
        ];
      }),
    ),
    push(),
    rows,
  );
}

export function issues2Map(issues: Array<CreateIssueQL | UpdateIssueQL>) {
  return transduce(
    comp(
      map((x) => getCreateI(x as any) ?? getUpdateI(x as any)),
      map((x) => [getTitleI(x), x]),
    ),
    assocMap<string, Issue>(),
    issues,
  );
}

/*
 * Generate sideEffects
 * - issues
 */
export function postBuildModel(rows, buildMap) {
  return transduce(
    comp(
      filter(({ title, state }) => {
        const ghState = getStateI(buildMap.get(title));
        assert(
          ghState !== undefined,
          `PostBuild: Something is not right with issue ${title}`,
        );
        return state !== ghState;
      }),
      map(({ title, ...r }) => {
        const rId = getIdI(buildMap.get(title));
        assert(
          rId !== undefined,
          `PostBuild: Something is not right with issue ${title}`,
        );
        return { ...r, rId };
      }),
      map(({ rId, state }) => {
        const ql = {
          type: 'issue',
          action: 'update',
          id: rId,
          state,
        };
        return [
          ({ logger }) => {
            logger.info(`DRY; Can't run dry postbuild without building -_-`);
          },
          ({ repoQ }) => {
            return repoQ(mutateI(ql), ql);
          },
        ];
      }),
    ),
    push(),
    rows,
  );
}
