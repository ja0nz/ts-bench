import { tagged } from "daggy";

const Product = tagged('Product', ['val'])

// Semigroup
Product.prototype.concat = function (that) {
  return Product(this.val * that.val)
}
// Monoid
Product.empty = () => Product(1);

export { Product };
// Product(2).concat(Product(3)).val // 6
