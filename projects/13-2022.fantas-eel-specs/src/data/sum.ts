import { tagged } from "daggy";

const Sum = tagged("Sum", ["val"]);

// Semigroup
Sum.prototype.concat = function(that) {
  return Sum(this.val + that.val);
};
// Monoid
Sum.empty = () => Sum(0);

export { Sum };
// Sum(2).concat(Sum(3)).val // 5
