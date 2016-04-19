'use strict';

const tap = require('tap');
const sinon = require('sinon');
const mockRequire = require('mock-require');
const sandbox = sinon.sandbox.create();

const trelloVerify = sandbox.stub();
mockRequire('../bin/webhook-verify', trelloVerify);

const httpHandler = require('../bin/http-handler');

const modelID = 'model-id';

const tws = {
  config: {
    callbackURL: 'https://callback.url',
    clientSecret: 'client-secret',
    modelID
  }
};

const dataHandler = sandbox.spy();
const handlers = {
  [modelID]: {
    data: [ dataHandler ]
  }
};

const response = {
  statusCode: false,
  end: sandbox.spy()
};

tap.beforeEach(done => {
  sandbox.reset();
  response.statusCode = false;
  done();
})

tap.test('HTTP handler', t1 => {
  const fn = httpHandler(tws, handlers);
  t1.equal(typeof fn, 'function', 'returns a function');
  t1.test('gracefully handles verbs other than HEAD, PUT, and POST', t2 => {
    t2.test('with no external server object attached', t3 => {
      // If there's no external server object attached, that means
      // it's in standalone/own-server mode, and it should respond
      // to every request, even ones it doesn't understand.
      tws.config.server = false;
      fn({ method: 'GET' }, response);
      t3.equal(response.statusCode, 400, 'sets the status code to 400');
      t3.equal(response.end.callCount, 1, 'ends the response');
      t3.done();
    });

    t2.test('with an external server object attached', t3 => {
      // This makes sure the HTTP handler doesn't close a response
      // that it shouldn't be handling in the first place.  If there
      // is an external server object attached, unknown requests
      // should just be ignored.
      tws.config.server = true;
      fn({ method: 'GET' }, response);
      t3.equal(response.statusCode, false, 'does not set the status code');
      t3.equal(response.end.callCount, 0, 'does not end the response');
      t3.done();
    });

    t2.done();
  });

  t1.test('handles HEAD request', t2 => {
    fn({ method: 'HEAD' }, response);
    t2.equal(response.statusCode, 200, 'sets the status code to 200');
    t2.equal(response.end.callCount, 1, 'ends the response');
    t2.done();
  });

  function getHandlers(on) {
    const handlers = { dataHandler: false, endHandler: false };
    for(const call of on.args) {
      if(call[0] === 'data') {
        handlers.dataHandler = call[1];
      } else if(call[0] === 'end') {
        handlers.endHandler = call[1];
      }
    }
    return handlers;
  }

  for(const verb of [ 'POST', 'PUT' ]) {
    const req = {
      method: verb,
      on: sandbox.spy(),
      headers: { }
    };

    t1.test(`handles ${verb} request`, t2 => {
      fn(req, response);
      t2.equal(req.on.callCount, 2, 'registers two event handlers');

      let dataHandler = false;
      let endHandler = false;

      const reqHandlers = getHandlers(req.on);

      t2.equal(typeof reqHandlers.dataHandler, 'function', 'data event handler is a function');
      t2.equal(typeof reqHandlers.endHandler, 'function', 'end event handler is a function');

      t2.test('with invalid JSON data', t3 => {
        reqHandlers.dataHandler('some junk');
        t3.test('with Trello webhook verification fail', t4 => {
          trelloVerify.returns(false);
          reqHandlers.endHandler();

          t4.equal(response.statusCode, 400, 'sets the status code to 400');
          t4.equal(response.end.callCount, 1, 'ends the response');

          t4.done();
        });

        t3.test('with Trello webhook verification pass', t4 => {
          trelloVerify.returns(true);
          reqHandlers.endHandler();

          t4.equal(response.statusCode, 400, 'sets the status code to 400');
          t4.equal(response.end.callCount, 1, 'ends the response');

          t4.done();
        });

        t3.done();
      });

      t2.test('with valid JSON data', t3 => {
        fn(req, response);
        const reqHandlers = getHandlers(req.on);
        reqHandlers.dataHandler('{"key": "value"}');

        t3.test('with Trello webhook verification fail', t4 => {
          trelloVerify.returns(false);
          reqHandlers.endHandler();

          t4.equal(response.statusCode, 400, 'sets the status code to 400');
          t4.equal(response.end.callCount, 1, 'ends the response');

          t4.done();
        });

        t3.test('with Trello webhook verification pass', t4 => {
          trelloVerify.returns(true);
          reqHandlers.endHandler();

          t4.equal(handlers[modelID].data[0].callCount, 1, 'defined data handler is called');
          t4.equal(typeof handlers[modelID].data[0].args[0][0], 'object', 'passes an object to the handler');
          t4.equal(response.statusCode, 200, 'sets the status code to 200');
          t4.equal(response.end.callCount, 1, 'ends the response');

          t4.done();
        });

        t3.done();
      });

      t2.done();
    });
  }

  t1.done();
});
