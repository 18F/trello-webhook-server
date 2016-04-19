'use strict';

// This file is just here to pull in every file that
// should be tested, to guarantee coverage is not
// over-reported.

const fs = require('fs');
const files = fs.readdirSync('./bin');
for (const file of files) {
  if (file.substr(-3, 3) === '.js') {
    require(`../bin/${file}`);
  }
}

require('tap').pass('Full coverage checked');
