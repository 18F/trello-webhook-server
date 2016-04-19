'use strict';

const tap = require('tap');
const sinon = require('sinon');
const mockRequire = require('mock-require');
const request = require('request');
const util = require('./util');
const sandbox = sinon.sandbox.create();

const expressSetup = sandbox.spy();
const httpSetup = sandbox.spy();
const ownSetup = sandbox.spy();
mockRequire('../bin/get-express-server-setup', expressSetup);
mockRequire('../bin/get-http-server-setup', httpSetup);
mockRequire('../bin/get-own-server-setup', ownSetup);

const WebhookServer = require('../bin/webhook-server');

const values = require('./webhook-server-fail.json');
const port = values.port[values.port.length - 1];
const host = values.host[values.host.length - 1];
const apiKey = values.key[values.key.length - 1];
const apiToken = values.token[values.token.length - 1];
const apiSecret = values.secret[values.secret.length - 1];

console.error = () => { };

function getConfig(port, hostURL, apiKey, apiToken, clientSecret) {
  return { port, hostURL, apiKey, apiToken, clientSecret };
}

tap.test('Webhook server class', t1 => {

  t1.test('constructor', t2 => {
    let whs;

    t2.beforeEach(done => {
      whs = undefined;
      sandbox.reset();
      done();
    });

    function wrapper(config) {
      return function() {
        whs = new WebhookServer(config);
      };
    }

    t2.test('with no config', t3 => {
      const fn = wrapper();
      t3.throws(fn, 'throws an exception');
      t3.equals(whs, undefined, 'constructor does not return a value');
      t3.done();
    });

    util.forEachFail(values, args => {
      const fn = wrapper(getConfig.apply(getConfig, args));
      t2.test(`with no server, port [${args[1]}], host [${args[2]}], key [${args[3]}], token [${args[4]}], secret [${args[5]}]`, t3 => {
        t3.throws(fn, 'throws an exception');
        t3.equals(whs, undefined, 'constructor does not return a value');
        t3.done();
      });
    });

    t2.test(`with port [${port}], host [${host}], key [${apiKey}], token [${apiToken}], secret [${apiSecret}]`, t3 => {
      const fn = wrapper(getConfig(port, host, apiKey, apiToken, apiSecret));
      t3.doesNotThrow(fn, 'does not throw an exception');
      t3.equals(typeof whs, 'object', 'constructor returns an object');
      t3.equals(ownSetup.callCount, 1, 'own setup method is called');
      t3.equals(expressSetup.called, false, 'Express/restify setup method is not called');
      t3.equals(httpSetup.called, false, 'HTTP setup method is not called');
      t3.done();
    });

    t2.test(`with invalid server object, host [${host}], key [${apiKey}], token [${apiToken}], secret [${apiSecret}]`, t3 => {
      const config = getConfig(undefined, host, apiKey, apiToken, apiSecret);
      config.server = { };
      const fn = wrapper(config);
      t3.throws(fn, 'throws an exception');
      t3.equals(whs, undefined, 'constructor does not return a value');
      t3.done();
    });

    t2.test(`with Express/restify server, host [${host}], key [${apiKey}], token [${apiToken}], secret [${apiSecret}]`, t3 => {
      const config = getConfig(undefined, host, apiKey, apiToken, apiSecret);
      config.server = { constructor: { name: 'Server' }, use: () => { } };
      const fn = wrapper(config);
      t3.doesNotThrow(fn, 'does not throw an exception');
      t3.equals(typeof whs, 'object', 'constructor returns an object');
      t3.equals(expressSetup.callCount, 1, 'Express/restify setup method is called');
      t3.equals(httpSetup.called, false, 'HTTP setup method is not called');
      t3.equals(ownSetup.called, false, 'Own setup method is not called');
      t3.done();
    });

    t2.test(`with HTTP server, host [${host}], key [${apiKey}], token [${apiToken}], secret [${apiSecret}]`, t3 => {
      const config = getConfig(undefined, host, apiKey, apiToken, apiSecret);
      config.server = { constructor: { name: 'Server' } };
      const fn = wrapper(config);
      t3.doesNotThrow(fn, 'does not throw an exception');
      t3.equals(typeof whs, 'object', 'constructor returns an object');
      t3.equals(httpSetup.callCount, 1, 'HTTP setup method is called');
      t3.equals(expressSetup.called, false, 'Express/restify setup method is not called');
      t3.equals(ownSetup.called, false, 'own setup method is not called');
      t3.done();
    });

    t2.done();
  });

  t1.test('cleanup', t2 => {
    const whs = new WebhookServer(getConfig(port, host, apiKey, apiToken, apiSecret));
    whs.registrar = {
      unregister: sandbox.spy()
    };
    whs.cleanup();
    t2.equals(whs.registrar.unregister.callCount, 1, 'webhook unregister method called');
    t2.done();
  });

  t1.test('on', t2 => {
    const whs = new WebhookServer(getConfig(port, host, apiKey, apiToken, apiSecret));
    t2.test('before model ID is set (i.e., before server \'start\' method is called)', t3 => {
      t3.throws(() => whs.on(), 'throws an exception');
      t3.done();
    });
    t2.test('after model ID is set (i.e., after server \'start\' method is called)', t3 => {
      const modelID = 'model-id';
      const eventName = 'event-name';
      const handler = () => { };
      whs.config.modelID = modelID;
      t3.doesNotThrow(() => whs.on(eventName, handler), 'does not throw an exception');
      //t3.equals(typeof whs.handlers)
      t3.done();
    });
    t2.done();
  });

  t1.done();
});
