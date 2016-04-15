const log = require('./error-log');

module.exports = function setupProcessEndHandlers(registrar) {
  const _SIGINT = () => {
    const callback = () => {
      process.removeListener('SIGINT', _SIGINT);
      process.kill(process.pid, 'SIGINT');
    };

    registrar.unregister().then(callback).catch(() => {
      log('Failed to unregister webhook');
      callback();
    });
  };

  const _SIGTERM = () => {
    const callback = () => {
      process.removeListener('SIGTERM', _SIGTERM);
      process.kill(process.pid, 'SIGTERM');
    };

    registrar.unregister().then(callback).catch(() => {
      log('Failed to unregister webhook');
      callback();
    });
  };

  process.on('SIGINT', _SIGINT);
  process.on('SIGTERM', _SIGTERM);
};
