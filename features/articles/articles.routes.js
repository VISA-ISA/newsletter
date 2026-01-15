module.exports = [
  {
    method: 'POST',
    path: '/clean-sticky-posts',
    handler: require('./articles.sticky'),
  }
]