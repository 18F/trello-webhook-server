'use strict';

const tap = require('tap');
const sinon = require('sinon');
const mockRequire = require('mock-require');
const trello = require('node-trello');
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

tap.test('Webhook server class', t1 => {
  const sandbox = sinon.sandbox.create();

  t1.test('constructor', t2 => {
    let whs;

    function wrapper(port, host, key, token, secret) {
      return function() {
        whs = new WebhookServer(port, host, key, token, secret);
      };
    }

    util.forEachFail(values, args => {
      const fn = wrapper.apply(wrapper, args);
      t2.test(`with port [${args[0]}], host [${args[1]}], key [${args[2]}], token [${args[3]}], secret [${args[4]}]`, t3 => {
        t3.throws(fn, 'throws an exception');
        t3.equals(whs, undefined, 'constructor does not return a value');
        t3.done();
      });
    });

    t2.test(`with port [${port}], host [${host}], key [${apiKey}], token [${apiToken}], secret [${apiSecret}]`, t3 => {
      const fn = wrapper(port, host, apiKey, apiToken, apiSecret);
      t3.doesNotThrow(fn, 'does not throw an exception');
      t3.equals(typeof whs, 'object', 'constructor returns an object');
      t3.done();
    });

    t2.done();
  });

  t1.test('cleanup', t2 => {
    const whs = new WebhookServer(port, host, apiKey, apiToken, apiSecret);
    let del;

    t2.beforeEach(done => {
      del = sandbox.stub(trello.prototype, 'del');
      done();
    });

    t2.afterEach(done => {
      sandbox.restore();
      done();
    });

    t2.test('without a webhook ID', t3 => {
      whs._webhookID = null;
      whs.cleanup()
        .then(() => {
          t3.pass('resolves');
          t3.equal(del.callCount, 0, 'does not call Trello');
          t3.done();
        }).catch(() => {
          t3.fail('resolves');
          t3.done();
        });
    });

    t2.test('with a webhook ID', t3 => {
      const webhookID = 'webhook-id';
      whs._webhookID = webhookID;
      sandbox.restore();

      t3.test('with a Trello error', t4 => {
        del.yields(new Error('error'));
        whs.cleanup()
          .then(() => {
            t4.pass('resolves');
            t4.equal(del.callCount, 1, 'calls Trello');
            t4.equal(del.args[0][0], `/1/webhooks/${webhookID}`, 'deletes the webhook from Trello');
            t4.done();
          }).catch(() => {
            t4.fail('resolves');
            t4.done();
          });
      });

      t3.test('without a Trello error', t4 => {
        del.yields(null);
        whs.cleanup()
          .then(() => {
            t4.pass('resolves');
            t4.equal(del.callCount, 1, 'calls Trello');
            t4.equal(del.args[0][0], `/1/webhooks/${webhookID}`, 'deletes the webhook from Trello');
            t4.done();
          }).catch(() => {
            t4.fail('resolves');
            t4.done();
          });
      });

      t3.done();
    });

    t2.done();
  });

  t1.test('on', t2 => {
    const whs = new WebhookServer(port, host, apiKey, apiToken, apiSecret);
    const onValues = require('./webhook-server-on-values.json');
    const wrapper = function(eventName, handler) {
      return () => {
        whs.on(eventName, handler);
      };
    };

    util.forEachFail(onValues, args => {
      if(args[1] === null) {
        args[1] = () => { };
      }
      t2.test(`with event [${args[0]}], handler [${args[1]}]`, t3 => {
        t3.doesNotThrow(wrapper.call(wrapper, args)), 'does not throw an exception';
        t3.done();
      });
    });

    t2.done();
  });

  t1.test('http handler', t2 => {
    const whs = new WebhookServer(port, host, apiKey, apiToken, apiSecret);
    whs._idModel = 'id-model';
    whs._handlers[whs._idModel] = { data: [ ] };
    whs.on('data', () => { });

    t2.test('handles HEAD request', t3 => {
      const response = { end: sinon.spy() };
      whs.httpHandler({ method: 'HEAD' }, response);
      t3.equal(response.statusCode, 200, 'sends a 200 status code');
      t3.equal(response.end.callCount, 1, 'calls response.end()');
      t3.done();
    });

    for(const verb of [ 'PUT', 'POST' ]) {
      t2.test(`handles ${verb} requests`, t3 => {
        const request = { method: verb, headers: { }, on: sinon.spy() };
        const response = { end: sinon.spy() };

        t3.beforeEach(done => {
          request.on.reset();
          response.end.reset();
          verifyMock.reset();
          done();
        });

        t3.test('with invalid Trello webhook data', t4 => {
          whs.httpHandler(request, response);

          let dataSub = false, endSub = false;
          for(const arg of request.on.args) {
            if(arg[0] === 'data') {
              dataSub = arg[1];
            }
            if(arg[0] === 'end') {
              endSub = arg[1];
            }
          }

          t4.equal(request.on.callCount, 2, 'subscribes to two request events');
          t4.equal(typeof dataSub, 'function', 'subscribes to request data event');
          t4.equal(typeof endSub, 'function', 'subscribes to end data event');

          verifyMock.returns(false);
          endSub();
          t4.equal(response.statusCode, 400, 'sends a 400 status code');
          t4.equal(response.end.callCount, 1, 'calls response.end()');

          t4.done();
        });

        t3.test('with valid Trello webhook data', t4 => {
          whs.httpHandler(request, response);

          let dataSub = false, endSub = false;
          for(const arg of request.on.args) {
            if(arg[0] === 'data') {
              dataSub = arg[1];
            }
            if(arg[0] === 'end') {
              endSub = arg[1];
            }
          }

          t4.equal(request.on.callCount, 2, 'subscribes to two request events');
          t4.equal(typeof dataSub, 'function', 'subscribes to request data event');
          t4.equal(typeof endSub, 'function', 'subscribes to end data event');

          verifyMock.returns(true);
          dataSub(JSON.stringify({ hello: 'world' }));
          endSub();
          t4.equal(response.statusCode, 200, 'sends a 200 status code');
          t4.equal(response.end.callCount, 1, 'calls response.end()');

          t4.done();
        });

        t3.done();
      });
    }

    for(const verb of [ 'GET', 'DELETE', 'PATCH', 'CONNECT', 'OPTIONS', 'TRACE', 'DELETE']) {
      t2.test(`rejects ${verb} requests`, t3 => {
        const response = { end: sinon.spy() };
        whs.httpHandler({ method: verb }, response);
        t3.equal(response.statusCode, 400, 'sends a 400 status code');
        t3.equal(response.end.callCount, 1, 'calls response.end()');
        t3.done();
      });
    }

    t2.done();
  });

  t1.done();
});
