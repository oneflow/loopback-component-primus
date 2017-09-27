/**
 * Module dependencies.
 */

const EventEmitter = require('events').EventEmitter;
const debug = require('debug')('strong-remoting:primus-context');
const util = require('util');
const assert = require('assert');
const ContextBase = require('strong-remoting/lib/context-base');
const SharedMethod = require('strong-remoting/lib/shared-method');

const inherits = util.inherits;

/**
 * Create a new `PrimusContext` with the given `options`.
 *
 * @param method
 * @param spark
 * @param ctorArgs
 * @param args
 * @param remotes
 * @constructor
 */

class PrimusContext extends ContextBase {
	constructor(method, spark, ctorArgs, args, remotes) {
		super(method, remotes._typeRegistry);
		this.method = method;
		this.methodString = method.stringName;
		this.spark = spark;
		this.args = args;
		this.ctorArgs = ctorArgs;
		this.args = this.buildArgs(method);

		this.ctorArgs.options = {};
		this.args.options = {};
	}

	/**
	 * Get an arg by name using the given options.
	 *
	 * @param {String} name
	 * @param {Object} options **optional**
	 */
	getArgByName(name, options) {
		return this.args[name];
	}

	/**
	 * Set an arg by name using the given options.
	 *
	 * @param {String} name
	 * @param {Object} options **optional**
	 */
	setArgByName(name, options) {
		throw 'not implemented';
	}

	/**
	 * Set part or all of the result by name using the given options.
	 *
	 * @param {String} name
	 * @param {Object} options **optional**
	 */
	setResultByName(name, options) {

	}

	/**
	 * Get part or all of the result by name using the given options.
	 *
	 * @param {String} name
	 * @param {Object} options **optional**
	 */
	getResultByName(name, options) {

	}

	/**
	 * Invoke the given shared method using the provided scope against
	 * the current context.
	 */
	invoke(scope, method, fn) {
		const args = method.isSharedCtor ? this.ctorArgs : this.args;
		const accepts = method.accepts;
		const returns = method.returns;
		const errors = method.errors;
		let result;

		// invoke the shared method

		method.invoke(scope, args || {}, null, this, function (err) {
			const resultArgs = arguments;

			if (method.name === 'on' && method.ctor instanceof EventEmitter) {
				resultArgs[1] = resultArgs[0];
				err = null;
			}

			if (err) {
				return fn(err);
			}

			// map the arguments using the returns description
			if (returns.length > 1) {
				// multiple
				result = {};

				returns.forEach((o, i) => {
					// map the name of the arg in the returns desc
					// to the same arg in the callback
					result[o.name || o.arg] = resultArgs[i + 1];
				});
			} else {
				// single or no result...
				result = resultArgs[1];
			}

			fn(null, result);
		});
	}

	setReturnArgByName(name, value) {

	}

	buildArgs(method) {
		const args = {};
		const ctx = this;
		const accepts = method.accepts;

		// build arguments from req and method options
		for (let i = 0, n = accepts.length; i < n; i++) {
			const o = accepts[i];
			const httpFormat = o.http;
			const name = o.name || o.arg;
			var val;

			const typeConverter = ctx.typeRegistry.getConverter(o.type);
			const conversionOptions = SharedMethod.getConversionOptionsForArg(o);

			// Turn off sloppy coercion for values coming from JSON payloads.
			// This is because JSON, unlike other methods, properly retains types
			// like Numbers, Booleans, and null/undefined.
			let doSloppyCoerce = false;

			// This is an http method keyword, which requires special parsing.
			if (httpFormat) {
				switch (typeof httpFormat) {
					case 'function':
						// the options have defined a formatter
						val = httpFormat(ctx);
						// it's up to the custom provider to perform any coercion as needed
						doSloppyCoerce = false;
						break;
					case 'object':
						switch (httpFormat.source) {
							case 'context':
								// Direct access to http context
								val = ctx;
								break;
							default:
								// Otherwise take from payload
								val = ctx.getArgByName(name, o);
								break;
						}
						break;
				}
			} else {
				val = ctx.getArgByName(name, o);
			}

			// Most of the time, the data comes through 'sloppy' methods like HTTP headers or a qs
			// which don't preserve types.
			//
			// Use some sloppy typing semantics to try to guess what the user meant to send.
			const result = doSloppyCoerce ?
				typeConverter.fromSloppyValue(ctx, val, conversionOptions) :
				typeConverter.fromTypedValue(ctx, val, conversionOptions);

			debug('arg %j: %s converted %j to %j',
				name, doSloppyCoerce ? 'sloppy' : 'typed', val, result);

			const isValidResult = typeof result === 'object' &&
				('error' in result || 'value' in result);
			if (!isValidResult) {
				throw new (assert.AssertionError)({
					message: `${'Type conversion result should have "error" or "value" property. ' +
					'Got '}${JSON.stringify(result)} instead.`
				});
			}

			if (result.error) {
				throw result.error;
			}

			// Set the argument value.
			args[o.arg] = result.value;
		}

		return args;
	}

	getScope() {
		// Static methods are invoked on the constructor (this = constructor fn)
		// Prototype methods are invoked on the instance (this = instance)
		const method = this.method;
		return this.instance ||
			method.ctor ||
			method.sharedMethod && method.sharedMethod.ctor;
	}
}

inherits(PrimusContext, EventEmitter);


/**
 * Expose `PrimusContext`.
 */
module.exports = PrimusContext;
