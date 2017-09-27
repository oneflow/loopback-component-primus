const Promise = require('bluebird');
const PrimusAdapter = require('../lib/primus-adapter');
const path = require('path');
const rootDir = path.join(path.dirname(require.main.filename), '../');

module.exports = (app, options = {}) => {

	const loadProvidedInitFunction = primusInstancePath => () => {
		if (primusInstancePath) {
			const providedInitFunction = require(path.join(rootDir, primusInstancePath));
			if (typeof providedInitFunction === 'function') return providedInitFunction();
		}
	};

	const initialiseComponent = adapterOpts => primusInstance => {
		if (primusInstance) adapterOpts['primusInstance'] = primusInstance;

		const remotes = app.remotes();
		const primus = remotes.handler(PrimusAdapter, adapterOpts);
		app.set('loopback-component-primus', options);
		app.set('primus', primus);
	};

	return new Promise(resolve => {
		app.on('started', () => {
			const { primusInstancePath } = options;
			const adapterOpts = {
				server: app.server
			};

			return Promise
				.try(loadProvidedInitFunction(primusInstancePath))
				.then(initialiseComponent(adapterOpts))
				.then(resolve);
		});
	});
};
