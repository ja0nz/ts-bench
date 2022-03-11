import type { LoadInput, RequestEvent } from "@sveltejs/kit/types/internal";
import { defGetter } from "@thi.ng/paths";
import { comp } from "@thi.ng/compose";

type Params = Record<string, string>;

export const get_req_params = defGetter<RequestEvent, 'params'>(['params']);
export const get_req_route = comp(
    defGetter<Params, 'route'>(['route']),
    get_req_params
);

export const get_load_url = defGetter<LoadInput, 'url'>(['url']);
export const get_load_fetch = defGetter<LoadInput, 'fetch'>(['fetch']);
export const get_load_params = defGetter<LoadInput, 'params'>(['params']);
export const get_load_route = comp(
    defGetter<Params, 'route'>(['route']),
    get_load_params
);
