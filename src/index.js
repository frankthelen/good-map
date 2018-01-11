const Stream = require('stream');
const get = require('lodash.get');
const set = require('lodash.set');
const unset = require('lodash.unset');

class GoodMap extends Stream.Transform {
  constructor(rules = {}, options = {}) {
    super({ ...options, objectMode: true });
    const { events = [], tags = [], map = {} } = rules;
    this.events = events;
    this.tags = tags;
    this.map = map;
    this.props = Object.keys(map);
  }
  _transform(data, enc, next) {
    const { event, tags = [] } = data;
    if (this.events.length && !this.events.includes(event)) {
      return next(null, data);
    }
    if (this.tags.length && !this.tags.reduce((acc, tag) => acc || tags.includes(tag), false)) {
      return next(null, data);
    }
    this.props.forEach((prop) => {
      try {
        const value = get(data, prop);
        if (value === undefined) {
          // do nothing
        } else {
          const newValue = this.map[prop](value);
          if (newValue === undefined) {
            unset(data, prop);
          } else {
            set(data, prop, newValue);
          }
        }
      } catch (error) {
        // ignore
      }
    });
    return next(null, data);
  }
}

module.exports = GoodMap;
