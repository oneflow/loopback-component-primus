module.exports = function () {
	return {
		files: [
			'test/support/env.js',
			'config/*.js',
			'src/**/*.js'
		],

		tests: [
			'test/**/*.tests.js'
		],

		env: {
			type: 'node'
		},

		setup: function () {
			require('./test/support/env.js');
		}
	};
};
