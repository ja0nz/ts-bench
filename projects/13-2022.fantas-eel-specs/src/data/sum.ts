import { tagged } from "daggy";

const Sum = tagged('Sum', ['val'])

Sum.prototype.concat = function (that) {
  return Sum(this.val + that.val)
}

export { Sum };
// Sum(2).concat(Sum(3)).val // 5
