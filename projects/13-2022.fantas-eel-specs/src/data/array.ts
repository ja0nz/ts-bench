// Our implementation of ap.
// ap :: Array a ~> Array (a -> b) -> Array b
Array.prototype.ap = function(fs) {
  return [].concat(...fs.map(
    f => this.map(f),
  ));
} // 3 x 0 elements
  // []
  [2, 3, 4].ap([]) // 3 x 1 elements
  // [ '2!', '3!', '4!' ]
  [2, 3, 4]
  .ap([x => x + "!"]) // 3 x 2 elements
  // [ '2!', '3!', '4!'
  // , '2?', '3?', '4?' ]
  [2, 3, 4]
  .ap([x => x + "!", x => x + "?"]);
