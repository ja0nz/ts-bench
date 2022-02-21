
# Table of Contents

1.  [TLDR](#org64c4d54)
2.  [About](#org9d2f4a5)
    1.  [Additional metadata mapping](#org080a330)
        1.  [title -> gh issue title](#org51b928f)
        2.  [tags -> gh issue labels (customizable)](#org56fb467)
        3.  [route -> gh issue milestone (customizable)](#org2207e91)
        4.  [draft -> gh issue state (CLOSED or OPEN) (customizable)](#org55affb4)
    2.  [What you can do with this CLI tool](#orgffdab3f)
    3.  [Rationale: GitHub Issues as CMS for your blog](#orgc92eab5)
3.  [Up and running](#orgdfb726a)
    1.  [Install and first run (yarn)](#org3c50007)
    2.  [Point to a local content directory](#org7ecf382)
    3.  [Point to a remote gh repository](#org97c10e0)
    4.  [Create a GH token and set put in in .env](#org4f6217d)
4.  [CLI manual](#orgfdb83ac)
    1.  [&#x2013;help](#orgdad6deb):minor:
    2.  [&#x2013;dry-run](#orge6efab0):minor:
    3.  [gh-cms build](#orge298825):major:
    4.  [gh-cms purge](#org4524c06):major:
5.  [ENV manual](#org225d423)
    1.  [LOG\_LEVEL (default: INFO)](#org505bd1d)
    2.  [NO\_COLOR (default: undefined)](#orgaf6364c)
    3.  [REPO\_URL](#org338860b)
    4.  [CONTENT\_PATH](#org12f6aa7)
    5.  [GH\_TOKEN](#orgcf6e7ce)
    6.  [GH\_MD2LABEL](#orgea83191)
    7.  [GH\_MD2MILESTONE](#org1c4af5d)
    8.  [GH\_MD2STATE](#org778151d)



<a id="org64c4d54"></a>

# TLDR

GithubCMS a simple command line tool that maps **markdown files** to **GitHub issues**. This tool was born out of the idea to have a personal blog hosted on GitHub Issues and updated against static markdown files. But you may use it with any other content too.

Be aware that this is **alpha quality**. It does it&rsquo;s job for me but you have to find out yourself. Feel free to report bugs/glitches.


<a id="org9d2f4a5"></a>

# About

This package requires YAML-shaped [Front Matter](https://jekyllrb.com/docs/front-matter/) which is a metadata header on top of your markdown file. The most critical and required metadata is

    ---
    id: "123abc" -> used to update local->remote
    date: 2022-01-23T12:47:00+01:00 -> used to figure out if update is needed. Any valid JS Date will do
    ---


<a id="org080a330"></a>

## Additional metadata mapping


<a id="org51b928f"></a>

### title -> gh issue title

If not set falls back to mandatory issue id

    ---
    title: "hello world"
    ---


<a id="org56fb467"></a>

### tags -> gh issue labels (customizable)

Not happy with &ldquo;tags&rdquo;? Fear not, you can set your own label key like
`GH_MD2LABEL = label`

    ---
    tags: ["T1", "T5", "dev"]
    ---


<a id="org2207e91"></a>

### route -> gh issue milestone (customizable)

I use this as slug/endpoint identifier. Not happy with &ldquo;route&rdquo;? Set it with
`GH_MD2MILESTONE = milestone`

    ---
    route: "/welcome-post"
    ---


<a id="org55affb4"></a>

### draft -> gh issue state (CLOSED or OPEN) (customizable)

I use this as published/unpublished identifier. Not happy with &ldquo;draft&rdquo;? Set it with
`GH_MD2STATE = open`

    ---
    draft: false
    ---

where

-   true -> OPEN
-   false -> CLOSED


<a id="orgffdab3f"></a>

## What you can do with this CLI tool

-   ✅ create and update issues based on an ID
-   ✅ set labels according to your needs
-   ✅ set a milestone to indicate an route (or whatever you may use milestone in your context)
-   ✅ work coexistendly with other GH issue content. This tool won&rsquo;t touch content it is not indended to modify
-   ✅ purge milestones which are not in use
-   ✅ purge labels which are not in use
-   ✅ use `--dry-run` in every occasion to get a glimpse whats going on before anything happens
-   ❌ delete/purge issues - this is push only. Delete your content directly on github.com


<a id="orgc92eab5"></a>

## Rationale: GitHub Issues as CMS for your blog

1.  **GitHub Issues have a nice front-end** allowing other people to easily interact and comment on your content. You can browse topics based on labels and have a powerful content search at hand.
2.  **GitHub uses an extensive GraphQL API** which let you fetch content in a granular manner.
3.  **You get a headless CMS for free** which let you embed your content elsewhere.
4.  Using GitHub as discussion medium on articles leads to a **reduction of third parties** and site overload in general. It&rsquo;s quiet convenient.


<a id="orgdfb726a"></a>

# Up and running

This package requires some minimal setup to work properly. Please refer to [CLI manual](#orgfdb83ac) and [ENV manual](#org225d423) for an in-depth manual.


<a id="org3c50007"></a>

## Install and first run (yarn)

    yarn install -D X
    yarn gh-cms --help


<a id="org7ecf382"></a>

## Point to a local content directory

Create an **.env** file at the project root.
Path can be relative or absolute.

    cat <<EOF > .env
    CONTENT_PATH="./content"
    EOF


<a id="org97c10e0"></a>

## Point to a remote gh repository

This is optional but in most cases wanted.

    cat <<EOF > .env
    REPO_URL="https://github.com/<name>/<repo>"
    EOF

Note: You can specify this with the **-u https:/&#x2026;** flag when running the command. This has always higher precedence than setting it as ENV.


<a id="org4f6217d"></a>

## Create a GH token and set put in in .env

Go to <https://github.com/settings/tokens> and create a token which matches your needs.

    cat <<EOF > .env
    GH_TOKEN=ghp_xxx
    EOF


<a id="orgfdb83ac"></a>

# CLI manual


<a id="orgdad6deb"></a>

## &#x2013;help     :minor:

Use with every command to get an overview


<a id="orge6efab0"></a>

## &#x2013;dry-run     :minor:

Log instead of modify


<a id="orge298825"></a>

## gh-cms build     :major:

Flags: -p -> CONTENT\_PATH; -u -> REPO\_URL

-   Traverse to the $CONTENT\_PATH for markdown files.
-   Build accordingly


<a id="org4524c06"></a>

## gh-cms purge     :major:

Flags: -l -> labels; -m -> milestones

-   Check if labels/milestone are referenced and delete if not


<a id="org225d423"></a>

# ENV manual


<a id="org505bd1d"></a>

## LOG\_LEVEL (default: INFO)

-   DEBUG
-   SEVERE


<a id="orgaf6364c"></a>

## NO\_COLOR (default: undefined)

If you need uncolored output

-   set
-   unset


<a id="org338860b"></a>

## REPO\_URL

Full URL to GH repo

-   <https://github.com/x/x>


<a id="org12f6aa7"></a>

## CONTENT\_PATH

Relative or absolute URL to content, traverses directories

-   &ldquo;./content&rdquo;


<a id="orgcf6e7ce"></a>

## GH\_TOKEN


<a id="orgea83191"></a>

## GH\_MD2LABEL


<a id="org1c4af5d"></a>

## GH\_MD2MILESTONE


<a id="org778151d"></a>

## GH\_MD2STATE

