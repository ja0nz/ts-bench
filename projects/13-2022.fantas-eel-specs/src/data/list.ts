import { taggedSum } from "daggy";

const List = taggedSum("List", {
  Cons: ["head", "tail"],
  Nil: [],
});

List.prototype.map = function(f) {
  return this.cata({
    Cons: (head, tail) =>
      List.Cons(
        f(head),
        tail.map(f),
      ),

    Nil: () => List.Nil,
  });
};

// A "static" method for convenience.
List.from = function(xs) {
  return xs.reduceRight(
    (acc, x) => List.Cons(x, acc),
    List.Nil,
  );
};

// And a conversion back for convenience!
List.prototype.toArray = function() {
  return this.cata({
    Cons: (x, acc) => [
      x,
      ...acc.toArray(),
    ],

    Nil: () => [],
  });
};

/*
 * Setoid
 * Note: List elements must adhere to setoid as well!
 * This is only for research. In real life you should support primitives too!
 */
// Check the lists' heads, then their tails
// equals :: Setoid a => [a] ~> [a] -> Bool
List.prototype.equals = function(that) {
  return this.cata({
    // Note the two different Setoid uses:
    Cons: (head, tail) =>
      head.equals(that.head) && // a
      tail.equals(that.tail), // [a]

    Nil: () => that.is(List.Nil),
  });
};

List.prototype.palindrome = function(that) {
  const reversed = List.from(that.toArray().reverse());
  return this.equals(reversed);
};

/*
 * Ord
 */
// Recursive Ord definition for List!
// lte :: Ord a => [a] ~> [a] -> Boolean
List.prototype.lte = function(that) {
  return this.cata({
    Cons: (head, tail) =>
      that.cata({
        Cons: (head_, tail_) =>
          head.equals(head_)
            ? tail.lte(tail_)
            : head.lte(head_),

        Nil: () => false,
      }),

    Nil: () => true,
  });
};
// Just for demo - forgive me!
Number.prototype.equals = function(that) {
  return this == that;
};

Number.prototype.lte = function(that) {
  return this <= that;
};

export { List };
