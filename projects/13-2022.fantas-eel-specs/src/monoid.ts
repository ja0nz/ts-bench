// A friendly neighbourhood monoid fold.

import { Max } from "./data/min";
import { Product } from "./data/product";
import { Sum } from "./data/sum";

// fold :: Monoid m => (a -> m) -> [a] -> m
const fold = M => xs =>
  xs.reduce(
    (acc, x) => acc.concat(M(x)),
    M.empty(),
  );

// We can now use our monoids for (almost) all
// our array reduction needs!
fold(Sum)([1, 2, 3, 4, 5]).val; // 15
fold(Product)([1, 2, 3]).val; // 6
fold(Max)([9, 7, 11]).val; // 11
fold(Sum)([]).val; // 0 - ooer!
