<script lang="ts" context="module">
 import { get_req_route } from "../api/svelte";
 import { get_load_fetch, get_load_route, get_load_url } from "../api/svelte";
 import type { LoadInput } from "@sveltejs/kit/types/internal";

 // export const prerender = true; // you can uncomment to prerender as an optimization
 export const hydrate = true;
 //import { MY_TWITTER_HANDLE, REPO_URL, SITE_URL } from '$lib/siteConfig';
 //import Comments from '../components/Comments.svelte';
 export async function load(load: LoadInput) {
    const fetch = get_load_fetch(load);
    const url = get_load_url(load);
    const route = get_load_route(load)

    // fall through
    switch (route.split(".").pop()) {
        case 'json': return { fallthrough: true };
        // Add other cases
    }

    try {
        const res = await fetch(`/${route}.json`);
        if (res.status > 400) {
            return {
                status: res.status,
                error: await res.text()
            };
        }

        return {
            props: {
                json: await res.json(),
                //route,
                //REPO_URL
            },
            maxage: 60 // 1 minute
        };
    } catch (err) {
        console.error('error fetching blog post at [route].svelte: ' + route, res, err);
        return {
            status: 500,
            error: new Error('error fetching blog post at [route].svelte: ' + route + ': ' + res)
        };
    }
}
</script>

<script lang="ts">
 /** @type {import('$lib/types').ContentItem} */
 export let json; // warning: if you try to destructure content here, make sure to make it reactive, or your page content will not update when your user navigates
</script>

<article>
    {JSON.stringify(json)}
</article>
