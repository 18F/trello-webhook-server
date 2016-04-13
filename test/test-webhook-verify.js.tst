const tap = require('tap');
const crypto = require('crypto');
const util = require('./util');
const verify = require('../bin/webhook-verify');

const trelloCallbackURL = 'https://something';
const trelloClientSecret = 'client-secret-key';
const trelloData = '{ "some": "data", "value": 3 }';
const trelloSignature = crypto.createHmac('sha1', trelloClientSecret).update(`${trelloData}${trelloCallbackURL}`).digest('base64');

console.error = () => { };

const values = require('./webhook-verify-fail.json');
const callbackURL = values.callbackURL[values.callbackURL.length - 1];
const secret = values.clientSecret[values.clientSecret.length - 1];
const data = values.data[values.data.length - 1];
const signature = values.signature[values.signature.length - 1];

tap.test('webhook verification', t1 => {
  util.forEachFail(values, args => {
    t1.test(`with callback [${args[0]}], secret [${args[1]}], data [${args[2]}], signature [${args[3]}]`, t2 => {
      const verified = verify.apply(verify, args);
      t2.equal(verified, false, 'verify returns false');
      t2.done();
    });
  });

  t1.test(`with callback [${callbackURL}], secret [${secret}], data [${data}], signature [${signature}]`, t2 => {
    const verified = verify(callbackURL, secret, data, signature);
    t2.equal(verified, true, 'verify returns true');
    t2.done();
  });

  t1.done();
});
