const crypto = require('crypto')

function timingSafeEqualString (a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  const bufA = Buffer.from(a, 'utf8')
  const bufB = Buffer.from(b, 'utf8')
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

function getTokenFromRequest (request) {
  const q = request.query && request.query.token
  const c = request.state && request.state.admin_token
  if (typeof q === 'string' && q.length > 0) return q
  if (typeof c === 'string' && c.length > 0) return c
  return null
}

/**
 * Accès admin : le jeton (query ou cookie admin_token) doit correspondre à process.env.TOKEN_ADMIN.
 */
function verifyAdmin (request) {
  const expected = process.env.TOKEN_ADMIN
  if (!expected || typeof expected !== 'string') return false
  const token = getTokenFromRequest(request)
  if (!token) return false
  return timingSafeEqualString(token, expected)
}

module.exports = {
  verifyAdmin,
  getTokenFromRequest,
}
