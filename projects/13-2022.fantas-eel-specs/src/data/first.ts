import { tagged } from "daggy";

const First = tagged("First", ["val"]);

First.prototype.concat = function(that) {
  return this;
};

const Last = tagged("Last", ["val"]);

Last.prototype.concat = function(that) {
  return that;
};
export { First, Last };
