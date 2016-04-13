# trello-webhook-server

[![Build Status](https://travis-ci.org/18F/trello-webhook-server.svg?branch=develop)](https://travis-ci.org/18F/trello-webhook-server) [![codecov.io](https://codecov.io/github/18F/trello-webhook-server/coverage.svg?branch=develop)](https://codecov.io/github/18F/trello-webhook-server?branch=develop) [![Code Climate](https://codeclimate.com/github/18F/trello-webhook-server/badges/gpa.svg)](https://codeclimate.com/github/18F/trello-webhook-server) [![Dependencies](https://david-dm.org/18F/trello-webhook-server.svg)](https://david-dm.org/18F/trello-webhook-server)

Creates a Trello webhook server that masks most of the (admittedly modest) complexity, so you can just do you what you want to do.  For more details about Trello webhooks, see the [Trello webhook API documentation](https://developers.trello.com/apis/webhooks).

## Installing

From npm:

```
npm install --save @18f/trello-webhook-server
```

## Using

### Creating an instance

To create an instance of the webhook server:

```
var TrelloWebhookServer = require('@18f/trello-webhook-server');
var server = new TrelloWebhookServer(
  PORT,
  HOST,
  TRELLO_API_KEY,
  TRELLO_API_TOKEN,
  TRELLO_CLIENT_SECRET
);
```

These five arguments setup the server.

Argument             | Description
-------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
PORT                 | The port that the webhook server will listen on.
HOST                 | The URL that will eventually reach the webhook server.  This should be a full HTTP URL that is reachable by Trello.  E.g., https://fdsa.localtunnel.me
TRELLO_API_KEY       | Obtained from [Trello](https://trello.com/app-key). Located near the top of that page.
TRELLO_API_TOKEN     | Obtained from [Trello](https://trello.com/app-key). Located near the bottom of that page.
TRELLO_CLIENT_SECRET | Obtained from [Trello](https://trello.com/app-key). There's a link to generate the key at the end of the first paragraph headed "Token."  This is used to verify that webhook requests are actually from Trello (see the "Webhook Signatures" section on the [Trello webhook API documentation](https://developers.trello.com/apis/webhooks)).

### Getting it started

The webhook listener doesn't register itself with Trello until you pick a model to listen to.  To do that, call the `start` method with the ID of the thing you want notifications for.

```
server.start('trello-model-id');
```

This will return a promise that eventually resolves with the Trello webhook ID if everything goes well (i.e., the HTTP server starts and Trello accepts the webhook registration).  If there are any problems, the promise will reject.

> **NOTE:** It would be a good idea to print the webook ID somewhere you can see it.  If something goes haywire, you may need to manually delete it.  This can be accomplished with a `DELETE` request to <https://api.trello.com/1/webhooks/your-webhook-id/>.

There's some hand-wavy magic happening inside the `start` method: it hooks itself to the process `SIGINT` and `SIGTERM` events.  When it receives either of those, it unregisters itself from Trello and then resends the event.  You can manually initiate this process by calling `server.cleanup()`, but that's not recommended at this time because `cleanup()` doesn't yet do any cleanup besides unregistered the webook - the HTTP server is still running, etc.

### Getting events

Register an event handler to get webhook events.  Currently there's only one giant `data` event:

```
server.on('data', function(event) {
  ...do stuff...
})
```

See the "Trigger Webhooks" section of the [Trello webhook API documentation](https://developers.trello.com/apis/webhooks) for more information about what these event objects look like.

## Public domain

This project is in the worldwide [public domain](LICENSE.md). As stated in [CONTRIBUTING](CONTRIBUTING.md):

> This project is in the public domain within the United States, and copyright and related rights in the work worldwide are waived through the [CC0 1.0 Universal public domain dedication](https://creativecommons.org/publicdomain/zero/1.0/).

> All contributions to this project will be released under the CC0 dedication. By submitting a pull request, you are agreeing to comply with this waiver of copyright interest.
