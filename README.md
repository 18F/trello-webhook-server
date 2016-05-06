# trello-webhook-server

[![Build Status](https://travis-ci.org/18F/trello-webhook-server.svg?branch=develop)](https://travis-ci.org/18F/trello-webhook-server) [![codecov.io](https://codecov.io/github/18F/trello-webhook-server/coverage.svg?branch=develop)](https://codecov.io/github/18F/trello-webhook-server?branch=develop) [![Code Climate](https://codeclimate.com/github/18F/trello-webhook-server/badges/gpa.svg)](https://codeclimate.com/github/18F/trello-webhook-server) [![Dependencies](https://david-dm.org/18F/trello-webhook-server.svg)](https://david-dm.org/18F/trello-webhook-server)

Creates a Trello webhook server that masks most of the (admittedly modest) complexity, so you can just do you what you want to do.  For more details about Trello webhooks, see the [Trello webhook API documentation](https://developers.trello.com/apis/webhooks).

In addition to offering a standalone mode, where the module creates its own HTTP server, can also attach to an existing http.server or Express/restify-style server.

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
var server = new TrelloWebhookServer(config);
```

The config parameter has the following properties:

Argument     | Description
------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
port         | The port that the webhook server will listen on.  **REQUIRED** if the server property is not set.  Must be numeric (or can be made numeric) and be a valid valid.
server       | An `http.Server` or Express/restify server to attach to.  Must be an `http.Server` or Express/restify server object.
hostURL      | **REQUIRED** The URL that will eventually reach the webhook server.  This should be a full HTTP URL that is reachable by Trello.  E.g., https://asdf.localtunnel.me.  If attaching to an existing `http.Server` or Express/restify server, the webhook server will _only_ listen to its assigned path - that is, if you specify `https://asdf.localtunnel.me/trello-webhook`, this module will only listen to events at that path.
apiKey       | **REQUIRED**  Obtained from [Trello](https://trello.com/app-key). Located near the top of that page.
apiToken     | **REQUIRED** Obtained from [Trello](https://trello.com/app-key). There's a link to generate the key at the end of the first paragraph headed "Token."
clientSecret | **REQUIRED** Obtained from [Trello](https://trello.com/app-key). OAuth client secret, located near the bottom of that page under the *OAuth* header. This is used to verify that webhook requests are actually from Trello (see the "Webhook Signatures" section on the [Trello webhook API documentation](https://developers.trello.com/apis/webhooks)).

Any invalid config parameters will throw an exception.

### Getting it started

The webhook listener doesn't register itself with Trello until you pick a model to listen to.  To do that, call the `start` method with the ID of the thing you want notifications for.  If you already have an http.Server object and passed that into the constructor, make sure it is listening before you call `start`.

```
server.start('trello-model-id');
```

This will return a promise that eventually resolves with the Trello webhook ID if everything goes well (i.e., the HTTP server starts and Trello accepts the webhook registration).  If there are any problems, the promise will reject.

> **NOTE:** It would be a good idea to print the webook ID somewhere you can see it.  If something goes haywire, you may need to manually delete it.  This can be accomplished with a `DELETE` request to <https://api.trello.com/1/webhooks/your-webhook-id/>.

There's some hand-wavy magic happening inside the `start` method: it hooks itself to the process `SIGINT` and `SIGTERM` events.  When it receives either of those, it unregisters itself from Trello and then resends the event.  You can manually initiate this process by calling `server.cleanup()`, but that's not recommended at this time because `cleanup()` doesn't yet do any cleanup besides unregistering the webook - the HTTP server is still running, etc.

### Getting events

Register an event handler to get webhook events.  Currently there's only one giant `data` event:

```
server.on('data', function(event) {
  ...do stuff...
})
```

See the "Trigger Webhooks" section of the [Trello webhook API documentation](https://developers.trello.com/apis/webhooks) for more information about what these event objects look like.

### Demos

Check the `/demo` directory of this repository for samples of how to get going.  Note that in order to run the demos, you will need to manually install [dotenv](https://www.npmjs.com/package/dotenv) and [restify](https://www.npmjs.com/package/restify) as they are not dependencies of this project.  Using `dotenv` allows you to put your environment variables in a `.env` file and have them loaded into your `process.environment` at runtime.

## Public domain

This project is in the worldwide [public domain](LICENSE.md). As stated in [CONTRIBUTING](CONTRIBUTING.md):

> This project is in the public domain within the United States, and copyright and related rights in the work worldwide are waived through the [CC0 1.0 Universal public domain dedication](https://creativecommons.org/publicdomain/zero/1.0/).

> All contributions to this project will be released under the CC0 dedication. By submitting a pull request, you are agreeing to comply with this waiver of copyright interest.
