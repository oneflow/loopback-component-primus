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
			spark.on('invoke', (data = {}, done) => {
				const method = remotes.findMethod(data.methodString);
				const args = data.args || {};

				if (method) {
					const ctx = new PrimusContext(method, spark, args, args, remotes);
					adapter._invoke(ctx, method, data.args, (err, result) => {
						if (err) {
							const formattedError = {
								message: err.toString(),
								stack: err.stack,
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
			return remotes.execHooks('before', method, method.ctor, ctx, execHooksErr => {
				if (execHooksErr) return callback(execHooksErr);

				// invoke the static method on the actual constructor
				return ctx.invoke(method.ctor, method, (invokeErr, result) => {
					if (invokeErr) return callback(invokeErr);
					ctx.result = result;

					return remotes.execHooks('after', method, method.ctor, ctx, err => {
						// send the result
						callback(err, ctx.result);
					});
				});
			});
		}

		// invoke the shared constructor to get an instance
		return ctx.invoke(method.ctor, method.sharedCtor || method, (invokeErr, inst) => {
			if (invokeErr) return callback(invokeErr);
			ctx.instance = inst;

			return remotes.execHooks('before', method, inst, ctx, execHooksErr => {
				if (execHooksErr) return callback(execHooksErr);

				// invoke the instance method
				return ctx.invoke(inst, method, (invokeErr2, result) => {
					if (invokeErr2) return callback(invokeErr2);

					ctx.result = result;
					return remotes.execHooks('after', method, inst, ctx, err => {
						// send the result
						callback(err, ctx.result);
					});
				});

			});
		});
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
