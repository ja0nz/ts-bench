import { tagged } from "daggy";

const Any = tagged('Sum', ['val'])

Any.prototype.concat = function (that) {
  return Any(this.val || that.val)
}

export { Any };
