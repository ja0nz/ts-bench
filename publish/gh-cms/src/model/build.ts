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
} from 'gh-cms-ql';
import type { BuildOptions } from '../cmd/build.js';
import type { Logger } from '../logger.js';
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
  Issue,
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
  Label,
  getInParsed,
  indexdIdentifier,
} from './api.js';
import { getTitleM } from 'gh-cms-ql';
import type { MDENV } from '../api.js';
import type { graphql } from '@octokit/graphql/dist-types/types';

// New implement
export function buildDag(env: IObjectOf<string>) {
  const g = new DGraph<string>();

  type Stup = [string, string];
  const out: IterableIterator<Stup> = iterator(
    comp(
      mapcat<Stup, Stup>(([k, v]) => v.split(',').map((v1) => [k, v1])),
      mapcat<Stup, Stup>(([k, v]) => {
        const indexs = v.match(indexdIdentifier);
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
 * ActionMap type
 * qlToken -> comp(qlTokenI(), qlTokenR, repoQ)(qlToken)
 * gm2valueFn -> GH_CMS / GrayMatter only! -> value
 * gmToken -> keys that needs to be present
 * issue2valueFn -> parsedIssue -> value
 */
type ActionMap = {
  issue2valueFn: Fn<any, any>;
  gm2valueFn: Fn<any, any>;
  qlToken: string;
  gmToken: string;
};
const knownKeys: Record<string, Partial<ActionMap>> = {
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
      getMilestoneI
    ),
  },
  MD2STATE: {
    qlToken: queryStateI,
    issue2valueFn: getStateI,
  },
};

type R = Reduced<ActionMap>;
function stepTree(
  acc: Map<PropertyKey, ActionMap[]>,
  key: string,
  g: DGraph<string>,
): ActionMap[] | ActionMap {
  return step(
    comp(
      // Trace('1. traversing ROOT value (gray matter):'),
      map<string, string | R>((k) => {
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
      mapcat<R | string, R | string>((x) => {
        if (isReduced(x)) return [x];
        return g.immediateDependencies(x);
      }),
      // Trace("2.1. map dependencies to nodes:"),
      map<R | string, R | ActionMap[]>((x) => {
        if (isReduced(x)) return x;
        return acc.get(x) ?? [];
      }),
      // Trace("3. Known keys (set in .env):"),
      mapcat<R | ActionMap[], R | ActionMap[]>((node) => {
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
      mapcat<R | ActionMap[], R | ActionMap[]>((node) => {
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
              (n: ActionMap) =>
                new Reduced({
                  ...n,
                  gm2valueFn: c(getIndex(k0), n.gm2valueFn),
                }),
            )
            : [node[k0]].map(
              (n: ActionMap) =>
                new Reduced({
                  ...n,
                  issue2valueFn: c(getIndex(k0), n.issue2valueFn),
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


export function dagAction(g: DGraph<string>): Map<keyof (typeof MDENV), [ActionMap]> {
  return last(
    scan(
      reducer(
        () => new Map<PropertyKey, ActionMap[]>(),
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

export function preFarPageFn(actionMap: Map<keyof (typeof MDENV), [ActionMap]>): Fn<string, string> {
  const id = actionMap.get("MD2ID");
  const date = actionMap.get("MD2DATE");
  const join = [...id ?? [], ...date ?? []].reduce(
    (acc, x) => acc + '\n' + x.qlToken,
    ''
  );
  return (s: string) => c(queryR, queryI(s))(join)
}

export async function allIssues(client: graphql, query: Fn<string, string>) {
  const nodes = [];
  let cursor = '';
  while (true) {
    const ql = await client(query(cursor));
    const issues = c(getI, getR)(ql);
    nodes.push(...getNodes<Issues>(issues));
    if (getHasNextPage<Issues>(issues)) {
      cursor = getEndCursor<Issues>(issues);
      continue;
    }
    break;
  }
  return nodes;
}


export const setGrayMatter = (
  raw: unknown[],
  getter = ((o: any) => o),
  setter = ((_: any, p: any) => p)) =>
  transduce(
    comp(
      map((o) => [o, getter(o)]),
      map(([o, p]) => [o, grayMatter(p)]),
      map(([o, p]) => setter(o, p))
    ),
    push(),
    raw)

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
} & GrayMatterFile<string>

export function setNewIssue(o: any, actionMap) {
  return
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

function reduceToLatest(xs: GH_CMS[]): GH_CMS {
  return transduce(
    comp(
      multiplexObj<GH_CMS, { id: string; rest: GH_CMS }>({
        id: comp(
          map(get_CMS_id),
          scan(
            reducer(
              () => '',
              (acc, x) => (acc ? acc : x),
            ),
          ),
        ),
        rest: scan(
          maxCompare(
            () => ({ parsed: { data: { date: new Date(0) } } }),
            (a, b) => (getDate(a) > getDate(b) ? 1 : -1),
          ),
        ),
      }),
      // Fold to single GH_CMS
      map((x: { id: string; rest: GH_CMS }) => set_CMS_id(x.rest, x.id)),
    ),
    last(),
    xs,
  );
}

export function latestContentRows(entries: IObjectOf<GH_CMS[]>): GH_CMS[] {
  return transduce(
    comp(
      // If remote entry has no matching local id -> skip
      filter((ghxs: GH_CMS[]) => {
        if (ghxs.length === 1 && get_CMS_id(ghxs[0])) return false;
        return true;
      }),
      // Remote.date >= local.date -> skip
      filter((ghxs: GH_CMS[]) => {
        const remote = ghxs.filter((x) => get_CMS_id(x));
        const local = ghxs.filter((x) => !get_CMS_id(x));
        // Cond1: if no remote content continue
        if (remote.length === 0) return true;
        //-
        const newer = local.filter((x) => getDate(x) > getDate(remote[0]));
        // Cond2: if local is newer than remote continue
        if (newer.length > 0) return true;
        //-
        const undef = local.filter(
          (x) => getDate(x) === undefined || getDate(remote[0]) === undefined,
        );
        // Cond3: if local or remote has no date at all
        if (undef.length > 0) return true;
        //-
        return false;
      }),
      map(reduceToLatest),
      // If title is not set use id
      map((gh: GH_CMS) => {
        const title = getTitle(gh);
        if (title === undefined || title.length === 0)
          return setTitle(gh, getId(gh));
        return gh;
      }),
    ),
    push(),
    Object.values(entries),
  );
}

export function parseContentRows(
  far: Repository,
): FnAnyT<Issue[], IObjectOf<GH_CMS[]>> {
  const repoID = getInRepo(far, 'id') ?? '';
  return (...rows) =>
    transduce(
      comp(
        filter((x: Issue) => Boolean(x.body) ?? false),
        map<Issue, GH_CMS>((x: Issue) => ({
          issue: { ...x, rid: repoID },
          raw: x.body ?? '',
          parsed: grayMatter(x.body!) as CustomGrayMatter,
        })),
        filter((x: GH_CMS) => !get_CMS_parsed(x).isEmpty),
        trace('remote'),
      ),
      groupByObj({ key: getId }),
      flatten(rows),
    );
}
