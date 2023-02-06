import { Identity } from "./data/identity";

// Remember: `f` MUST be curried!
// lift2 :: Applicative f
//       =>  (a ->   b ->   c)
//       -> f a -> f b -> f c
const lift2 = f => a => b => b.ap(a.map(f));

// Identity(5)
lift2(x => y => x + y)(Identity(2))(Identity(3));
