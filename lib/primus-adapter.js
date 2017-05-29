/**
 * Module dependencies.
 */

const EventEmitter = require('events').EventEmitter;
// const debug = require('debug')('strong-remoting:primus-adapter');
// const util = require('util');
const Primus = require('primus');
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
	constructor(remotes, server, primusInstance) {
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

	connect(url) {
		console.log(url);
		return this;
	}

	createHandler() {
		const adapter = this;
		const remotes = this.remotes;
		// const classes = this.remotes.classes();
		const primus = this.primus || new Primus(this.server);
		primus.plugin('emit', primusEmitter);

		primus.on('connection', spark => {
			adapter.spark = spark;
			spark.on('invoke', (data = {}, done) => {
				const method = remotes.findMethod(data.methodString);
				const args = data.args || {};

				if (method) {
					const ctx = new PrimusContext(method, spark, args, args, remotes);
					adapter.invoke(ctx, method, data.args, (err, result) => {
						if (err) {
							done({ err: err });
						}

						return done(null, result);
					});
				} else {
					done({ err: 'no method with this name' });
				}
			});
		});
		return primus;
	}

	invoke(ctx, method, args, callback) {
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
}


/**
 * Expose `PrimusAdapter`.
 */
module.exports = PrimusAdapter;
