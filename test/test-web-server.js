'use strict';

console.error = () => { }; // eslint-disable-line no-console

const tap = require('tap');
const http = require('http');
const sinon = require('sinon');
const ws = require('../bin/web-server');

tap.test('web server', t1 => {
  const sandbox = sinon.sandbox.create();
  const listen = sandbox.spy();
  const createServer = sandbox.stub(http, 'createServer').returns({ listen });

  const port = 8080;
  const callback = () => { };

  t1.tearDown(() => {
    sandbox.restore();
  });

  t1.test('first call', t2 => {
    ws(port, callback)
      .then(() => {
        t2.pass('resolves');
        t2.equal(createServer.callCount, 1, 'http.createServer is called once');
        t2.equal(createServer.args[0][0], callback, 'http.createServer is called with the specified callback');
        t2.equal(listen.callCount, 1, 'server.listen is called once');
        t2.equal(listen.args[0][0], port, 'server.listen is called with the specified port');
        t2.done();
      })
      .catch(() => {
        t2.fail('resolves');
        t2.done();
      });
  });

  t1.test('subsequent call', t2 => {
    ws(port, callback)
      .then(() => {
        t2.equal(createServer.callCount, 1, 'http.createServer is not called again');
        t2.equal(listen.callCount, 1, 'server.listen is not called again');
        t2.done();
      })
      .catch(() => {
        t2.fail('resolves');
        t2.done();
      });
  });

  t1.done();
});
