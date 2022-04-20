import { taggedSum } from "daggy";

// Sum types
const Bool = taggedSum('Bool', {
    True: [],
    False: []
})

const { True, False } = Bool

// Flip the value of the Boolean.
Bool.prototype.invert = function () {
  return this.cata({
    False: () => True,
    True: () => False
  })
}

// Shorthand for Bool.prototype.cata?
Bool.prototype.thenElse =
  function (then, or) {
    return this.cata({
      True: then,
      False: or
    })
  }

/*
 * Setoid -> all hail to equality
 */
// The this' "true-ness" must match that's!
// equals :: Bool ~> Bool -> Bool
Bool.prototype.equals = function (that) {
  return this instanceof Bool.True
    === that instanceof Bool.True
}

export { Bool };
