/*
 * Ord - lte
 *
 * A handy PureScript reference: https://pursuit.purescript.org/packages/purescript-prelude/docs/Data.Ord
   instance ordInt :: Ord Int where
     compare = ordIntImpl LT EQ GT
*/

// Greater than. The OPPOSITE of lte.
// gt :: Ord a => a -> a -> Boolean
const gt = function(x, y) {
  return !lte(x, y);
};

// Greater than or equal.
// gte :: Ord a => a -> a -> Boolean
const gte = function(x, y) {
  return gt(x, y) || x.equals(y);
};

// Less than. The OPPOSITE of gte!
// lt :: Ord a => a -> a -> Boolean
export const lt = function(x, y) {
  return !gte(x, y);
};

// And we already have lte!
// lte :: Ord a => a -> a -> Boolean
const lte = function(x, y) {
  return x.lte(y);
};

/*
 * Sorts
 * - Each make copies rather than modifying list in place
 */
const copy = xs => [...xs];

// - Sort a list of Ords using bubble sort algorithm
// bubbleSort :: Ord a => [a] -> [a]
export const bubbleSort = xs_ => {
  const xs = copy(xs_);
  let n = xs.length - 1;
  let swapped = true;
  while (swapped) {
    swapped = false;
    for (let i = 1; i <= n; i++) {
      const curr = xs[i];
      const prev = xs[i - 1];
      if (gt(prev, curr)) {
        xs[i - 1] = curr;
        xs[i] = prev;
        swapped = true;
      }
    }
  }
  return xs;
};

// - Sort a list of Ords using merge sort algorithm
// + mergeSort :: Ord a => [a] -> [a]
export const mergeSort = m => {
  if (m.length <= 1) return m;

  const left = [];
  const right = [];
  m.forEach((x, i) => {
    if (i < (m.length / 2)) {
      left.push(x);
    } else {
      right.push(x);
    }
  });

  const leftSorted = mergeSort(left);
  const rightSorted = mergeSort(right);

  return _merge(leftSorted, rightSorted);
};

const _merge = (left, right) => {
  const result = [];
  let l = copy(left);
  let r = copy(right);

  while (l.length > 0 && r.length > 0) {
    const [lhead, ...ltail] = l;
    const [rhead, ...rtail] = r;

    if (lte(lhead, rhead)) {
      result.push(lhead);
      l = ltail;
    } else {
      result.push(rhead);
      r = rtail;
    }
  }

  // Either left or right may have elements left; consume them
  // (Only one of the following loops will actually be entered)
  if (l.length > 0) {
    result.push(...l);
  }
  if (r.length > 0) {
    result.push(...r);
  }

  return result;
};

// - Sort a list of Ords using quicksort algorithm
// + quickSort :: Ord a => [a] -> [a]
export const quickSort = xs => _quickSort(copy(xs), 0, xs.length - 1);

const _quickSort = (xs, lo, hi) => {
  if (lo < hi) {
    const p = _partition(xs, lo, hi);
    _quickSort(xs, lo, p - 1);
    _quickSort(xs, p + 1, hi);
  }
  return xs;
};

const _partition = (xs, lo, hi) => {
  const pivot = xs[hi];
  let i = lo;
  for (let j = lo; j < hi; j++) {
    if (lt(xs[j], pivot)) {
      if (i != j) {
        const xsi = xs[i];
        const xsj = xs[j];
        xs[i] = xsj;
        xs[j] = xsi;
      }
      i++;
    }
  }
  const xsi = xs[i];
  const xshi = xs[hi];
  xs[i] = xshi;
  xs[hi] = xsi;
  return i;
};
