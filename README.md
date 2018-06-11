# good-map

Transform stream for [Hapi Good](https://github.com/hapijs/good) process monitoring.
Modify the incoming object stream with your own mapping functions.

[![Build Status](https://travis-ci.org/frankthelen/good-map.svg?branch=master)](https://travis-ci.org/frankthelen/good-map)
[![Coverage Status](https://coveralls.io/repos/github/frankthelen/good-map/badge.svg?branch=master)](https://coveralls.io/github/frankthelen/good-map?branch=master)
[![dependencies Status](https://david-dm.org/frankthelen/good-map/status.svg)](https://david-dm.org/frankthelen/good-map)
[![Greenkeeper badge](https://badges.greenkeeper.io/frankthelen/good-map.svg)](https://greenkeeper.io/)
[![Maintainability](https://api.codeclimate.com/v1/badges/e8f1b067534e0387bdcf/maintainability)](https://codeclimate.com/github/frankthelen/good-map/maintainability)
[![node](https://img.shields.io/node/v/good-map.svg)]()
[![code style](https://img.shields.io/badge/code_style-airbnb-brightgreen.svg)](https://github.com/airbnb/javascript)
[![License Status](http://img.shields.io/npm/l/good-map.svg)]()

## Install

```bash
npm install good-map
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
        events: ['log'],
        tags: ['error'],
        map: {
          timestamp: ms => moment(ms).utc().format(),
          'database.password': () => '***',
          'error.stack': stack => truncate(stack),
        },
        observe: (item) => {
          item.service = 'bla';
        },
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

## Configuration

The `good-map` transform stream can be placed anywhere in the pipeline where log values are still objects, e.g., after `Squeeze`.

`args` in the Good configuration for `good-map` is an array with two arguments which are passed to `GoodMap(rules, [options])`:

 * `rules`: An object with the following parameters (all optional):
   - `events`: A list of Hapi server event types, e.g., `['request']`, for filtering purposes.
   - `tags`: A list of event tags, e.g., `['error']`, for filtering purposes.
   - `map`: An object that maps the log item's properties (including deep properties separated by dots), e.g., `timestamp` or `'error.message'` to a mapping function (synchronous). It has the form `(value) => 'newValue'`, e.g., `() => '***'` or `str => str.toUpperCase()`. If a property does not exist (before), it is *not* set. If the mapping function returns `undefined`, the property is deleted. If the mapping function throws an error, the error is ignored. For full flexibility, the second parameter provides access to the complete log item: `(value, item) => ...`.
   - `observe`: Listen to the complete log item as it appears in the stream. The observer function (synchronous) has the form `(item) => { ... }`. Use this hook to read and write to the log item. If the observer function throws an error, the error is ignored.
 * `options`: An optional configuration object that gets passed to the Node [Stream.Transform](http://nodejs.org/api/stream.html#stream_class_stream_transform) constructor. `objectMode` is always `true`.
