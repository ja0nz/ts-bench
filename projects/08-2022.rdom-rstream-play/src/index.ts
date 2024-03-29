import { isString } from "@thi.ng/checks/is-string";
import { delayed } from "@thi.ng/compose/delayed";
import { exposeGlobal } from "@thi.ng/expose";
import { button, div, h1, li, span } from "@thi.ng/hiccup-html";
import { $compile } from "@thi.ng/rdom/compile";
import { $list } from "@thi.ng/rdom/list";
import { $replace } from "@thi.ng/rdom/replace";
import { trace } from "@thi.ng/rstream";
import { CloseMode } from "@thi.ng/rstream/api";
import { fromDOMEvent } from "@thi.ng/rstream/event";
import { fromInterval } from "@thi.ng/rstream/interval";
import { fromIterable } from "@thi.ng/rstream/iterable";
import { metaStream } from "@thi.ng/rstream/metastream";
import { reactive, stream } from "@thi.ng/rstream/stream";
import { sync } from "@thi.ng/rstream/sync";
import { choices } from "@thi.ng/transducers/choices";
import { map } from "@thi.ng/transducers/map";
import { take } from "@thi.ng/transducers/take";
import { tw } from "twind";

const app = document.querySelector<HTMLDivElement>("#app")!;

/**
 * Reactive blur stream (boolean)
 * Made by the reactive stream creation helper. pre seeded
 * Toggle value (push operation)
 * () => blur.next(!blur.deref()), "toggle blur")
 */
const blur = reactive(false);

/**
 * Raw string stream
 * Eventually seeded by randomized strings
 */
const body = stream<string>();

/**
 * Time triggered stream
 */
const date = fromInterval(1000).transform(map(() => new Date()));

/**
 * Overall generic stream for holding one of the prementioned items
 */
const items = stream<any[]>();

/**
 * Like this one for its complexity / it's an endless (but controlled) loop
 * 1. It has a source -> an async producer of values (s.next)
 * This async function indefinitely produces values lettering values with random timings
 * 2. It has a stop function build
 * 3. The way it's used in metastream down below feeding in the src argument
 */
const typewriter = (min: number, max: number) => (src: string) =>
  stream<string>((s) => {
    let active = true;
    (async () => {
      for (let i = 1; active && i <= src.length; i++) {
        s.next(src.substring(0, i));
        await delayed(0, Math.random() * (max - min) + min);
      }
      s.closeIn !== CloseMode.NEVER && s.done();
    })();
    return () => (active = false);
  });

const names = ["👋TypeScript", "👋@thi.ng/rdom", "👋toxi", "👋Discord"];

/**
 * Merging streams + factory
 * Consumes both fromIterable plus an "typewriter factory" together
 * So for every word in names we get ONE stream which returns the chars sequentially in a random time
 */
const typing = fromIterable(choices(names), { delay: 2000 }).subscribe(
  metaStream(typewriter(16, 100), { closeOut: CloseMode.NEVER }),
);

// a bunch of streams which can be thrown around
const itemChoices = [
  date.transform(map((d) => d.toISOString())),
  body,
  typing,
  ...names,
];

const randomizeBody = () => body.next(names[~~(Math.random() * names.length)]);

const randomizeList = () =>
  items.next([...take(Math.random() * 400 + 100, choices(itemChoices))]);

const buttonToggle = (onclick: EventListener, label: string) =>
  button(
    {
      class:
        tw`bg-transparent hover:bg-yellow-500 text-yellow-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded mr-2`,
      onclick,
    },
    label,
  );

const mpos = fromDOMEvent(window, "mousemove").transform(
  map((e) => [e.pageX, e.pageY]),
);

randomizeBody(); // seeding
randomizeList(); // seeding

const root = $compile(
  div(
    { class: tw`p-4 bg-gray-600 text-white` },
    h1(
      {
        class: {
          [tw`filter`]: blur, // not sure but cant chain together "filter blur"
          [tw`blur`]: blur,
          [tw`absolute text(white 4xl)`]: true,
        },
        style: mpos.transform(
          map(([x, y]) => ({ left: x + "px", top: y + 10 + "px" })),
        ),
      },
      $replace(
        sync({
          src: { body, mpos },
          xform: map((x) =>
            span(
              {},
              x.body,
              span({ class: tw`ml-2 text-green-300` }, `[${x.mpos}]`),
            )
          ),
        }),
      ),
    ),
    div(
      { class: tw`my-4` },
      buttonToggle(() => blur.next(!blur.deref()), "toggle blur"),
      buttonToggle(randomizeBody, "randomize title"),
      buttonToggle(randomizeList, "randomize list"),
    ),
    div({ class: tw`text-pink-900` }, date),
    div(
      { class: tw`text-pink-600` },
      items.transform(map((x) => `${x.length} items`)),
    ),
    $list(
      items,
      "ul",
      {
        class: tw`text-xs`,
        style: { "column-count": 2 },
      },
      (x) =>
        li(
          {
            class: isString(x)
              ? tw`text-blue-500`
              : x === typing
              ? tw`text-yellow-500`
              : tw`text-red-500`,
          },
          x,
        ),
    ),
  ),
);
root.mount(app);

function foo(x) {
  console.log("bar");
}
