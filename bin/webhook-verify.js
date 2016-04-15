'use strict';

var crypto = require('crypto');
var log = require('./error-log');

function verifyTrelloWebhookRequest(callbackURL, clientSecret, body, signature) {
  // Double-HMAC to blind any timing channel attacks
  // https://www.isecpartners.com/blog/2011/february/double-hmac-verification.asp
  try {
    var base64Digest = function base64Digest(s) {
      return crypto.createHmac('sha1', clientSecret).update(s).digest('base64');
    };
    var content = body + callbackURL;
    var doubleHash = base64Digest(base64Digest(content));
    var headerHash = base64Digest(signature);
    return doubleHash === headerHash;
  } catch (e) {
    log('Verifying Trello webhook request, caught exception:');
    log(e);
    return false;
  }
}

module.exports = verifyTrelloWebhookRequest;