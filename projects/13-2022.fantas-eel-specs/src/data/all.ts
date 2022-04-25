import { tagged } from "daggy";

const All = tagged('Sum', ['val'])

All.prototype.concat = function (that) {
  return All(this.val && that.val)
}

export { All };
