const assert = require('assert');
const extend = require('util')._extend;
const inherits = require('util').inherits;
const RemoteObjects = require('strong-remoting/lib/remote-objects');
const PrimusAdapter = require('../lib/primus-adapter');
const PrimusContext = require('../lib/primus-context');
const SharedClass = require('strong-remoting/lib/shared-class');
const SharedMethod = require('strong-remoting/lib/shared-method');
const expect = require('chai').expect;
const factory = require('strong-remoting/test/helpers/shared-objects-factory');
function NOOP() {}

describe('PrimusAdapter', () => {
	let remotes;

	beforeEach(() => {
		remotes = RemoteObjects.create();
	});

	describe('invoke()', () => {
		let remotes;

		beforeEach(() => {
			remotes = RemoteObjects.create();
		});

		afterEach(() => {});

		it('should call remote hooks', done => {
			let beforeCalled = false;
			let afterCalled = false;
			const name = 'testClass.testMethod';

			remotes.before(name, (ctx, next) => {
				beforeCalled = true;
				next();
			});

			remotes.after(name, (ctx, next) => {
				afterCalled = true;
				next();
			});

			const primusAdapter = getPrimusAdapter({ isStatic: true });
			const method = remotes.findMethod(name);
			const ctx = getPrimusContext(method, [], remotes);
			primusAdapter.invoke(ctx, method, [], () => {
				assert(beforeCalled);
				assert(afterCalled);
				done();
			});
		});

		it('should propagate the ctx object', done => {
			const beforeCalled = false;
			const afterCalled = false;
			const name = 'testClass.testMethod';

			remotes.before(name, (ctx, next) => {
				ctx.value = true;
				next();
			});

			const methodConfig = {
				accepts: [
					{ arg: 'ctx', type: 'object', http: { source: 'context' } }
				]
			};

			const methodFn = function (ctx, callback) {
				assert(ctx instanceof PrimusContext);
				assert(ctx.value);
				callback();
			};

			const primusAdapter = getPrimusAdapter(methodConfig, methodFn);
			const method = remotes.findMethod(name);
			const ctx = getPrimusContext(method, [], remotes);

			primusAdapter.invoke(ctx, method, [], (err, result) => {
				if (err) {
					return done(err);
				}

				done();
			});
		});

		function getPrimusAdapter(methodConfig, methodFn, classConfig) {
			const name = 'testMethod';
			methodConfig = extend({ isStatic: true, accepts: [], returns: [] }, methodConfig);
			classConfig = extend({ shared: true }, classConfig);
			const testClass = extend({}, classConfig);
			testClass[name] = methodFn || function (done) { done(); };

			const sharedClass = new SharedClass('testClass', testClass);
			sharedClass.defineMethod(name, methodConfig);
			remotes.addClass(sharedClass);
			return new PrimusAdapter(remotes);
		}

		function getPrimusContext(method, args, remotes) {
			return new PrimusContext(method, null, args, args, remotes);
		}
	});
});

function someFunc() {
}

function ignoreDeprecationsInThisBlock() {
	before(() => {
		process.on('deprecation', NOOP);
	});

	after(() => {
		process.removeListener('deprecation', NOOP);
	});
}
