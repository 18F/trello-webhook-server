'use strict';

const tap = require('tap');
const sinon = require('sinon');
const mockRequire = require('mock-require');
const request = require('request');
const util = require('./util');

const verifyMock = sinon.stub();
mockRequire('../bin/webhook-verify', verifyMock);

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
  const sandbox = sinon.sandbox.create();

  t1.test('constructor', t2 => {
    let whs;

    function wrapper(config) {
      return function() {
        whs = new WebhookServer(config);
      };
    }

    util.forEachFail(values, args => {
      const fn = wrapper(getConfig.apply(getConfig, args));
      t2.test(`with port [${args[0]}], host [${args[1]}], key [${args[2]}], token [${args[3]}], secret [${args[4]}]`, t3 => {
        t3.throws(fn, 'throws an exception');
        t3.equals(whs, undefined, 'constructor does not return a value');
        t3.done();
      });
    });

    t2.test(`with port [${port}], host [${host}], key [${apiKey}], token [${apiToken}], secret [${apiSecret}]`, t3 => {
      const fn = wrapper(getConfig(port, host, apiKey, apiToken, apiSecret));
      t3.doesNotThrow(fn, 'does not throw an exception');
      t3.equals(typeof whs, 'object', 'constructor returns an object');
      t3.done();
    });

    t2.done();
  });

  t1.done();
});
