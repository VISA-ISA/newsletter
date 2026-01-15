const { updateEmail } = require("../newsletter/newsletter.service")
const notif = require("../notif/notif")
const { blacklistSubscriber } = require("../subscribers/subscribers.service")

module.exports = async (request, h) => {

  const { event, email, reason = "unknown", subject } = request.payload

  if (event === 'delivered') {
    await updateEmail(subject, email, { status: 'delivered' })
  }

  if (event === 'unique_opened') {
    await updateEmail(subject, email, { status: 'opened', opened_at: new Date() })
  }

  if (event === 'click') {
    await updateEmail(subject, email, { status: 'clicked', clicked_at: new Date() })
  }

  if (event.match(/invalid_email|blocked|error|Unable to find/)) {

    await updateEmail(subject, email, { status: 'failed', error_message: reason })
    await blacklistSubscriber(email)

    await notif(
      `❌ Email bloqué pour ${email} :
      **Raison**: ${reason}
      **Type**: ${event}`
    )
  }

  return h.response('PONG')
}