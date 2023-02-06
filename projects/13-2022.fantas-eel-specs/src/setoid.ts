/*
 * Setoid - equals
 *
 * A handy PureScript reference: https://pursuit.purescript.org/packages/purescript-prelude/docs/Data.Eq
   instance setoidBox :: Eq a => Eq (Box a) where
     eq (Box x) (Box y) = x == y
 */
Array.prototype.equals = function(that) {
  const x = this.map((x, i) => x === that[i]);
  return !x.includes(false);
};

Array.prototype.equals1 = function(that) {
  if (this.length != that.length) return false;
  for (let i = 0; i < this.length; i++) {
    if (this[i] != that[i]) return false;
  }
  return true;
};

// notEquals :: Setoid a => a -> a -> Bool
const notEquals = x => y => !x.equals(y);

/*
 * Patched IndexOf - vanille JS does not adhere to the rules otherwise
 * for non-primitive structures, vanilla indexof only works if equivalent values always inhabit the same space in memory.
 */
// indexOf :: Setoid a => [a] -> a -> Int
const indexOf = xs => x => {
  for (let i = 0; i < xs.length; i++) {
    if (xs[i].equals(x)) return i;
  }

  return -1;
};

/*
 * nub :: Setoid a => [a] -> [a]
 * Strangely, in purescript we have to go even until Ord
 * In PureScript: nub :: forall a. Ord a => Array a -> Array a
 */
const nub = xs =>
  xs.filter(
    (x, i) => indexOf(xs)(x) === i,
  );

/* ZipWith helper
 *
 */
const zipWith = f => xs => ys => {
  const length = Math.min(
    xs.length,
    ys.length,
  );

  const zs = Array(length);

  for (let i = 0; i < length; i++) {
    zs[i] = f(xs[i])(ys[i]);
  }

  return zs;
};

// Returns [ 5, 7 ]
// zipWith(x => y => x + y)([1, 2])([4, 5, 6])
