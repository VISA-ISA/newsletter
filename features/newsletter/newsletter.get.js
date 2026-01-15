const Newsletter = require('./newsletter');

module.exports = async (_, h) => {

  const newsletter = await Newsletter()

  return h.response(newsletter);
}