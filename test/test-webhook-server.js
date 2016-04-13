'use strict';

const tap = require('tap');
const sinon = require('sinon');
const trello = require('node-trello');
const util = require('./util');
const WebhookServer = require('../bin/webhook-server');

const values = require('./webhook-server-fail.json');
const port = values.port[values.port.length - 1];
const host = values.host[values.host.length - 1];
const apiKey = values.key[values.key.length - 1];
const apiToken = values.token[values.token.length - 1];
const apiSecret = values.secret[values.secret.length - 1];

tap.test('Webhook server class', t1 => {
  const sandbox = sinon.sandbox.create();
  let whs;

  t1.test('constructor', t2 => {
    function wrapper(port, host, key, token, secret) {
      return function() {
        whs = new WebhookServer(port, host, key, token, secret);
      };
    }

    /* * /
    util.forEachFail(values, args => {
      const fn = wrapper.apply(wrapper, args);
      t2.test(`with port [${args[0]}], host [${args[1]}], key [${args[2]}], token [${args[3]}], secret [${args[4]}]`, t3 => {
        t3.throws(fn, 'throws an exception');
        t3.equals(whs, undefined, 'constructor does not return a value');
        t3.done();
      });
    });
    //*/

    t2.test(`with port [${port}], host [${host}], key [${apiKey}], token [${apiToken}], secret [${apiSecret}]`, t3 => {
      const fn = wrapper(port, host, apiKey, apiToken, apiSecret);
      t3.doesNotThrow(fn, 'does not throw an exception');
      t3.equals(typeof whs, 'object', 'constructor returns an object');
      t3.done();
    });

    t2.done();
  });

  t1.test('cleanup', t2 => {
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

  /*
  t1.test('start', t2 => {
    const port = 9000;
    let wh;
    let createServerMock;
    let listenMock;
    let getHostnameMock;
    let trelloPostMock;

    let test = 0;
    let hostname = null;
    let trelloError = null;

    t2.beforeEach(done => {
      getHostnameMock = sandbox.stub(util, 'getHostname');
      if (hostname) {
        getHostnameMock.resolves(hostname);
      } else {
        getHostnameMock.rejects('No hostname');
      }
      listenMock = sandbox.stub().yields();
      createServerMock = sandbox.stub(http, 'createServer').returns({
        listen: listenMock
      });
      trelloPostMock = sandbox.stub(trello.prototype, 'post').yields(trelloError, { id: 'webhook-id' });
      process.env.TRELLO_API_KEY = 'key';
      wh = new WebhookServer(port);
      done();
    });

    t2.afterEach(done => {
      common.resetEnvVars();
      sandbox.restore();
      test++;
      switch (test) {
        case 1:
          hostname = null;
          trelloError = new Error('Test Error');
          break;
        case 2:
          hostname = 'hostname';
          trelloError = null;
          break;
        case 3:
          hostname = 'hostname';
          trelloError = new Error('Test Error');
          break;
        default:
          hostname = null;
          trelloError = null;
          break;
      }
      done();
    });

    t2.test('with invalid hostname and no Trello errors', t3 => {
      const whStart = wh.start();
      t3.equal(createServerMock.callCount, 1, 'calls http.createServer once');
      t3.equal(getHostnameMock.callCount, 1, 'calls getHostname once');
      getHostnameMock().then(() => {
        t3.fail('getHostname rejects');
        t3.done();
      }).catch(() => {
        t3.pass('getHostname rejects');
        whStart.then(() => {
          t3.fail('webhook server start rejects');
          t3.done();
        }).catch(() => {
          t3.pass('webhook server start rejects');
          t3.done();
        });
      });
    });

    t2.test('with invalid hostname and Trello errors', t3 => {
      const whStart = wh.start();
      t3.equal(createServerMock.callCount, 1, 'calls http.createServer once');
      t3.equal(getHostnameMock.callCount, 1, 'calls getHostname once');
      getHostnameMock().then(() => {
        t3.fail('getHostname rejects');
        t3.done();
      }).catch(() => {
        t3.pass('getHostname rejects');
        whStart.then(() => {
          t3.fail('webhook server start rejects');
          t3.done();
        }).catch(() => {
          t3.pass('webhook server start rejects');
          t3.done();
        });
      });
    });

    t2.test('with valid hostname and no Trello errors', t3 => {
      const whStart = wh.start();
      t3.equal(createServerMock.callCount, 1, 'calls http.createServer once');
      t3.equal(typeof createServerMock.args[0][0], 'function', 'registers a callback function');
      t3.equal(getHostnameMock.callCount, 1, 'calls getHostname once');
      t3.equal(listenMock.callCount, 1, 'calls server.listen once');
      t3.equal(listenMock.args[0][0], port, 'listens on the specified port');

      getHostnameMock().then(() => {
        t3.pass('getHostname resolves');

        whStart.then(() => {
          t3.pass('webhook server start resolves');
          t3.equal(trelloPostMock.callCount, 1, 'calls trello.post once');
          t3.equal(trelloPostMock.args[0][0], '/1/webhooks', 'posts to /1/webhooks');
          t3.equal(trelloPostMock.args[0][1].callbackURL, hostname, 'registers its hostname as the callback');
          t3.equal(trelloPostMock.args[0][2].idModel, process.env.ATC_TRELLO_BOARD_ID, 'registers for events from the ATC Trello board');
          t3.done();
        }).catch(() => {
          t3.fail('webhook server start resolves');
          t3.done();
        });
      }).catch(() => {
        t3.fail('getHostname resolves');
      });
    });

    t2.test('with valid hostname and Trello errors', t3 => {
      const whStart = wh.start();
      t3.equal(createServerMock.callCount, 1, 'calls http.createServer once');
      t3.equal(typeof createServerMock.args[0][0], 'function', 'registers a callback function');
      t3.equal(getHostnameMock.callCount, 1, 'calls getHostname once');
      t3.equal(listenMock.callCount, 1, 'calls server.listen once');
      t3.equal(listenMock.args[0][0], port, 'listens on the specified port');

      getHostnameMock().then(() => {
        t3.pass('getHostname resolves');

        whStart.then(() => {
          t3.fail('webhook server start rejects');
          t3.done();
        }).catch(() => {
          t3.pass('webhook server start rejects');
          t3.equal(trelloPostMock.callCount, 1, 'calls trello.post once');
          t3.equal(trelloPostMock.args[0][0], '/1/webhooks', 'posts to /1/webhooks');
          t3.equal(trelloPostMock.args[0][1].callbackURL, hostname, 'registers its hostname as the callback');
          t3.equal(trelloPostMock.args[0][2].idModel, process.env.ATC_TRELLO_BOARD_ID, 'registers for events from the ATC Trello board');
          t3.done();
        });
      }).catch(() => {
        t3.fail('getHostname resolves');
        t3.done();
      });
    });

    t2.done();
  });

  t1.test('on', t2 => {
    process.env.TRELLO_API_KEY = 'key';
    const wh = new WebhookServer(9000);

    wh.on('data', () => { });
    t2.pass('no exception');

    common.resetEnvVars();
    t2.done();
  });

  t1.test('cleanup', t2 => {
    process.env.TRELLO_API_KEY = 'key';
    const wh = new WebhookServer(9000);

    t2.test('with no webhook', t3 => {
      wh.cleanup().then(() => {
        t3.pass('cleanup resolves');
        t3.done();
      }).catch(() => {
        t3.fail('cleanup resolves');
        t3.done();
      });
    });

    t2.test('with a webhook and a Trello error', t3 => {
      wh._webhookID = 'webhook-id';
      const trelloDelMock = sandbox.stub(trello.prototype, 'del').yields(new Error('Test Error'), null);

      wh.cleanup().then(() => {
        t3.pass('cleanup resolves');
        t3.equal(trelloDelMock.callCount, 1, 'calls Trello delete once');
        t3.done();
      }).catch(() => {
        t3.fail('cleanup resolves');
        t3.done();
      });
    });

    t2.test('with a webhook and no Trello error', t3 => {
      wh._webhookID = 'webhook-id';
      const trelloDelMock = sandbox.stub(trello.prototype, 'del').yields(null, '');

      wh.cleanup().then(() => {
        t3.pass('cleanup resolves');
        t3.equal(trelloDelMock.callCount, 1, 'calls Trello delete once');
        t3.done();
      }).catch(() => {
        t3.fail('cleanup resolves');
        t3.done();
      });
    });

    common.resetEnvVars();
    t2.done();
  });

  /**
  t1.test('http server', t2 => {
    process.env.TRELLO_API_KEY = 'key';

    const hostname = 'test-host';
    sandbox.stub(util, 'getHostname').resolves(hostname);

    const trelloClientSecret = 'client-secret-key';
    const trelloData = '{ "some": "data", "value": 3 }';
    const trelloSignature = crypto.createHmac('sha1', trelloClientSecret).update(trelloData + hostname).digest('base64');

    const reqOnMock = sandbox.stub();
    const createServerMock = sandbox.stub(http, 'createServer').returns({
      listen: sandbox.spy()
    });

    const wh = new WebhookServer(9000);
    wh.start();
    wh._hostname = hostname;
    const handler = createServerMock.args[0][0];
    let dataEventHandler;
    let endEventHandler;

    const res = {
      statusCode: 0,
      end: sandbox.spy()
    };

    t2.afterEach(done => {
      res.end.reset();
      reqOnMock.reset();
      done();
    });

    t2.test('handles HEAD request', t3 => {
      handler({ method: 'HEAD', on: () => { } }, res);
      t3.equal(res.statusCode, 200, 'status code is 200');
      t3.equal(res.end.callCount, 1, 'res.end() called once');
      t3.done();
    });

    for (const method of ['PUT', 'POST']) {
      t2.test(`hadles ${method} request`, t3 => {
        handler({ method, on: reqOnMock }, res);
        t3.equal(reqOnMock.callCount, 2, 'req.on is called twice');
        t3.equal(reqOnMock.args[0][0], 'data', 'subscribed to data event');
        t3.equal(typeof reqOnMock.args[0][1], 'function', 'subscribed to data event with function');
        t3.equal(reqOnMock.args[1][0], 'end', 'subscribed to end event');
        t3.equal(typeof reqOnMock.args[1][1], 'function', 'subscribed to end event with function');

        t3.done();
      });
    }

    t2.done();

    common.resetEnvVars();
  });
  //*/

  t1.done();
});
