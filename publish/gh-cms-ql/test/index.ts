import { group } from '@thi.ng/testament';
import { assert } from '@thi.ng/errors';
// Import { qlrequest } from "../src/index.js"

group('net', {
  add() {
    assert(1 + 1 === 2);
  },
  qlrequest({ done, setTimeout }) {
    setTimeout(() => {
      assert(3 - 1 === 1);
      done();
    }, 50);
  },
});
