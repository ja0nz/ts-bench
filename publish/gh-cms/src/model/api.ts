import { defGetter, defSetter, defSetterUnsafe } from '@thi.ng/paths';
import { comp } from '@thi.ng/compose';
import type { GrayMatterFile } from 'gray-matter';
import { GH_MD2LABEL, GH_MD2MILESTONE, GH_MD2STATE } from '../api';
import type { Fn, Fn0 } from '@thi.ng/api';

/*
 * GraphQL
 */
export interface Issue {
  id: string;
  state: string;
  title?: string;
  body?: string;
}
export interface Label {
  id: string;
  name: string;
  issues?: { nodes: Issue[] };
}

export interface Milestone {
  id: string;
  title: string;
  number: number;
  issues?: { nodes: Issue[] };
}
export interface Issues {
  issues: {
    nodes: Issue[];
  };
}
export interface Labels {
  labels: {
    nodes: Label[];
  };
}
export interface Milestones {
  milestones: {
    nodes: Milestone[];
  };
}
export interface RepoID {
  id: string;
}

type Response = RepoID & Issues & Labels & Milestones;

export interface Repository {
  repository: {
    [k in keyof Partial<Response>]: Response[k];
  };
}

export type Effect = Fn0<Promise<any>>;

/*
 * This is a wrapper around the parsed GrayMatter file
 * used to store GH information alongside the parsed content
 */
export interface GH_CMS {
  issue: Issue & { rid: string };
  parsed: CustomGrayMatter;
  raw: string;
}
export const get_CMS_id = defGetter<GH_CMS, 'issue', 'id'>(['issue', 'id']);
export const set_CMS_id = defSetter<GH_CMS, 'issue', 'id'>(['issue', 'id']);
export const get_CMS_rid = defGetter<GH_CMS, 'issue', 'rid'>(['issue', 'rid']);
export const get_CMS_state = defGetter<GH_CMS, 'issue', 'state'>([
  'issue',
  'state',
]);
export const set_CMS_state = defSetter<GH_CMS, 'issue', 'state'>([
  'issue',
  'state',
]);
export const get_CMS_raw = defGetter<GH_CMS, 'raw'>(['raw']);
export const get_CMS_parsed = defGetter<GH_CMS, 'parsed'>(['parsed']);

/*
 * GrayMatterFile is poorly typed
 * - missing a variable "isEmpty"
 * - data badly typed
 */
export interface CustomGrayMatter extends GrayMatterFile<string> {
  isEmpty: boolean;
  data: FrontMatterSpec;
}
export const get_parsed_content = comp(
  defGetter<CustomGrayMatter, 'content'>(['content']),
  get_CMS_parsed
);
export const get_parsed_data = comp(
  defGetter<CustomGrayMatter, 'data'>(['data']),
  get_CMS_parsed
);

/*
 *
 */
export interface FrontMatterSpec {
  id: string;
  date: Date;
  title: string;
  draft?: boolean;
  tags?: string[];
  route?: string;
}
export const get_parsed_id = comp(
  defGetter<FrontMatterSpec, 'id'>(['id']),
  get_parsed_data
);
export const get_parsed_date = comp(
  defGetter<FrontMatterSpec, 'date'>(['date']),
  get_parsed_data
);
export const get_parsed_title = comp(
  defGetter<FrontMatterSpec, 'title'>(['title']),
  get_parsed_data
);
export const set_title = defSetter<GH_CMS, 'parsed', 'data', 'title'>([
  'parsed',
  'data',
  'title',
]);

export const get_parsed_tags: Fn<GH_CMS, string[]> = comp(
  defGetter<FrontMatterSpec, any>([GH_MD2LABEL ?? 'tags']),
  get_parsed_data
);
export const set_tags = defSetterUnsafe([
  'parsed',
  'data',
  GH_MD2LABEL ?? 'tags',
]);

export const get_parsed_route: Fn<GH_CMS, string> = comp(
  defGetter<FrontMatterSpec, any>([GH_MD2MILESTONE ?? 'route']),
  get_parsed_data
);
export const set_route = defSetterUnsafe([
  'parsed',
  'data',
  GH_MD2MILESTONE ?? 'route',
]);

export const get_parsed_state: Fn<GH_CMS, boolean> = comp(
  defGetter<FrontMatterSpec, any>([GH_MD2STATE ?? 'draft']),
  get_parsed_data
);
