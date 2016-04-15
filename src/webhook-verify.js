'use strict';
const crypto = require('crypto');
const log = require('./error-log');

function verifyTrelloWebhookRequest(callbackURL, clientSecret, body, signature) {
  // Double-HMAC to blind any timing channel attacks
  // https://www.isecpartners.com/blog/2011/february/double-hmac-verification.asp
  try {
    const base64Digest = s => crypto.createHmac('sha1', clientSecret).update(s).digest('base64');
    const content = body + callbackURL;
    const doubleHash = base64Digest(base64Digest(content));
    const headerHash = base64Digest(signature);
    return doubleHash === headerHash;
  } catch (e) {
    log('Verifying Trello webhook request, caught exception:');
    log(e);
    return false;
  }
}

module.exports = verifyTrelloWebhookRequest;
