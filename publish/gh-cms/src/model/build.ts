import {
  comp,
  reducer,
  partition,
  filter,
  flatten,
  groupByObj,
  map,
  mapcat,
  multiplex,
  multiplexObj,
  push,
  sideEffect,
  transduce,
  last,
  interleave,
  scan,
  maxCompare,
  distinct,
  trace,
  iterator,
  step,
  Reduced,
  isReduced,
  cat,
  str,
  assocMap,
  mapKeys,
} from '@thi.ng/transducers';
import { comp as c } from '@thi.ng/compose';
import grayMatter, { GrayMatterFile } from 'gray-matter';
import type { Fn, FnAnyT, IObjectOf } from '@thi.ng/api';
import { DGraph } from '@thi.ng/dgraph';
import { assert } from '@thi.ng/errors';
import {
  getBodyI,
  getEndCursor,
  getHasNextPage,
  getI,
  getLabelsI,
  getMilestoneI,
  getNodes,
  getR,
  getStateI,
  getTitleI,
  hasNextPage,
  Issues,
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
  getL,
  Labels,
  R2,
  R1,
  Milestones,
  Combined,
  R0,
  queryM,
  queryTitleM,
  Label,
  getIdL,
  getNameL,
  mutateL,
  mutateRestM,
  mutateI,
} from 'gh-cms-ql';
import type { graphql } from '@octokit/graphql/dist-types/types';
import type { BuildOptions } from '../cmd/build.js';
import type { Logger } from '../logger.js';
import type { ActionObj, DGraphFields, MDActionMap, MDENV } from '../api.js';
import {
  modifyState,
  createIssue,
  createLabel,
  createMilestone,
} from './io/net.js';
import { getInRepo } from './io/queryRepo.js';
import {
  get_CMS_id,
  getDate,
  getId,
  GH_CMS,
  CustomGrayMatter,
  get_CMS_parsed,
  Repository,
  getLabels,
  getMilestone,
  get_CMS_rid,
  setLabels,
  setMilestone,
  get_parsed_data,
  get_CMS_state,
  getTitle,
  getState,
  set_CMS_id,
  set_CMS_state,
  setTitle,
  Effect,
  getInParsed,
  indexdIdentifier,
} from './api.js';

// New implement

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

export function changedNewRows(near: any, far: any) {
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
      // 5. Labels and Milestones to string (GH issue format):
      // transform dates to ISO strings because String(date) is not portable
      map(([_0, _1, _2, _3, l, m, ...r1]) => {
        const labels = l
          ? l.map((x: unknown) =>
              isValidDate(x) ? x.toISOString() : String(x),
            )
          : l;
        const milestone = isValidDate(m) ? m.toISOString() : String(m);
        return [_0, _1, _2, _3, labels, milestone, ...r1];
      }),
      // 6. Flip row to object
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
    ),
    push(),
    near,
  );
}

/*
 * Generate sideEffects
 * - labels and milestones
 */
export function preBuildLM(
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
            ({ logger }) => logger.info(`DRY; Create missing label: ${l}`),
            ({ repoQ, repoID }) => {
              const ql = {
                type: 'label',
                action: 'create',
                id: repoID,
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
            ({ logger }) => logger.info(`DRY; Create missing milestone: ${m}`),
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
export function buildI(
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
          labelIds: (labels ?? []).map((l) => lM.get(l) ?? `DRY:${l}`),
          milestoneId: mM.get(milestone) ?? '',
        };
        return [
          ({ logger }) =>
            logger.info(`DRY; ${action} issue: ${logger.pp(data)}`),
          ({ repoQ, repoID }) => {
            const ql = { ...data, id: rId ?? repoID };
            return repoQ(mutateI(ql), ql).then((x) => ['issue', x]);
          },
        ];
      }),
    ),
    push(),
    rows,
  );
}

// :End new implement

type WrapIssue = { issue: Issue };
export function postBuild(
  options: BuildOptions,
  logger: Logger,
  build: Array<IObjectOf<WrapIssue>>,
): Fn<GH_CMS[], Effect[]> {
  // Id, title, state
  const farBuild: Issue[] = transduce(
    comp(
      mapcat<IObjectOf<WrapIssue>, WrapIssue>((b) => Object.values(b)),
      map((b) => b.issue),
    ),
    push(),
    build,
  );
  return (rows: GH_CMS[]) =>
    transduce(
      comp(
        // Fill in missing/regenerated values
        // matching by titles may be not enough - only ID is uniqe. But I don't want to parse the doc again
        // and go through all the loops
        map((i: GH_CMS) => {
          const match = farBuild.filter((x) => x.title === getTitle(i));
          if (match.length > 0) {
            // New id
            i = set_CMS_id(i, match[0].id);
            // New state
            i = set_CMS_state(i, match[0].state);
          }

          return i;
        }),
        // Filter rows which need preBuild
        filter((r: GH_CMS) => {
          const p = getState(r);
          const i = get_CMS_state(r);
          if (p && i === 'OPEN') return false;
          if (!p && i === 'CLOSED') return false;
          return true;
        }),
        sideEffect((i: GH_CMS) => {
          const action = getState(i) ? 'Draft' : 'Publish';
          if (options.dryRun)
            logger.info(`DRY; ${action} issue title: ${getTitle(i)}`);
        }),
        map((i) => [get_CMS_id(i), !getState(i) ? 'CLOSED' : 'OPEN']),
        map(([id, state]) => modifyState(options.repoUrl, id, state)),
      ),
      push(),
      rows,
    );
}

export function build(
  options: BuildOptions,
  logger: Logger,
  far: Repository,
): Fn<GH_CMS[], Effect[]> {
  const farLabels = getInRepo(far, 'labels')?.nodes ?? [];
  const farMilestones = getInRepo(far, 'milestones')?.nodes ?? [];
  return (rows: GH_CMS[]) =>
    transduce(
      comp(
        sideEffect((i: GH_CMS) => {
          const nI = get_CMS_id(i);
          if (options.dryRun)
            logger.info(
              `DRY; ${nI ? 'Update' : 'Create'} issue: ${logger.pp(
                get_parsed_data(i),
              )}`,
            );
        }),
        // Labels -> ids
        map<GH_CMS, GH_CMS>((i) => {
          const lIDs = transduce(
            comp(
              mapcat<string, Label>((x) =>
                farLabels.filter((y: Label) => y.name === x),
              ),
              map((x: Label) => x.id),
            ),
            push(),
            getLabels(i) ?? [],
          );
          const nT = setLabels(i, lIDs);
          return nT;
        }),
        // Milestone -> id
        map<GH_CMS, GH_CMS>((i) => {
          const lIDs = transduce(
            comp(
              mapcat<string, Milestone>((x) =>
                farMilestones.filter((y: Milestone) => y.title === x),
              ),
              map((x) => x.id),
            ),
            last(),
            [getMilestone(i)],
          );
          const nT = setMilestone(i, lIDs ?? '');
          return nT;
        }),
        // State
        map<GH_CMS, GH_CMS>((i) => {
          const pState = !getState(i) ? 'CLOSED' : 'OPEN';
          const nT = set_CMS_state(i, pState);
          return nT;
        }),
        sideEffect((i: GH_CMS) => {
          const nI = get_CMS_id(i);
          if (options.dryRun)
            logger.info(
              `DRY; ${nI ? 'Update' : 'Create'} issue: ${logger.pp(
                get_parsed_data(i),
              )}`,
            );
        }),
        map((i) => createIssue(options.repoUrl, i)),
      ),
      push(),
      rows,
    );
}

export function preBuild(
  options: BuildOptions,
  logger: Logger,
  far: Repository,
): Fn<GH_CMS[], Effect[]> {
  const farLabels = getInRepo(far, 'labels')?.nodes ?? [];
  const farMilestones = getInRepo(far, 'milestones')?.nodes ?? [];
  return (rows: GH_CMS[]) =>
    transduce(
      comp(
        multiplex<GH_CMS, Effect, Effect>(
          comp(
            // Flat out tags
            mapcat<GH_CMS, string>((x: GH_CMS) => {
              const parsedTags = getLabels(x);
              if (parsedTags === undefined) return [];
              return [...interleave(get_CMS_rid(x), parsedTags)];
            }),
            partition<string>(2),
            filter(
              ([_, tag]: string[]) =>
                farLabels.filter((x: Label) => x.name === tag).length === 0,
            ),
            distinct({ key: (x) => x[1] }),
            sideEffect((x: string[]) => {
              if (options.dryRun)
                logger.info(`DRY; Create missing label: ${x[1]}`);
            }),
            map(([rID, tag]: string[]) =>
              createLabel(options.repoUrl, rID, tag),
            ),
          ),
          comp(
            // Wanted milestone
            mapcat<GH_CMS, string>((x: GH_CMS) => {
              const mileStone = getMilestone(x);
              if (mileStone === undefined) return [];
              return [mileStone];
            }),
            filter(
              (t: string) =>
                farMilestones.filter((x: Milestone) => x.title === t).length ===
                0,
            ),
            sideEffect((x: string) => {
              if (options.dryRun)
                logger.info(`DRY; Create missing milestone: ${x}`);
            }),
            map((x: string) => createMilestone(options.repoUrl, x)),
          ),
        ),
        flatten<Effect[]>(),
        filter((x) => x !== undefined),
      ),
      push(),
      rows,
    );
}
