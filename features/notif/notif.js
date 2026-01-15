module.exports = async (content) => {
  try {
    await fetch(process.env.DISCORD_WEBHOOK, {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        content,
      }),
    })
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification', error)
  }
}