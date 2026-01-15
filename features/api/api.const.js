const BASE_URL = process.env.WP_GRAPHQL

module.exports = {
  login: 'https://api.visa-isa.org/wp-json/jwt-auth/v1/token',
  validateToken: `${BASE_URL}/validate`,
  graphql: `${BASE_URL}`,
  cleanStickyPosts: `https://api.visa-isa.org/wp-json/wp/v2/posts/`,
}