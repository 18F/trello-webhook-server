'use strict';

console.error = () => { }; // eslint-disable-line no-console

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
      on: sandbox.spy()
    }
  },
  registrar: {
    register: sandbox.spy()
  }
};

const express = require('../bin/get-http-server-setup');

tap.test('Get HTTP server setup', t1 => {
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
      t3.equal(tws.config.server.on.callCount, 1, 'sets up an HTTP event handler');
      t3.equal(tws.config.server.on.args[0][0], 'request', 'registers for HTTP request events');
      t3.equal(typeof tws.config.server.on.args[0][1], 'function', 'request handler is a function');
      t3.done();
    });

    const requestHandler = tws.config.server.on.args[0][1];

    t2.test('handles incoming requests on expected path', t3 => {
      httpHandler.reset();
      requestHandler({ url: `/${hostSubpath}/${modelID}` }, null);
      t3.equal(httpHandler.callCount, 1, 'called the HTTP handler');
      t3.done();
    });
    t2.test('ignores incoming requests on other paths', t3 => {
      httpHandler.reset();
      requestHandler({ url: '/wrong/path' }, null);
      t3.equal(httpHandler.callCount, 0, 'did not call the HTTP handler');
      t3.done();
    });

    t2.done();
  });

  t1.done();
});
