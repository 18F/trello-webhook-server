'use strict';

function forEachFail(fails, cb) {
  const keys = Object.keys(fails);
  const indices = [];
  keys.forEach(() => indices.push(0));

  const isDone = function isDone() {
    let done = true;
    for (let i = 0; i < keys.length; i++) {
      done = done && (indices[i] === (fails[keys[i]].length - 1));
    }
    return done;
  };

  const increment = function increment() {
    let index = 0;
    while (true) { // eslint-disable-line no-constant-condition
      indices[index]++;
      if (indices[index] >= fails[keys[index]].length) {
        indices[index] = 0;
        index++;
        if (index >= indices.length) {
          return false;
        }
      } else {
        return true;
      }
    }
  };

  const getArgs = function getArgs() {
    const args = [];
    for (let i = 0; i < keys.length; i++) {
      args.push(fails[keys[i]][indices[i]]);
    }
    return args;
  };

  do {
    if (!isDone()) {
      cb(getArgs());
    }
  } while (increment());
}

module.exports = {
  forEachFail
};
