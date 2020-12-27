const Good = require('@hapi/good');
require('./test-helper');

const hapiVersions = ['hapi19', 'hapi20'];

hapiVersions.forEach((hapiVersion) => {
  // eslint-disable-next-line import/no-dynamic-require, global-require
  const Hapi = require(hapiVersion);

  describe(`${hapiVersion}`, async () => {
    describe('Integrate GoodMap with Hapi and Good', () => {
      let server;
      let stdoutSpy;

      before(async () => {
        server = new Hapi.Server({
          port: 5555,
        });
        const route = {
          method: 'GET',
          path: '/test/{id}',
          handler: () => 'ok',
        };
        const good = {
          plugin: Good,
          options: {
            ops: false,
            reporters: {
              stdout: [{
                module: '@hapi/good-squeeze',
                name: 'Squeeze',
                args: [{
                  log: '*', request: '*', response: '*', error: '*',
                }],
              }, {
                module: '.', // good-map
                args: [{
                  map: {
                    timestamp: () => 'foo',
                  },
                  observe: (item) => {
                    item.bar = 'baz'; // eslint-disable-line no-param-reassign
                  },
                }],
              }, {
                module: '@hapi/good-squeeze',
                name: 'SafeJson',
              }, 'stdout'],
            },
          },
        };
        await server.register([good]);
        await server.route([route]);
        await server.start();
        stdoutSpy = sinon.spy(process.stdout, 'write');
      });

      after(async () => {
        await server.stop();
        stdoutSpy.restore();
      });

      beforeEach(() => {
        stdoutSpy.resetHistory();
      });

      it('should log request and process good-map', async () => {
        const res = await server.inject({
          method: 'GET',
          url: '/test/4711',
        });
        expect(res.statusCode).to.be.equal(200);
        const item = JSON.parse(stdoutSpy.getCall(0).args[0]);
        expect(item).to.have.property('event', 'response');
        expect(item).to.have.property('method', 'get');
        expect(item).to.have.property('path', '/test/4711');
        expect(item).to.have.property('timestamp', 'foo');
        expect(item).to.have.property('bar', 'baz');
      });
    });
  });
});
