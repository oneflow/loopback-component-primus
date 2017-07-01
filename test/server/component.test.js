const expect = require('chai').expect;
const Primus = require('primus');
const PrimusAdapter = require('../../lib/primus-adapter');
const loopback = require('loopback');
const primusComponent = require('../../index');

let app = null;
let db = null;
describe('primusComponent', () => {
	describe('with default config', () => {
		beforeEach(givenLoopBackAppWithPrimus());
		it('should register "loopback-component-primus" to the app', () => {
			const primusAdapter = app.get('primus');
			expect(primusAdapter).instanceof(PrimusAdapter);
		});
	});

	function givenLoopBackAppWithPrimus(options) {
		return function (done) {
			app = this.app = loopback();
			app.server = app.listen();
			configureModelsAndComponent(app, options);
			app.emit('started');
			done();
		};
	}

	function configureModelsAndComponent(app, options) {
		db = app.dataSource('db', { adapter: 'memory' });
		const Product = app.registry.createModel('product');
		app.model(Product, {
			relations: {
				shop: {
					type: 'belongsTo',
					model: 'shop'
				}
			},
			dataSource: 'db'
		});
		primusComponent(app, options);
	}
});
