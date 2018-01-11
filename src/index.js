const Stream = require('stream');
const get = require('lodash.get');
const set = require('lodash.set');

class GoodMap extends Stream.Transform {
  constructor(map = {}, options = {}) {
    super(Object.assign({}, options.stream, { objectMode: true }));
    this.map = map;
  }
  _transform(data, enc, next) {
    const props = Object.keys(this.map);
    props.forEach((prop) => {
      try {
        const value = get(data, prop);
        const newValue = this.map[prop](value);
        set(data, prop, newValue);
      } catch (error) {
        // console.error(error); // eslint-disable-line no-console
      }
    });
    next(null, data);
  }
}

module.exports = GoodMap;
