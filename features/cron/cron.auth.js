module.exports = (request, h) => {
  const authorization = request.headers['Authorization']
  if (authorization !== process.env.CRON_TOKEN) {
    return h.response('Unauthorized', 401)
  }
}