# http-service-router

[![Standard - JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![npm version](https://badge.fury.io/js/http-service-router.svg)](https://badge.fury.io/js/http-service-router)

This is a super tiny router to be used in a microservice-like environment. It parses a given URL and
returns a matching object. It also calculates the URL with the part for the match stripped. This is
very powerful when being combined with express's
[path-to-regexp](https://www.npmjs.org/package/path-to-regexp).

## Setup

    $ npm i http-service-router

## Contribute

Pull-requests are always welcome. For any problems or questions just open an issue.

## Usage

### Simple

The following example shows the simplest use case for the router. Keep reading for more advanced and
powerful use-cases:

```js
const createRouter = require('http-service-router')

const router = createRouter([
  [/^\/api/, myhandler]
])

const srv = http.createServer((req, res) => {
  const r = router.match(req.url)
  if (!r) {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    return res.end('Not found :(')
  }
  r.service(req, res)
})

function myhandler (req, res) {
  // ... Do your magic
}
```

### Advanced use-case

In the following example I'll show you how the router can be utilized to build up a powerful chain
of microservices that communicate using a proxy mechanism. This uses the
[http-proxy](https://www.npmjs.org/package/http-proxy) module and the expression building module
[path-to-regexp](https://www.npmjs.org/package/path-to-regexp).

```js
const http = require('http')
const createRouter = require('http-service-router')
const httpProxy = require('http-proxy')
const p = require('path-to-regexp')

const api = httpProxy.createProxyServer({ target: 'http://api' })
const app = httpProxy.createProxyServer({ target: 'http://app' })
const router = createRouter([
  [p('/api', { end: false }), api.web.bind(api)],
  [p('/', { end: false }), app.web.bind(app)]
])
const srv = http.createServer((req, res) => {
  const r = router.match(req.url)
  if (r) {
    // The router also returns a URL where the matching part is stripped. E.g. in the case of the
    // API this would transform '/api/v1/stuff' to '/v1/stuff' and '/api' (or '/api/') to '/'. So
    // the service only receives the URL part that it's interested in.
    req.url = r.url

    // Proxy the request to the matching microservice
    r.service(req, res)
  } else {
    // Send a 404
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    return res.end('Not found :(')    
  }
})
```

Now `api` and `app` can again use the router to dispatch to more nested microservice.

### Modular monolith

Sometimes we just don't have the ability to design our application with multiple processes in mind.
Maybe we're just starting off and want to deploy the application using a hobby dyno on heroku. But
this doesn't disable us to design a modular application which can be easily converted to a
microservice-like architecture. I like to use [micro](https://www.npmjs.org/package/micro) to build
such applications.

*Frontend service (server.js)*

```js
const createRouter = require('http-service-router')

const createAuth = require('./auth')
const createAPI = require('./api')
const createApp = /* ... */

module.exports = createFrontend({
  services: {
    api: createAuth({ services: { upstream: createAPI() } }),
    app: createApp()
  }
})

function createFrontend ({ services: { api, app } }) {
  const router = createRouter([
    [p('/api', { end: false }), api],
    [p('/app', { end: false }), app]
  ])

  return async function frontend (req, res) {
    const r = router.match(req.url)
    if (r) {
      req.url = r.url
      return r.service(req, res)
    } else {
      send(res, 404, 'Sorry, this route doesn\'t exist :-(')
    }
  }
}
```

*Auth service (auth.js)*

```js
const { createError } = require('micro')

module.exports = createAuth

function createAuth ({ services: { upstream } }) {
  return async function auth (req, res) {
    // ... Do authentication logic (e.g. JSON-Web-Token) ...
    const user = fetchUserSomehow()
    if (!user) throw createError(401, 'Sorry ...')
    req.headers['x-user'] = user,_id
    return upstream(req, res)
  }
}
```

*Api service (api.js)*

```js
module.exports = createAPI

function createAPI () {
  return async function api (req, res) {
    // Do API stuff and use `req.headers['x-user']` as user id.
  }
}
```

This is a nice modular architecture which can be executed using `micro server.js`. And the best
thing is that you can easily convert it to a microservice architecture using the `http-proxy`
approach
described above. But it gives you the chance to start-out in a lean fashion without thinking about
scaling too much.

Cheers!
