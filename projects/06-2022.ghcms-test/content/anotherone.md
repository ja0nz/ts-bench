---
title: 'Next post'
author: ['Ja0nz']
summary: 'An awesome summary for an awesome topic. This should be around 200 words.'
date: 2022-01-11T23:26:00+01:00
publishDate: 2022-01-12T00:00:00+01:00
tags: ['L1', 'L2']
draft: false
id: '78d2793e-97ac-49e2-bc70-0ce36a2837dc'
slug: '/welcome-another'
---

## Several formattings in Org Mode {#several-formattings-in-org-mode}

This is
one
paragraph!

This is

two paragraphs! (One more line break in org)

This is <br />
one paragraph with an \\<br\\>

I like to **write bold**. And sometimes _italic_ or even <span class="underline">underlined</span> and even ~~strike-through~~.
One note: `verbatim` and `squiqqly code` is both the same in markdown

The best thing is lists by the way:

- concise
- expressive
- tldr
- Plus sign

Second best is numerated stuff:

1.  My favorite number
2.  Second guess

Oh, and checkboxes

- [x] checked
- [ ] unchecked

## Links and Images {#links-and-images}

A generic link with linktext, just like in org mode
[Ox Hugo](https://google.com)

A generic link with linktext, just like in org mode in the form of \\[\\[URL][hyperlink]]

For images use assets/bundle-name/some.image
Will be populated to content automatically

## Code Blocks and other blocks {#code-blocks-and-other-blocks}

<div class="foo">
  <div></div>

_Some_ **text** --- 3

| m   | n   | o   |
| --- | --- | --- |
| p   | q   | r   |

</div>

I love to explain via src blocks

<div class="my-section" id="section-a">
  <div></div>

```javascript
// class="highlight"
const answer = 42;
console.log('this is how we do');
```

</div>

Sometimes things express well with a wise (wo)mans quote:

> It shall be light - and it was light mode and \\<blockquote\\>

Very obscure, a **verse**

<p class="verse">
ene mene mu, wrapped in --- class="verse"<br />
&nbsp;&nbsp;&nbsp;&nbsp;-- "The Tyger" _by_ William Blake<br />
</p>

But more practical: An example block to show

```text
Let me show to you.... class="highlight"
```

HTML Export
even though the export block is just for org editing

<div class="html">sometimes inline code is the answer</div>

Let me center this out

<style>.org-center { margin-left: auto; margin-right: auto; text-align: center; }</style>

<div class="org-center">
  <div></div>

class="org-center"
Cetura, centura, in the middle

</div>

And this is cool, a **nested dl** definition list

What is React
: react is something rather cool, you can think of some reactive reaction. See [more](https://react.io)
