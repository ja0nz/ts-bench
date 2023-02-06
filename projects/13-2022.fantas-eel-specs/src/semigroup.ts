import { tagged } from "daggy";
import { Any } from "./data/any";
import { First } from "./data/first";
import { Min } from "./data/min";
import { Tuple4 } from "./data/tuple";

const Customer = tagged("Customer", [
  "name",
  "favouriteThings",
  "registrationDate",
  "hasMadePurchase",
]);

const myStrategy = {
  // fold customer to isomorphic tuple
  to: customer =>
    Tuple4(
      First(customer.name),
      customer.favouriteThings,
      Min(customer.registrationDate),
      Any(customer.hasMadePurchase),
    ),

  // fold Tuple4 back to Customer
  from: ({ a, b, c, d }) => Customer(a.val, b, c.val, d.val),
};

const merge = strategy => x => y =>
  strategy.from(strategy.to(x).concat(strategy.to(y)));

const Tom1 = Customer("Tom", ["socks"], 100000, false);
const Tom2 = Customer("TomH", ["gloves"], 90000, true);

// { name: 'Tom'
// , favouriteThings: ['socks', 'gloves']
// , registrationDate: 90000
// , hasMadePurchase: true
// }
merge(myStrategy)(Tom1)(Tom2);
