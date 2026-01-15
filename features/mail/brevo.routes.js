module.exports = [
  {
    method: 'POST',
    path: '/mail/brevo',
    handler: require('./brevo.webhook')
  }
]