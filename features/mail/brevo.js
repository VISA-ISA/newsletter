const notif = require('../notif/notif')

module.exports = async ({ to = [], subject, htmlContent }) => {

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: {
        name: 'Newsletter VISA',
        email: process.env.MAIL_FROM,
      },
      bcc: to,
      subject,
      htmlContent,
    }),
  })

  if (response.status === 201) {
    const { messageId } = await response.json()
    return messageId
  } else {
    const data = await response.json()
    const payload = {
      code: response.status,
      message: data?.message || 'Une erreur est survenue lors de l\'envoi du mail',
    }

    notif(
      `❌ Erreur lors de l'envoi de la newsletter :
      ${payload.message}`
    )
    throw new Error(JSON.stringify(payload))
  }
}