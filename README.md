# loopback-component-primus

Primus adapter for loopback. It allows you to call loopback's remote methods via websocket.

## Getting Started
``` bash
npm install --save @oneflow/loopback-component-primus
```


Add the loopback-component-primus component to the ```server/component-config.json```:

``` json
"@oneflow/loopback-component-primus": {}
```

A small change is needed in the ```server/server.js``` file, replace:
```javascript
app.start();
```

with:
```javascript
app.server = app.start();
```



## Usage

##### Call remote methods
The primus client library is exposed at the URL ```http://<LOOPBACK_URL>/primus/primus.js```
You will need to import it in your html:
```html
<script type="text/javascript" src="http://<LOOPBACK_URL>/primus/primus.js"></script>
```

Then, in your code:
```javascript
const primus = new Primus({
	url: 'http://<LOOPBACK_URL>',
});
```

Now you will be able to call remote methods using ```primus.send('invoke', {...});```
```javascript

// Call prototype method:

primus.send('invoke', {
		methodString: 'color.prototype.patchAttributes',
		args: {
			id: 1,
			data: { name: 'black' }
		},
	}, function (err, data) {
		if (err) {
			return alert('Error from server: ' + JSON.stringify(err));
		}

		alert('Record updated: ' + JSON.stringify(data));
	});
		
// Call static method:
primus.send('invoke', {
		methodString: 'color.find',
		args: {
			filter: {
				where: {
					name: 'black'
				}
			}
		},
	}, function (err, data) {
		if (err) return alert('Error from server: ' + JSON.stringify(err));
	
		alert('Find results: ' + JSON.stringify(data));
	});
```

##### Remote hooks
[Operation hooks](https://loopback.io/doc/en/lb3/Operation-hooks.html) will not work with the primus adapter (they work only with the REST adapter).
We will use the **global remote hooks** that works seamless with all adapters.
The syntax is slighly different:
```javascript
app.remotes().before('user.*', function (ctx, next) {
	console.log('methodString', ctx.methodString);
	next();
});

app.remotes().before('**', function (ctx, next) {
	console.log('methodString', ctx.methodString);
	next();
});
```

##### Spark 
You can find the ```spark``` property, in the ```ctx``` object.
