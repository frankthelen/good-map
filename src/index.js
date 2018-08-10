const _ = require('lodash');
const Stream = require('stream');

class GoodMap extends Stream.Transform {
  constructor(rules = {}, options = {}) {
    super({ ...options, objectMode: true });
    const {
      events = [], tags = [], map = {}, observe = () => {},
    } = rules;
    this.events = events;
    this.tags = tags;
    this.map = map;
    this.props = Object.keys(map);
    this.observe = observe;
  }

  _transform(data, enc, next) {
    // filter
    const { event, tags = [] } = data;
    if (this.events.length && !this.events.includes(event)) {
      return next(null, data);
    }
    if (this.tags.length && !this.tags.reduce((acc, tag) => acc || tags.includes(tag), false)) {
      return next(null, data);
    }
    // map properties
    this.props.forEach((prop) => {
      try {
        const value = _.get(data, prop);
        if (value === undefined) {
          // do nothing
        } else {
          const newValue = this.map[prop](value, data);
          if (newValue === undefined) {
            _.unset(data, prop);
          } else {
            _.set(data, prop, newValue);
          }
        }
      } catch (error) {
        // ignore
      }
    });
    // observe
    try {
      this.observe(data);
    } catch (error) {
      // ignore
    }
    // continue
    return next(null, data);
  }
}

module.exports = GoodMap;
