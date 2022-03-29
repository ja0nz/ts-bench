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
} from '@thi.ng/transducers';
import { comp as c } from '@thi.ng/compose';
import grayMatter from 'gray-matter';
import type { Fn, FnAnyT, IObjectOf } from '@thi.ng/api';
import { DGraph } from '@thi.ng/dgraph';
import { assert } from '@thi.ng/errors';
import {
  queryBodyI,
  queryL,
  queryMilestoneI,
  queryNameL,
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
  Milestone,
  getInParsed,
} from './api.js';

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

// Make const
const reIndexd = /(?<=\[)(\d+?)(?=])/g;
export function buildDag() {
  // Dev
  const env = {
    MD2ID: 'MD2TITLE[2]',
    MD2DATE: 'MD2MILESTONE',
    MD2TITLE: 'title,route[1],no,category',
    MD2LABELS: 'tags',
    MD2MILESTONE: 'date',
    MD2STATE: 'draft',
  };
  // --dev

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

type FmFn = Fn<GH_CMS, unknown>;
/*
 * Query -> comp(queryI(), queryR, repoQ)(query)
 * getFm -> GH_CMS / GrayMatter only! -> value
 * guardsFm -> keys that needs to be present
 * getQ -> parsedIssue -> value
 */
type ReturnValue = {
  query: string;
  getQ?: any;
  getFm?: FmFn[];
  guardsFm?: string[];
};
const knownKeys: Record<string, ReturnValue> = {
  MD2ID: {
    query: '',
  },
  MD2DATE: {
    query: '',
  },
  MD2TITLE: {
    query: queryTitleI,
  },
  MD2LABELS: {
    query: queryL()(queryNameL),
  },
  MD2MILESTONE: {
    query: queryMilestoneI,
  },
  MD2STATE: {
    query: queryStateI,
  },
  _: {
    query: queryBodyI,
  },
};

function composeGetFmRec(index: RegExpMatchArray | null, all: FmFn[]) {
  // QueryCollect.push(acc.get(dep)?.query ?? '');
  if (index === null) {
    return all;
  }

  const idx = Number(index[0]);
  const [first, ...rst] = all;
  return [
    rst.length > 0
      ? all[idx]
      : c((s) => (typeof s === 'string' ? s.split(',')[idx] : s), first),
  ];
}

export function dagAction(g: DGraph<string>) {
  const out = scan(
    reducer(
      () => new Map<PropertyKey, ReturnValue>(),
      (acc, key: string) => {
        // Part 1: Far query string
        const [cKey] = key.split('[');
        const returnValue = { ...(knownKeys[cKey] ?? knownKeys._) };
        // Seeding
        returnValue.getFm = [];
        returnValue.guardsFm = [];

        const queryCollect: string[] = [];
        // Part 2: Construct (FM) => value
        const index = key.match(reIndexd);

        for (const dep of g.immediateDependencies(key)) {
          const node = acc.get(dep);
          if (node) {
            // Collect query tokens -> Part 3
            queryCollect.push(node.query);
            // Compose getter functions
            returnValue.getFm.push(...composeGetFmRec(index, node.getFm ?? []));
            // Push guards
            returnValue.guardsFm.push(...(node.guardsFm ?? []));
          }
        }

        // Leaves
        if (returnValue.getFm.length === 0) {
          returnValue.getFm.push(getInParsed(key));
          returnValue.guardsFm.push(key);
        }

        // Part 3: Fill query holes
        if (returnValue.query === '') {
          returnValue.query = queryCollect.join(' ');
        }

        // Part 4: GuardsFm

        return acc.set(key, returnValue);
      },
    ),
    new Map(),
    g,
  );
  return last(out);
}

// Const composeRet = (
//   acc: Map<PropertyKey, ReturnValue>,
//   g: DGraph<string>,
//   key: string) =>
//   transduce(
//     multiplexObj({
//       queryCollect: map(
//         x => acc.get(x)?.query ?? ''
//       ),
//       queryRetFn: map(
//         x => composeGetFmRec(key.match(reIndexd),  acc.get(x)?.getFm ?? [])
//       )
//     }),
//     push(),
//     g.immediateDependencies(key)
//   )

// const all = acc.get(dep)?.getFm ?? [];
// if (index === null) {
//   returnValue.getFm.push(...all);
//   continue;
// }

// const idx = Number(index[0]);
// const [first, ...rst] = all;
// returnValue.getFm.push(
//   rst.length > 0
//     ? all[idx]
//     : c(
//       (s) => (typeof s === 'string' ? s.split(',')[idx] : s),
//       first,
//     ),
// );
