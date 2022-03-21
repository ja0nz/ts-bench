//import { qlClient } from './index.js';
import { assert } from '@thi.ng/errors';
import { group } from '@thi.ng/testament';
//import { queryR } from '../src/repo.js';
//import { queryIssueCountL, queryL } from '../src/label.js';

// @ts-ignore
// const r = await repo(
//     queryR(
//         queryL()(queryIssueCountL)
//     ));
group('label', {
    add() {
        assert(1 + 1 === 2);
    },
    qlrequest({ done, setTimeout }) {
        setTimeout(() => async function() {
            // const x = await qlClient(
            //     queryR(
            //         queryL()(queryIssueCountL))
            // );
            // console.log(x)
            assert(3 - 1 === 2);
            done();
        }, 50);
    },
});
