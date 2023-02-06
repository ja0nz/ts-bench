import { tagged } from "daggy";

const Any = tagged("Sum", ["val"]);

// Semigroup
Any.prototype.concat = function(that) {
  return Any(this.val || that.val);
};
// Monoid
Any.empty = () => Any(false);

export { Any };
