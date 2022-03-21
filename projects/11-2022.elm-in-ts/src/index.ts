import { h1 } from '@thi.ng/hiccup-html';
import { $compile } from '@thi.ng/rdom';
import { tw } from 'twind';

import { match, Maybe, Result } from './elmish.js';

const greeter = h1(
  { class: tw`font-bold text(center 5xl white sm:gray-800 md:pink-700)` },
  'Hello👋11-2022.elm-in-ts',
);
const app = document.querySelector<HTMLDivElement>('#app')!;

await $compile(greeter).mount(app);

{
  type Action = ['Run', Maybe<number>] | ['Sleep'];

  // Mapping to string
  const toString_ = (action: Action): string =>
    match(action).with({
      // What compiler is suggesting here?
      Run_Just: (distance) => 'Run ' + distance + ' km',
      Run_Nothing: () => 'Run who knows how far',
      Sleep: () => 'Zzzz...',
    });

  // Using
  //const res = toString_(['Run', ['Nothing']]); // ?
  const res = toString_(['Run', ['Just', 100]]); // ?
  //const res = toString_(['Sleep']); // ?
  console.log(res)

}

// One level more!
{
  type Request<a> = ['Success', a] | ['Error', string] | ['Loading'];

  type Action = ['Run', Maybe<number>] | ['Sleep'];

  // Mapping to string
  const toString_ = (action: Request<Action>): string =>
    match(action).with({
      // What compiler is suggesting here?
      Loading: () => 'Loading...',
      Error: (error) => 'Error: ' + error,
      Success_Run_Just: (distance) => 'Run ' + distance + 'km',
      _: () => 'Definitely not running',
    });

  // Using
  const res1 = toString_(['Success', ['Run', ['Just', 10]]]); // ?
  // const res1 = toString_(['Success', ['Sleep']]); // ?
  // const res1 = toString_(['Error', "errorooooo"]); // ?
  //const res1 = toString_(['Loading']); // ?
  console.log(res1)
}

// Pattern match over many elements
{
  const f = (
    x: Result<string, Error>,
    y: Result<string, Error>,
    z: Result<string, Error>,
  ) =>
    match(x, y, z).with({
      // What compiler is suggesting here?
      'Ok, Ok, Ok': (x, y, z) => [x, y, z],
      //'Ok, Ok, Error': (x, y, z) => [x, y, "oh no"],
      _: () => [],
    });

  // const res2 = f(['Ok', 'yes'], ['Ok', "another"], ["Ok", "getting there"])
  const res2 = f(['Ok', 'yes'], ['Ok', "another"], ["Error", Error("noo")])
  console.log(res2);
}
