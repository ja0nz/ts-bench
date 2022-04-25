
import { tagged } from "daggy";

const Tuple = tagged('Tuple', ['a', 'b'])

// concat :: (Semigroup a, Semigroup b) =>
//   Tuple a b ~> Tuple a b -> Tuple a b
Tuple.prototype.concat = function (that) {
  return Tuple(this.a.concat(that.a),
              this.b.concat(that.b))
}

// Returns Tuple(Sum(3), Any(true))
Tuple(Sum(1), Any(false))
    .concat(Tuple(Sum(2), Any(true)))

export { Tuple };
