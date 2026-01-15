require('dotenv').config()
const urls = require('./api.const')

const auth = new Proxy({
  token: null,
}, {
  get: async (target, prop) => {
    if (prop === 'token') {
      if (!target.token) {

        const response = await fetch(urls.login, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: process.env.WP_LOGIN,
            password: process.env.WP_PASS,
          }),
        })
        const data = await response.json()
        target.token = data.token
      }
      return target[prop]
    }
    return null
  },
  set: (target, prop, value) => {
    target[prop] = value
    return true
  }
})

module.exports = auth
