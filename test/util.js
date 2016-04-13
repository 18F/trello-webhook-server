'use strict';

function getRealKeyValue(value) {
  if(value === 'null') {
    return null;
  }
  if(value === 'true') {
    return true;
  }
  if(value === 'false') {
    return false;
  }
  if(!Number.isNaN(Number(value))) {
    return Number(value);
  }
  return value;
}

function forEachFail(fails, cb) {
  const keys = Object.keys(fails);
  const indices = [ ];
  keys.forEach(() => indices.push(0));

  const done = function() {
    let done = true;
    for(let i = 0; i < keys.length; i++) {
      done = done && (indices[i] === (fails[keys[i]].length - 1));
    }
    return done;
  };

  const increment = function() {
    let index = 0;
    while(true) {
      indices[index]++;
      if(indices[index] >= fails[keys[index]].length) {
        indices[index] = 0;
        index++;
        if(index >= indices.length) {
          return false;
        }
      } else {
        return true;
      }
    }
  };

  const getArgs = function() {
    const args = [ ];
    for(let i = 0; i < keys.length; i++) {
      args.push(fails[keys[i]][indices[i]]);
    }
    return args;
  };

  do {
    if(!done()) {
      cb(getArgs());
    }
  } while(increment())
}

module.exports = {
  getRealKeyValue,
  forEachFail
};
