'use strict';

const tap = require('tap');
const sinon = require('sinon');
const http = require('http');
const mockRequire = require('mock-require');
const sandbox = sinon.sandbox.create();

const on = sandbox.spy();
const listen = sandbox.stub().yields();
const createServer = sandbox.stub(http, 'createServer').returns({ on, listen });

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
    port: 5000
  },
  registrar: {
    register: sandbox.spy()
  }
}

const express = require('../bin/get-own-server-setup');

tap.test('Get own server setup', t1 => {
  const setupExpress = express(tws, null);
  t1.equal(typeof setupExpress, 'function', 'returns a setup function');

  t1.test('setup function', t2 => {
    setupExpress(modelID);
    t2.equal(tws.config.modelID, modelID, 'model ID is added to config');
    t2.equal(tws.config.callbackURL, `${hostURL}/${modelID}`, 'builds up and sets the callback URL');
    t2.equal(createServer.callCount, 1, 'creates an HTTP server object');

    setTimeout(() => {
      t2.equal(setupSIG.callCount, 1, 'sets up SIGINT/SIGTERM handlers');

      t2.test('registers webhook', t3 => {
        t3.equal(tws.registrar.register.callCount, 1, 'calls registration method');
        t3.equal(tws.registrar.register.args[0][0], tws.config.callbackURL, 'supplies the callback ID');
        t3.equal(tws.registrar.register.args[0][1], modelID, 'supplies the model ID');
        t3.done();
      });

      t2.test('HTTP event handler', t3 => {
        t3.equal(on.callCount, 1, 'sets up an HTTP event handler');
        t3.equal(on.args[0][0], 'request', 'registers for HTTP request events');
        t3.equal(typeof on.args[0][1], 'function', 'request handler is a function');
        t3.equal(on.args[0][1], httpHandler, 'request handler is the HTTP handler');
        t3.done();
      });

      t2.done();
    }, 50);
  });

  t1.done();
});
