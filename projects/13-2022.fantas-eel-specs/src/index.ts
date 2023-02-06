import { h1 } from "@thi.ng/hiccup-html";
import { $compile } from "@thi.ng/rdom";
import { tw } from "twind";
import { Coord } from "./data/coord";
import { Line } from "./data/line";
import { bubbleSort, mergeSort, quickSort } from "./ord";

const greeter = h1(
  { class: tw`font-bold text(center 5xl white sm:gray-800 md:pink-700)` },
  "Hello👋13-2022.fantas-eel-specs",
);
const app = document.querySelector<HTMLDivElement>("#app")!;
await $compile(greeter).mount(app);

const cl = console.log;

/*
 * Demonstrations
 */

const coord_list = [
  Coord(1, 2, 3),
  Coord(1, 2, 1),
  Coord(1, 1, 2),
];

const line_list = [
  Line(
    Coord(0, 0, 0),
    Coord(1, 2, 3),
  ),
  Line(
    Coord(1, 2, 1),
    Coord(1, 2, 2),
  ),
  Line(
    Coord(0, 0, 0),
    Coord(1, 1, 2),
  ),
];

cl("mergesort", mergeSort(coord_list).toString());
cl("quicksort", quickSort(coord_list).toString());
// -> [
//  { x: 1, y: 1, z: 2 },
//  { x: 1, y: 2, z: 1 },
//  { x: 1, y: 2, z: 3 }
// ]

cl("bubblesort", bubbleSort(line_list).toString());
cl("mergesort", mergeSort(line_list).toString());
cl("quicksort", quickSort(line_list).toString());
// -> [
//  { from: { x: 0, y: 0, z: 0 }, to: { x: 1, y: 1, z: 2 } },
//  { from: { x: 0, y: 0, z: 0 }, to: { x: 1, y: 2, z: 3 } },
//  { from: { x: 1, y: 2, z: 1 }, to: { x: 1, y: 2, z: 2 } }
// ]
