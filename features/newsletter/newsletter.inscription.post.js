const { createSubscriber } = require('./newsletter.service');
const sendMail = require('../mail/brevo');

module.exports = async (request, h) => {
  const { email } = request.payload;

  // Validation de l'email
  if (!email || !email.includes('@')) {
    return h.response({
      success: false,
      message: 'Veuillez fournir une adresse email valide.',
      email: null
    }).code(400);
  }

  try {
    // Créer ou mettre à jour le subscriber
    const subscriber = await createSubscriber(email);

    // Créer le lien de confirmation
    const confirmationLink = `${request.server.info.uri}/newsletter/inscription?token=${subscriber.token}`;

    // Template de l'email de confirmation
    const emailTemplate = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmez votre inscription - Newsletter VISA-ISA</title>
      </head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #c8cacd; color: black; line-height: 1.4;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border: 2px solid #231f20; overflow: hidden;">
          <div style="background: #605e5f; color: white; padding: 30px; text-align: center; border-bottom: 2px solid #231f20;">
            <div style="font-family: Arial, sans-serif; font-size: 2.5em; font-weight: bold; margin-bottom: 10px; text-transform: uppercase;">VISA-ISA</div>
            <div style="font-size: 1.1em; text-transform: uppercase; letter-spacing: 1px;">Newsletter</div>
          </div>
          <div style="padding: 40px; background: white;">
            <h2 style="font-family: Arial, sans-serif; font-weight: bold; color: black; margin-top: 0; text-transform: uppercase; font-size: 1.5em;">Confirmez votre inscription</h2>
            <p style="margin-bottom: 15px; font-size: 1.1em;">Bonjour,</p>
            <p style="margin-bottom: 15px; font-size: 1.1em;">Merci de votre intérêt pour notre <span style="background: #fff200; padding: 2px 4px; font-weight: bold;">newsletter VISA-ISA</span> !</p>
            <p style="margin-bottom: 15px; font-size: 1.1em;">Pour confirmer votre inscription et commencer à recevoir nos newsletters mensuelles, veuillez cliquer sur le bouton ci-dessous :</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmationLink}" style="display: inline-block; padding: 15px 30px; background: #d2232a; color: white; text-decoration: none; border: 2px solid #231f20; font-family: Arial, sans-serif; font-size: 1.2em; font-weight: bold; text-transform: uppercase; margin: 20px 0; text-align: center; line-height: 1.2;">Confirmer mon inscription</a>
            </div>
            <p style="margin-bottom: 15px; font-size: 1.1em;">Si le bouton ne fonctionne pas, vous pouvez copier et coller ce lien dans votre navigateur :</p>
            <div style="word-break: break-all; color: #d2232a; font-size: 0.9em; background: #d5d6d8; padding: 10px; border: 1px solid #605e5f; margin: 10px 0;">${confirmationLink}</div>
            <p style="margin-bottom: 15px; font-size: 1.1em;"><strong>Important :</strong> Ce lien expire dans 24 heures pour des raisons de sécurité.</p>
          </div>
          <div style="background: #605e5f; color: white; padding: 20px; text-align: center; font-size: 0.9em; border-top: 2px solid #231f20;">
            <p style="margin: 5px 0;">Si vous n'avez pas demandé cette inscription, vous pouvez ignorer cet email.</p>
            <p style="margin: 5px 0;"><strong>VISA-ISA Newsletter</strong> - Tous droits réservés</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Envoyer l'email de confirmation
    await sendMail({
      to: [{ email: subscriber.email }],
      subject: 'Confirmez votre inscription à la Newsletter VISA-ISA',
      htmlContent: emailTemplate,
    });

    // Retourner une réponse JSON de succès
    return h.response({
      success: true,
      message: `Un email de confirmation a été envoyé à ${email}. Veuillez cliquer sur le lien dans l'email pour confirmer votre inscription.`,
      email: email,
      token: subscriber.token
    });

  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    return h.response({
      success: false,
      message: 'Erreur lors de l\'inscription. Veuillez réessayer plus tard.',
      email: email,
      error: error.message
    }).code(500);
  }
}
