'use strict';

const tap = require('tap');
const sinon = require('sinon');
const request = require('request');
const registrar = require('../bin/register-webhook');
const sandbox = sinon.sandbox.create();

const apiKey = 'api-key';
const apiToken = 'api-token';
const callbackURL = 'https://calback.url';
const modelID = 'model-id';
const webhookID = 'webhook-id';

const post = sandbox.stub(request, 'post');
const del = sandbox.stub(request, 'del');

tap.beforeEach(done => {
  sandbox.reset();
  done();
});

tap.test('webhook registrar', t1 => {
  t1.test('constructor', t2 => {
    const reg = new registrar(apiKey, apiToken);
    t2.equals(typeof reg, 'object', 'returns an object');
    t2.equals(reg.apiKey, apiKey, 'sets the API key');
    t2.equals(reg.apiToken, apiToken, 'sets the API token');
    t2.done();
  });

  let reg;
  t1.beforeEach(done => {
    reg = new registrar(apiKey, apiToken);
    done();
  });

  t1.test('register', t2 => {
    t2.test('without an webhook registered', t3 => {
      t3.test('with a request error', t4 => {
        const err = new Error('Test Error');
        post.yields(err, null, null);
        reg.register(callbackURL, modelID)
          .then(() => {
            t4.fail('rejects');
          })
          .catch(e => {
            t4.pass('rejects');
            t4.equals(post.callCount, 1, 'posts to Trello');
            t4.equals(e, err, 'passes error');
          })
          .then(t4.done);
      });

      t3.test('with a returned error string', t4 => {
        const errString = 'Error string';
        post.yields(null, null, errString);
        reg.register(callbackURL, modelID)
          .then(() => {
            t4.fail('rejects');
          })
          .catch(e => {
            t4.pass('rejects');
            t4.equals(post.callCount, 1, 'posts to Trello');
            t4.equals(e, errString, 'passes error');
          })
          .then(t4.done);
      });

      t3.test('with a returned webhook object', t4 => {
        const obj = { id: webhookID };
        post.yields(null, null, obj);
        reg.register(callbackURL, modelID)
          .then(id => {
            t4.pass('resolves');
            t4.equals(post.callCount, 1, 'posts to Trello');
            t4.equals(id, webhookID, 'sends the webhook ID');
            t4.equals(reg.webhookID, webhookID, 'stores the webhook ID on itself');
          })
          .catch(() => {
            t4.fail('resolves');
          })
          .then(t4.done);
      });

      t3.done();
    });

    t2.test('with a webhook already registered', t3 => {
      reg.webhookID = webhookID;
      reg.register(callbackURL, modelID)
        .then(id => {
          t3.pass('resolves');
          t3.equals(post.callCount, 0, 'does not post to Trello');
          t3.equals(id, webhookID, 'sends the webhook ID');
        })
        .catch(() => {
          t3.fail('resolves');
        })
        .then(t3.done);
    });

    t2.done();
  });

  t1.test('unregister', t2 => {
    t2.test('without a webhook registered', t3 => {
      reg.unregister()
        .then(() => {
          t3.pass('resolves');
          t3.equals(del.callCount, 0, 'does not delete from Trello');
        })
        .catch(() => {
          t3.fail('resolves');
        })
        .then(t3.done);
    });

    t2.test('with a webhook registered', t3 => {
      t3.test('with a request error', t4 => {
        const err = new Error('Test Error');
        reg.webhookID = webhookID;
        del.yields(err, null, null);
        reg.unregister()
          .then(() => {
            t4.fail('rejects');
          })
          .catch(e => {
            t4.pass('rejects');
            t4.equals(del.callCount, 1, 'deletes from Trello');
            t4.equals(e, err, 'passes error');
          })
          .then(t4.done);
      });

      t3.test('with a returned error string', t4 => {
        const errString = 'Test Error';
        reg.webhookID = webhookID;
        del.yields(null, null, errString);
        reg.unregister()
          .then(() => {
            t4.fail('rejects');
          })
          .catch(e => {
            t4.pass('rejects');
            t4.equals(del.callCount, 1, 'deletes from Trello');
            t4.equals(e, errString, 'passes error');
          })
          .then(t4.done);
      });

      t3.test('with everything okay', t4 => {
        reg.webhookID = webhookID;
        del.yields(null, null, { all: 'good' });
        reg.unregister()
          .then(() => {
            t4.pass('resolves');
            t4.equals(del.callCount, 1, 'deletes from Trello');
          })
          .catch(e => {
            t4.fail('resolves');
          })
          .then(t4.done);
      });

      t3.done();
    });

    t2.done();
  });

  t1.done();
});
