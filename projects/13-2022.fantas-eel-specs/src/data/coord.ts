import { tagged } from "daggy";

// - A coordinate in 3D space.
// + Coord :: (Int, Int, Int) -> Coord
const Coord = tagged("Coord", ["x", "y", "z"]);

// We can add methods...
Coord.prototype.translate = function(x, y, z) {
  // Named properties!
  return Coord(
    this.x + x,
    this.y + y,
    this.z + z,
  );
};

// - Setoid instance for Coord (prequisite for Ord)
// + equals :: Coord ~> Coord -> Boolean
Coord.prototype.equals = function coordEquals(that) {
  return this.x == that.x &&
    this.y == that.y &&
    this.z == that.z;
};

// - Ord instance for Coord
// + lte :: Coord ~> Coord -> Boolean
Coord.prototype.lte = function coordLte(that) {
  return (this.x < that.x) ||
    (this.x == that.x && this.y < that.y) ||
    (this.x == that.x && this.y == that.y && this.z < that.z) ||
    (this.equals(that));
};

export { Coord };
