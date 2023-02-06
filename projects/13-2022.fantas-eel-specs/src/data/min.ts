import { tagged } from "daggy";

const Min = tagged("Min", ["val"]);

// Semigroup
Min.prototype.concat = function(that) {
  return Min(Math.min(this.val, that.val));
};
// Monoid
Min.empty = () => Min(Infinity);

const Max = tagged("Max", ["val"]);

Max.prototype.concat = function(that) {
  return Max(Math.max(this.val, that.val));
};
// Monoid
Max.empty = () => Min(-Infinity);

export { Max, Min };
