import { defGetter } from "@thi.ng/paths";
import { comp } from "@thi.ng/compose";
import type { GrayMatterFile } from "gray-matter";
import { GH_MD2LABEL, GH_MD2MILESTONE } from "../api";

// interfaces

export interface Blogpost {
    title: string;
    body: string;
    slug?: string;
    labels?: string[];
}

/*
 * This is a wrapper around the parsed GrayMatter file
 * used to store GH information alongside the parsed content
 */
export interface GitHubGrayMatter {
    id: string;

    body: CustomGrayMatter;
}
export const get_GHGM_ID = defGetter<GitHubGrayMatter, "id">(["id"]);
export const get_GHGM_body = defGetter<GitHubGrayMatter, "body">(["body"]);

/*
 * GrayMatterFile is poorly typed
 * - missing a variable "isEmpty"
 * - data badly typed
 */
export interface CustomGrayMatter extends GrayMatterFile<string> {
    isEmpty: boolean;
    data: FrontMatterSpec;
}
export const getGHGM_content = comp(
    defGetter<CustomGrayMatter, "content">(["content"]),
    get_GHGM_body
);
export const getGHGM_data = comp(
    defGetter<CustomGrayMatter, "data">(["data"]),
    get_GHGM_body
);

/*
 *
 */
export interface FrontMatterSpec {
    id: string,
    date: Date,
    tags?: string[],
    route?: string
}
export const getGHGM_data_id = comp(
    defGetter<FrontMatterSpec, "id">(["id"]),
    getGHGM_data
)
export const getGHGM_data_date = comp(
    defGetter<FrontMatterSpec, "date">(["date"]),
    getGHGM_data
)
export const getGHGM_data_tags = comp(
    defGetter<FrontMatterSpec, any>([GH_MD2LABEL ?? "tags"]),
    getGHGM_data
)
export const getGHGM_data_route = comp(
    defGetter<FrontMatterSpec, any>([GH_MD2MILESTONE ?? "route"]),
    getGHGM_data
)

/*
 * GraphQL
 */
export interface Issue {
    id: string,
    body?: string
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
        nodes: Issue[]
    }
}
export interface Labels {
    labels: {
        nodes: Label[]
    }
}
export interface Milestones {
    milestones: {
        nodes: Milestone[]
    }
}
export interface RepoID {
    id: string
}

type Response = RepoID & Issues & Labels & Milestones

export interface Repository {
    repository: {
        [k in keyof Partial<Response>]: Response[k]
    }
}
