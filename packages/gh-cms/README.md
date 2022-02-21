
# Table of Contents

1.  [TLDR](#org3184c07)
2.  [About](#org7028611)
    1.  [Additional metadata mapping](#orgb22df97)
        1.  [title -> gh issue title](#orgae3216c)
        2.  [tags -> gh issue labels (customizable)](#org700f324)
        3.  [route -> gh issue milestone (customizable)](#org6cf091d)
        4.  [draft -> gh issue state (CLOSED or OPEN) (customizable)](#org2331c9d)
    2.  [What you can do with this CLI tool](#org57642c4)
    3.  [Rationale: GitHub Issues as CMS for your blog](#org78bb73e)
3.  [Up and running](#orgf41432d)
    1.  [Install and first run (yarn)](#orgd27e4ea)
    2.  [Point to a local content directory](#org8e8085b)
    3.  [Point to a remote gh repository](#org07f883a)
    4.  [Create a GH token and set put in in .env](#org0d50cb3)
4.  [CLI manual](#orge5df2e2)
    1.  [&#x2013;help](#org2315bae):minor:
    2.  [&#x2013;dry-run](#org0124b2e):minor:
    3.  [gh-cms build](#orga2e043c):major:
    4.  [gh-cms purge](#org2df74ba):major:
5.  [ENV manual](#org1d29d3f)
    1.  [LOG<sub>LEVEL</sub> (default: INFO)](#orge69d69b)
    2.  [NO<sub>COLOR</sub> (default: undefined)](#org8ad60ad)
    3.  [REPO<sub>URL</sub>](#org6348c34)
    4.  [CONTENT<sub>PATH</sub>](#org74f722e)
    5.  [GH<sub>TOKEN</sub>](#orged88f36)
    6.  [GH<sub>MD2LABEL</sub>](#orge546e2d)
    7.  [GH<sub>MD2MILESTONE</sub>](#orgcb67bda)
    8.  [GH<sub>MD2STATE</sub>](#org3a856a4)



<a id="org3184c07"></a>

# TLDR

GithubCMS a simple command line tool that maps **markdown files** to **GitHub issues**. This tool was born out of the idea to have a personal blog hosted on GitHub Issues and updated against static markdown files. But you may use it with any other content too.

Be aware that this is **alpha quality**. It does it&rsquo;s job for me but you have to find out yourself. Feel free to report bugs/glitches.


<a id="org7028611"></a>

# About

This package requires YAML-shaped [Front Matter](https://jekyllrb.com/docs/front-matter/) which is a metadata header on top of your markdown file. The most critical and required metadata is

    ---
    id: "123abc" -> used to update local->remote
    date: 2022-01-23T12:47:00+01:00 -> used to figure out if update is needed. Any valid JS Date will do
    ---


<a id="orgb22df97"></a>

## Additional metadata mapping


<a id="orgae3216c"></a>

### title -> gh issue title

If not set falls back to mandatory issue id

    ---
    title: "hello world"
    ---


<a id="org700f324"></a>

### tags -> gh issue labels (customizable)

Not happy with &ldquo;tags&rdquo;? Fear not, you can set your own label key like
`GH_MD2LABEL = label`

    ---
    tags: ["T1", "T5", "dev"]
    ---


<a id="org6cf091d"></a>

### route -> gh issue milestone (customizable)

I use this as slug/endpoint identifier. Not happy with &ldquo;route&rdquo;? Set it with
`GH_MD2MILESTONE = milestone`

    ---
    route: "/welcome-post"
    ---


<a id="org2331c9d"></a>

### draft -> gh issue state (CLOSED or OPEN) (customizable)

I use this as published/unpublished identifier. Not happy with &ldquo;draft&rdquo;? Set it with
`GH_MD2STATE = open`
where

-   true -> OPEN
-   false -> CLOSED

    ---
    draft: false
    ---


<a id="org57642c4"></a>

## What you can do with this CLI tool

-   ✅ create and update issues based on an ID
-   ✅ set labels according to your needs
-   ✅ set a milestone to indicate an route (or whatever you may use milestone in your context)
-   ✅ work coexistendly with other GH issue content. This tool won&rsquo;t touch content it is not indended to modify
-   ✅ purge milestones which are not in use
-   ✅ purge labels which are not in use
-   ✅ use `--dry-run` in every occasion to get a glimpse whats going on before anything happens
-   ❌ delete/purge issues - this is push only. Delete your content directly on github.com


<a id="org78bb73e"></a>

## Rationale: GitHub Issues as CMS for your blog

1.  **GitHub Issues have a nice front-end** allowing other people to easily interact and comment on your content. You can browse topics based on labels and have a powerful content search at hand.
2.  **GitHub uses an extensive GraphQL API** which let you fetch content in a granular manner.
3.  **You get a headless CMS for free** which let you embed your content elsewhere.
4.  Using GitHub as discussion medium on articles leads to a **reduction of third parties** and site overload in general. It&rsquo;s quiet convenient.


<a id="orgf41432d"></a>

# Up and running

This package requires some minimal setup to work properly. Please refer to [CLI manual](#orge5df2e2) and [ENV manual](#org1d29d3f) for an in-depth manual.


<a id="orgd27e4ea"></a>

## Install and first run (yarn)

    yarn install -D X
    yarn gh-cms --help


<a id="org8e8085b"></a>

## Point to a local content directory

Create an **.env** file at the project root.
Path can be relative or absolute.

    cat <<EOF > .env
    CONTENT_PATH="./content"
    EOF


<a id="org07f883a"></a>

## Point to a remote gh repository

This is optional but in most cases wanted.

    cat <<EOF > .env
    REPO_URL="https://github.com/<name>/<repo>"
    EOF

Note: You can specify this with the **-u https:/&#x2026;** flag when running the command. This has always higher precedence than setting it as ENV.


<a id="org0d50cb3"></a>

## Create a GH token and set put in in .env

Go to <https://github.com/settings/tokens> and create a token which matches your needs.

    cat <<EOF > .env
    GH_TOKEN=ghp_xxx
    EOF


<a id="orge5df2e2"></a>

# CLI manual


<a id="org2315bae"></a>

## &#x2013;help     :minor:

Use with every command to get an overview


<a id="org0124b2e"></a>

## &#x2013;dry-run     :minor:

Log instead of modify


<a id="orga2e043c"></a>

## gh-cms build     :major:

Flags: -p -> CONTENT<sub>PATH</sub>; -u -> REPO<sub>URL</sub>

-   Traverse to the $CONTENT<sub>PATH</sub> for markdown files.
-   Build accordingly


<a id="org2df74ba"></a>

## gh-cms purge     :major:

Flags: -l -> labels; -m -> milestones

-   Check if labels/milestone are referenced and delete if not


<a id="org1d29d3f"></a>

# ENV manual


<a id="orge69d69b"></a>

## LOG<sub>LEVEL</sub> (default: INFO)

-   DEBUG
-   SEVERE


<a id="org8ad60ad"></a>

## NO<sub>COLOR</sub> (default: undefined)

If you need uncolored output

-   set
-   unset


<a id="org6348c34"></a>

## REPO<sub>URL</sub>

Full URL to GH repo

-   <https://github.com/x/x>


<a id="org74f722e"></a>

## CONTENT<sub>PATH</sub>

Relative or absolute URL to content, traverses directories

-   &ldquo;./content&rdquo;


<a id="orged88f36"></a>

## GH<sub>TOKEN</sub>


<a id="orge546e2d"></a>

## GH<sub>MD2LABEL</sub>


<a id="orgcb67bda"></a>

## GH<sub>MD2MILESTONE</sub>


<a id="org3a856a4"></a>

## GH<sub>MD2STATE</sub>

