<script lang="ts" context="module">
    // export const prerender = true; // you can uncomment to prerender as an optimization
    export const hydrate = true;
    //import { MY_TWITTER_HANDLE, REPO_URL, SITE_URL } from '$lib/siteConfig';
    //import Comments from '../components/Comments.svelte';
    export async function load({ url, params, fetch }) {
        const {slug} = params;
        let res = null;
        try {
            res = await fetch(`/json/${slug}.json`);
            if (res.status > 400) {
                return {
                    status: res.status,
                    error: await res.text()
                };
            }

            return {
                props: {
                    json: await res.json(),
                    //slug,
                    //REPO_URL
                },
                maxage: 60 // 1 minute
            };
        } catch (err) {
            console.error('error fetching blog post at [slug].svelte: ' + slug, res, err);
            return {
                status: 500,
                error: new Error('error fetching blog post at [slug].svelte: ' + slug + ': ' + res)
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
