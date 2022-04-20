import { tagged, } from "daggy";
import { lt } from "../ord";

//- A line between two coordinates.
//+ Line :: (Coord, Coord) -> Line
const Line = tagged('Line', ['from', 'to'])

//- Setoid instance for Line (prequisite for Ord)
//+ equals :: Line ~> Line -> Boolean
Line.prototype.equals = function lineEquals(that) {
  return this.from.equals(that.from)
    && this.to.equals(that.to)
}

//- Ord instance of Line
//+ lte :: Line ~> Line -> Boolean
Line.prototype.lte = function lineLte(that) {
  return (lt(this.from, that.from))
    || (this.from.equals(that.from) && lt(this.to, that.to))
    || (this.equals(that))
}

export { Line };
