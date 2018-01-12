const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const moment = require('moment');
const Stream = require('stream');
const GoodMap = require('..');

chai.use(chaiAsPromised);
chai.use(sinonChai);

global.chai = chai;
global.sinon = sinon;
global.expect = chai.expect;
global.should = chai.should();

describe('GoodMap', () => {
  const testEvents = [{
    event: 'request', id: 1, tags: ['info'], prop: false,
  }, {
    event: 'log', id: 2, tags: ['error', 'debug'], prop: false, deep: { prop: false },
  }, {
    event: 'ops', id: 3, prop: false, timestamp: 1515676053607,
  }];

  const pipe = async (options, events) => new Promise((resolve) => {
    const stream = new GoodMap(options);
    const read = new Stream.Readable({ objectMode: true });
    const result = [];
    stream.on('data', (data) => {
      result.push(data);
    });
    stream.on('end', () => {
      resolve(result);
    });
    read.pipe(stream);
    events.forEach((event) => { read.push(event); });
    read.push(null);
  });

  it('should pass through all events', async () => {
    const result = await pipe(undefined, testEvents);
    expect(result.length).to.equal(3);
  });

  it('should filter by event name', async () => {
    const options = {
      events: ['request'],
      map: {
        prop: () => true,
      },
    };
    const result = await pipe(options, testEvents);
    expect(result.length).to.equal(3);
    expect(result[0].prop).to.equal(true);
    expect(result[1].prop).to.equal(false);
    expect(result[2].prop).to.equal(false);
  });

  it('should filter by tag', async () => {
    const options = {
      tags: ['info'],
      map: {
        prop: () => true,
      },
    };
    const result = await pipe(options, testEvents);
    expect(result.length).to.equal(3);
    expect(result[0].prop).to.equal(true);
    expect(result[1].prop).to.equal(false);
    expect(result[2].prop).to.equal(false);
  });

  it('should filter by multiple tags', async () => {
    const options = {
      tags: ['info', 'error'],
      map: {
        prop: () => true,
      },
    };
    const result = await pipe(options, testEvents);
    expect(result.length).to.equal(3);
    expect(result[0].prop).to.equal(true);
    expect(result[1].prop).to.equal(true);
    expect(result[2].prop).to.equal(false);
  });

  it('should not fail if mapping function throws error', async () => {
    const options = {
      tags: ['info', 'error'],
      map: {
        prop: () => { const bla = true; return bla.blub.bli; }, // TypeError
      },
    };
    const result = await pipe(options, testEvents);
    expect(result.length).to.equal(3);
  });

  it('should assign deep property (if exists)', async () => {
    const options = {
      map: {
        'deep.prop': () => true,
      },
    };
    const result = await pipe(options, testEvents);
    expect(result.length).to.equal(3);
    expect(result[0]).to.not.have.property('deep');
    expect(result[1].deep.prop).to.equal(true);
    expect(result[2]).to.not.have.property('deep');
  });

  it('should transform property (if exists)', async () => {
    const options = {
      map: {
        timestamp: ms => moment(ms).utc().format(),
      },
    };
    const result = await pipe(options, testEvents);
    expect(result.length).to.equal(3);
    expect(result[0]).to.not.have.property('timestamp');
    expect(result[1]).to.not.have.property('timestamp');
    expect(result[2]).to.have.property('timestamp');
    expect(result[2].timestamp).to.be.equal('2018-01-11T13:07:33Z');
  });

  it('should unset property (if exists)', async () => {
    const options = {
      map: {
        timestamp: () => undefined,
      },
    };
    const result = await pipe(options, testEvents);
    expect(result.length).to.equal(3);
    expect(result[2]).to.not.have.property('timestamp');
  });

  it('should provide the log item in the mapping function', async () => {
    const collect = [];
    const options = {
      map: {
        prop: (value, item) => { collect.push(item); return true; },
      },
    };
    await pipe(options, testEvents);
    expect(collect.length).to.equal(3);
    expect(collect[0]).to.deep.equal({ ...testEvents[0], prop: true });
    expect(collect[1]).to.deep.equal({ ...testEvents[1], prop: true });
    expect(collect[2]).to.deep.equal({ ...testEvents[2], prop: true });
  });

  it('should call the observer function after mapping', async () => {
    const collect = [];
    const options = {
      map: {
        prop: () => true,
      },
      observe: (item) => {
        item.bla = true; // eslint-disable-line no-param-reassign
        collect.push(item);
      },
    };
    await pipe(options, testEvents);
    expect(collect.length).to.equal(3);
    expect(collect[0]).to.deep.equal({ ...testEvents[0], prop: true, bla: true });
    expect(collect[1]).to.deep.equal({ ...testEvents[1], prop: true, bla: true });
    expect(collect[2]).to.deep.equal({ ...testEvents[2], prop: true, bla: true });
  });
});
