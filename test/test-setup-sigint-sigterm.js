'use strict';

const tap = require('tap');
const sinon = require('sinon');
require('sinon-as-promised');
const sig = require('../bin/setup-sigint-sigterm');

const __on = process.on;
const __removeListener = process.removeListener;
const __kill = process.kill;

const sandbox = sinon.sandbox.create();
const on = sandbox.spy();
const removeListener = sandbox.spy();
const kill = sandbox.spy();

const registrar = {
  unregister: sandbox.stub().resolves()
};

tap.beforeEach(done => {
  sandbox.reset();
  Object.defineProperty(process, 'kill', { value: kill, configurable: true });
  Object.defineProperty(process, 'removeListener', { value: removeListener, configurable: true });
  Object.defineProperty(process, 'on', { value: on, configurable: true });
  done();
});

tap.afterEach(done => {
  Object.defineProperty(process, 'kill', { value: __kill, configurable: true });
  Object.defineProperty(process, 'removeListener', { value: __removeListener, configurable: true });
  Object.defineProperty(process, 'on', { value: __on, configurable: true });
  done();
});

tap.test('SIGINT and SIGTERM handler', t1 => {

  sig(registrar);

  let sigintHandler;
  let sigtermHandler;

  t1.equal(on.callCount, 2, 'process.on called twice');
  for(const args of on.args) {
    if(args[0] === 'SIGINT') {
      sigintHandler = args[1];
    }
    if(args[0] === 'SIGTERM') {
      sigtermHandler = args[1];
    }
  }

  t1.equal(typeof sigintHandler, 'function', 'registers a SIGINT handler');
  t1.equal(typeof sigtermHandler, 'function', 'registers a SIGTERM handler');

  const checkHandler = function(signal, fn, resolve) {
    t1.test(`handles ${signal}`, t2 => {
      if(resolve) {
        registrar.unregister = sandbox.stub().resolves();
      } else {
        registrar.unregister = sandbox.stub().rejects();
      }
      fn();
      t2.equal(registrar.unregister.callCount, 1, 'calls webhook unregister');
      setTimeout(() => {
        t2.equal(removeListener.callCount, 1, 'process remove listener called once');
        t2.equal(removeListener.args[0][0], signal, `${signal} handler removed`);
        t2.equal(kill.callCount, 1, 'process kill called once');
        t2.done();
      }, 50);
    });
  };

  checkHandler('SIGINT', sigintHandler, true);
  checkHandler('SIGINT', sigintHandler, false);
  checkHandler('SIGTERM', sigtermHandler, true);
  checkHandler('SIGTERM', sigtermHandler, false);

  t1.done();
});
