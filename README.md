# good-map

Transform stream for [Hapi Good](https://github.com/hapijs/good) process monitoring.
Properties of the incoming object stream can be modified with your own mapping functions.

[![Build Status](https://travis-ci.org/frankthelen/good-map.svg?branch=master)](https://travis-ci.org/frankthelen/good-map)
[![Coverage Status](https://coveralls.io/repos/github/frankthelen/good-map/badge.svg?branch=master)](https://coveralls.io/github/frankthelen/good-map?branch=master)
[![dependencies Status](https://david-dm.org/frankthelen/good-map/status.svg)](https://david-dm.org/frankthelen/good-map)
[![Greenkeeper badge](https://badges.greenkeeper.io/frankthelen/good-map.svg)](https://greenkeeper.io/)
[![Maintainability](https://api.codeclimate.com/v1/badges/2b21f79b2657870c146f/maintainability)](https://codeclimate.com/github/frankthelen/good-map/maintainability)
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Ffrankthelen%2Fgood-map.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Ffrankthelen%2Fgood-map?ref=badge_shield)
[![node](https://img.shields.io/node/v/good-map.svg)]()
[![License Status](http://img.shields.io/npm/l/good-map.svg)]()

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
        events: ['log'],
        tags: ['error'],
        map: {
          timestamp: ms => moment(ms).utc().format(),
          'database.password': () => '***',
          'error.stack': stack => truncate(stack),
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

`GoodMap(rules, [options])` has the following parameters:

 * `rules`: An object with the following parameters:
   - `events`: An optional list of Hapi server events, e.g., `['request']`, for filtering purposes.
   - `tags`: An optional list of event tags, e.g., `['error']`, for filtering purposes.
   - `map`: An object mapping log item properties (including deep properties separated by dots), e.g., `timestamp` or `error.message`, using a mapping function of the form `value => 'newValue'`, e.g., `() => '***'` or `str => str.toUpperCase()`. If a property does not exist (before), it will *not* be set. If the mapping function returns `undefined`, the property will be deleted. If the mapping function throws an error (for whatever reason), the error will be suppressed.
 * `options`: Optional configuration object that gets passed to the Node [Stream.Transform](http://nodejs.org/api/stream.html#stream_class_stream_transform) constructor. `objectMode` is always `true`.
