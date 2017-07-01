const primusComponent = require('../index');
const loopback = require('loopback');
const app = loopback();

const db = app.dataSource('db', { adapter: 'memory' });

let Color = app.registry.createModel('color');
Color.createOptionsFromRemotingContext = function (ctx) {
	return {
		accessToken: ctx.req ? ctx.req.accessToken : null,
	};
};

app.model(Color, { dataSource: db });
Color.create({ name: 'yellow' });
Color.setup();

app.server = app.listen(3000);
primusComponent(app);
app.emit('started');


app.remotes().before('color.*', function (ctx, next) {
	console.log('methodString', ctx.methodString);
	next();
});

console.log('server started on port 3000');
