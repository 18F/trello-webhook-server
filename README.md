# atc-trello

[![Build Status](https://travis-ci.org/18F/atc-trello.svg?branch=develop)](https://travis-ci.org/18F/atc-trello)
[![codecov.io](https://codecov.io/github/18F/atc-trello/coverage.svg?branch=develop)](https://codecov.io/github/18F/atc-trello?branch=develop)
[![Code Climate](https://codeclimate.com/github/18F/atc-trello/badges/gpa.svg)](https://codeclimate.com/github/18F/atc-trello)
[![Dependencies](https://david-dm.org/18F/atc-trello.svg)](https://david-dm.org/18F/atc-trello)

Listens for changes on the Air Traffic Control (ATC) Trello board and uses those events to sync to the BPA Trello board.  Creates an HTTP server and then registers itself as a webhook with Trello on the ATC board.  (Note: For local development, the server can also create a localtunnel to itself and use that to register with Trello.)

Cards that are moved into the "In Flight" status are examined.  If a card's description includes one or more BPA orders (of the form: `BPA: <order name>`), a card will be created in the BPA Trello for each BPA order, with a link back to the ATC card.  The ATC card will then be updated to include links to all applicable BPA orders.

## Planned

The server will also listen to the BPA Trello board and will update the labels on ATC cards as BPA order moves through the system.

## Running

Clone this repo, then run `npm install`.  Once all the dependencies are down, you can start the server with `npm start`

### Environment

The following environment variables are used:

name                 | description
-------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------
TRELLO_API_KEY       | Obtained from [Trello](https://trello.com/app-key). Located near the top of that page.
TRELLO_CLIENT_SECRET | Obtained from [Trello](https://trello.com/app-key). There's a link to generate the key at the end of the first paragraph headed "Token."
TRELLO_API_TOK       | Obtained from [Trello](https://trello.com/app-key). Located near the bottom of that page.
ATC_TRELLO_BOARD_ID  | The board ID of the Air Traffic Control board.
BPA_TRELLO_BOARD_ID  | The board ID of the BPA board.
LOCALTUNNEL          | Optional.  If `true`, creates a localtunnel.me for the local server. This is a development feature and should be `false` or unset in production.
PORT                 | Optional.  If not set, defaults to 5000.
HOST                 | Optional.  If set, this is the hostname used to register the webhook with Trello. This should be unset in development and set in production.
LOG_LEVEL            | Optional.  If set, determines the logging level.  10 is verbose, 20 is info, 30 is warning, and 40 is error. If unset, defaults to verbose.      |

### Public domain

This project is in the worldwide [public domain](LICENSE.md). As stated in [CONTRIBUTING](CONTRIBUTING.md):

> This project is in the public domain within the United States, and copyright and related rights in the work worldwide are waived through the [CC0 1.0 Universal public domain dedication](https://creativecommons.org/publicdomain/zero/1.0/).

> All contributions to this project will be released under the CC0 dedication. By submitting a pull request, you are agreeing to comply with this waiver of copyright interest.
