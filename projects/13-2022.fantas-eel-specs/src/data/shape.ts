import { taggedSum } from "daggy";
import { Coord } from "./coord";

const Shape = taggedSum("Shape", {
  // Square :: (Coord, Coord) -> Shape
  Square: ["topleft", "bottomright"],

  // Circle :: (Coord, Number) -> Shape
  Circle: ["centre", "radius"],
});

/*
 This means that, when we write a method, we have to write something that
 will work for all forms of the Shape type, and this.cata
 is Daggy’s killer feature. By the way, cata is short for catamorphism!
 */
Shape.prototype.translate = function(x, y, z) {
  return this.cata({
    Square: (topleft, bottomright) =>
      Shape.Square(
        topleft.translate(x, y, z),
        bottomright.translate(x, y, z),
      ),

    Circle: (centre, radius) =>
      Shape.Circle(
        centre.translate(x, y, z),
        radius,
      ),
  });
};

Shape.Square(Coord(2, 2, 0), Coord(3, 3, 0))
  .translate(3, 3, 3);
// Square(Coord(5, 5, 3), Coord(6, 6, 3))

Shape.Circle(Coord(1, 2, 3), 8)
  .translate(6, 5, 4);
// Circle(Coord(7, 7, 7), 8)

export { Shape };
