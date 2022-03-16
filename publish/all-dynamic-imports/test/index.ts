import {group} from '@thi.ng/testament';
import {assert} from '@thi.ng/errors';

// Register group of test cases
group(
	'basics',
	{
		add() {
			assert(1 + 1 === 2);
		},
		sub({done, setTimeout}) {
			setTimeout(() => {
				assert(3 - 1 === 1);
				done();
			}, 50);
		},
	},
	// Shared options for all cases in the group
	{
		timeOut: 100,
		beforeEach({logger}) {
			logger.info('before');
		},
		afterEach({logger}) {
			logger.info('after');
		},
	},
);
