const Newsletter = require('./newsletter');

module.exports = async (_, h) => {

  console.log('newsletter.get');
  const newsletter = await Newsletter()

  return h.response(newsletter);
}