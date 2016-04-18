'use strict';

const tap = require('tap');
const sinon = require('sinon');
const mockRequire = require('mock-require');
const sandbox = sinon.sandbox.create();

const setupSIG = sandbox.spy();
mockRequire('../bin/setup-sigint-sigterm', setupSIG);

const httpHandler = sandbox.spy();
const getHTTPHandler = sandbox.stub().returns(httpHandler);
mockRequire('../bin/http-handler', getHTTPHandler);

const modelID = 'model-id';
const hostSubpath = 'callbackpath';
const hostURL = `https://server.com/${hostSubpath}`;

const tws = {
  config: {
    modelID: false,
    hostURL,
    server: {
      head: sandbox.spy(),
      put: sandbox.spy(),
      post: sandbox.spy()
    }
  },
  registrar: {
    register: sandbox.spy()
  }
}

const express = require('../bin/get-express-server-setup');

tap.test('Get Express server setup', t1 => {
  const setupExpress = express(tws, null);
  t1.equal(typeof setupExpress, 'function', 'returns a setup function');

  t1.test('setup function', t2 => {
    setupExpress(modelID);
    t2.equal(tws.config.modelID, modelID, 'model ID is added to config');
    t2.equal(tws.config.callbackURL, `${hostURL}/${modelID}`, 'builds up and sets the callback URL');
    t2.equal(setupSIG.callCount, 1, 'sets up SIGINT/SIGTERM handlers');
    t2.equal(tws.registrar.register.callCount, 1, 'registers webhook');

    t2.test('HTTP handlers', t3 => {
      t3.equal(getHTTPHandler.callCount, 1, 'gets HTTP handlers');
      t3.equal(tws.config.server.head.callCount, 1, 'sets up an HTTP HEAD handler');
      t3.equal(tws.config.server.head.args[0][0], `/${hostSubpath}/${modelID}`, 'registers for HEAD on the right path')
      t3.equal(typeof tws.config.server.head.args[0][1], 'function', 'HEAD handler is a function');
      t3.equal(tws.config.server.put.callCount, 1, 'sets up an HTTP PUT handler');
      t3.equal(tws.config.server.put.args[0][0], `/${hostSubpath}/${modelID}`, 'registers for PUT on the right path')
      t3.equal(typeof tws.config.server.put.args[0][1], 'function', 'PUT handler is a function');
      t3.equal(tws.config.server.post.callCount, 1, 'sets up an HTTP POST handler');
      t3.equal(tws.config.server.post.args[0][0], `/${hostSubpath}/${modelID}`, 'registers for POST on the right path')
      t3.equal(typeof tws.config.server.post.args[0][1], 'function', 'POST handler is a function');
      t3.done();
    });

    const headHandler = tws.config.server.head.args[0][1];
    const putHandler = tws.config.server.put.args[0][1];
    const postHandler = tws.config.server.post.args[0][1];

    t2.test('handles incoming express events', t3 => {
      const next = sinon.spy();
      for(const variant of [{ verb: 'HEAD', fn: headHandler }, { verb: 'PUT', fn: putHandler }, { verb: 'POST', fn: postHandler }]) {
        t3.test(`handles ${variant.verb}`, t4 => {
          httpHandler.reset();
          next.reset();

          variant.fn(1, 2, next);
          t4.equal(httpHandler.callCount, 1, 'http handler called');
          t4.equal(next.callCount, 1, 'express next() called');
          t4.done();
        });
      }
      t3.done();
    })
    t2.done();
  });

  t1.done();
});
