'use strict'

const url = require('url')

module.exports = createRouter

function createRouter (services) {
  return {
    match (u) {
      const { pathname, search } = url.parse(u)
      for (let [regex, service] of services) {
        const match = pathname.match(regex)
        if (match) {
          return {
            service,
            match,
            url: (pathname.slice(match[0].length) || '/') + (search || '')
          }
        }
      }
      return null
    }
  }
}
