const log = require('./error-log');

function getHandler(signal, registrar) {
  const fn = () => {
    const callback = () => {
      process.removeListener(signal, fn);
      process.kill(process.pid, signal);
    };

    registrar.unregister().then(callback).catch(() => {
      log('Failed to unregister webhook');
      callback();
    });
  };

  return process.on(signal, fn);
}

module.exports = function setupProcessEndHandlers(registrar) {
  getHandler('SIGINT', registrar);
  getHandler('SIGTERM', registrar);
};
