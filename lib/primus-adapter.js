/**
 * Module dependencies.
 */

const EventEmitter = require('events').EventEmitter;
const path = require('path');
const axios = require('axios');
// const debug = require('debug')('strong-remoting:primus-adapter');
// const util = require('util');
const PrimusClass = require('primus');
const primusEmitter = require('primus-emitter');
const PrimusContext = require('./primus-context');
const async = require('async');

/**
 * Create a new `PrimusAdapter` with the given `remotes`, `server`.
 * @param remotes
 * @param server
 * @param primusInstance
 * @constructor
 */
class PrimusAdapter extends EventEmitter {
	constructor(remotes, { server, primusInstance } = {}) {
		super();
		// throw an error if args are not supplied
		// assert(typeof options === 'object',
		//   'RestAdapter requires an options object');

		this.remotes = remotes;
		this.server = server;
		this.primus = primusInstance;
		this.Context = PrimusContext;
	}

	static create(remotes) {
		// add simplified construction / sugar here
		return new PrimusAdapter(remotes);
	}

	createHandler() {
		const adapter = this;
		const remotes = this.remotes;
		// const classes = this.remotes.classes();
		const primus = this.primus || new PrimusClass(this.server, { transformer: 'sockjs' });
		primus.plugin('emit', primusEmitter);

		primus.on('connection', spark => {
			adapter.spark = spark;
			spark.on('invoke', (data = {}, done = () => {}) => {
				const method = remotes.findMethod(data.methodString);
				const args = data.args || {};

				if (method) {
					const ctx = new PrimusContext(method, spark, args, args, remotes);
					adapter._invoke(ctx, method, data.args, (err, result) => {
						if (err) {
							const formattedError = {
								message: err.toString(),
								stack: err.stack
							};
							return done(formattedError);
						}

						return done(null, result);
					});
				} else {
					done({ err: 'no method with this name' });
				}
			});
		});
		return this;
	}

	_invoke(ctx, method, args, callback) {
		const remotes = this.remotes;

		if (method.isStatic) {
			return this._invokeMethod(ctx, method, callback);
		}

		// invoke the shared constructor to get an instance
		return ctx.invoke(method.ctor, method.sharedCtor || method, (invokeErr, inst) => {
			if (invokeErr) return callback(invokeErr);
			ctx.instance = inst;

			return this._invokeMethod(ctx, method, callback);
		});
	}

	_invokeMethod(ctx, method, callback) {
		const remotes = this.remotes;
		const steps = [];

		if (method.rest.before) {
			steps.push(cb => {
				// debug('Invoking rest.before for ' + ctx.methodString);
				method.rest.before.call(ctx.getScope(), ctx, cb);
			});
		}

		steps.push(
			this.remotes.invokeMethodInContext.bind(this.remotes, ctx, method, (err) => {
				if (err) callback(err);
				callback(null, ctx.result);
			})
		);

		if (method.rest.after) {
			steps.push(cb => {
				// debug('Invoking rest.after for ' + ctx.methodString);
				method.rest.after.call(ctx.getScope(), ctx, cb);
			});
		}

		async.series(steps);
	}

	connect(url, options) {
		const primusUrlFile = `${url}/primus/primus.js`;
		return axios.get(primusUrlFile)
			.then(response => {
				const p = eval(response.data);
				return p;
			})
			.then(() => {
				const opts = Object.assign({}, options, { url: url });
				return new window.Primus(opts);
			})
			.catch(err => {
				console.log(err);
			});
	}
}


/**
 * Expose `PrimusAdapter`.
 */
module.exports = PrimusAdapter;
