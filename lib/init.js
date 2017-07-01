const PrimusAdapter = require('../lib/primus-adapter');

module.exports = (app, options = {}) => {
	app.on('started', () => {
		const remotes = app.remotes();
		const { primusInstancePath } = options;
		const adapterOpts = {
			server: app.server
		};

		if (primusInstancePath) {
			adapterOpts['primusInstance'] = require(primusInstancePath);
		}

		const primus = remotes.handler(PrimusAdapter, adapterOpts);
		app.set('loopback-component-primus', options);
		app.set('primus', primus);
	});
};


