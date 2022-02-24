import { group } from '@thi.ng/testament';
import { assert } from '@thi.ng/errors';

import { getInRepo } from '../../src/model/io/net.js';

group('queryRepo.ts', {
  add: () => {
    assert(1 + 1 === 2);
  },
  getInRepo: async function ({ done }) {
    const repoID = await getInRepo(['id'], 'id');
    console.log(repoID);
    assert(3 - 1 === 2);
    done();
  },
});

// export const twoLabels = [
//     createLabel("aLabel", "a desc"),
//     createLabel("bLabel")
// ];
