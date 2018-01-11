# good-map

Transform stream for Hapi Good process monitoring.
Object properties of incoming stream can be modified easily.
Requires Hapi 17 and Good 8 and up.

## Install

```bash
npm install --save good-map
```

## Usage

Your Good logging configuration may look like this:
```javascript
const Hapi = require('hapi');
const Good = require('good'),

const server = new Hapi.Server();

const options = {
  reporters: {
    myConsoleReporter: [{
      module: 'good-squeeze',
      name: 'Squeeze',
      args: [{ log: '*', response: '*' }],
    }, {
      module: 'good-map',
      args: [{
        timestamp: ms => moment(ms).utc().format(),
        'database.password': () => '***',
        'error.stack': stack => truncate(stack),
      }],
    }, {
      module: 'good-console',
    }, 'stdout'],
  },
};

await server.register({
  plugin: Good,
  options,
});

await server.start();
```
