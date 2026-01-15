const Articles = require("../articles/articles")
const { readFile } = require('fs').promises;
const path = require('path');
const ejs = require('ejs');

module.exports = async (params = {}) => {
  const { token = null, email = null } = params

  const now = new Date()
  const day = 1
  let startMonth = now.getMonth() - 1
  let startYear = now.getFullYear()

  if (startMonth <= 0) {
    startMonth = 12
    startYear = startYear - 1
  }


  const monthName = new Date(startYear, startMonth, 1).toLocaleString('fr-FR', { month: 'long' })
  const articles = await Articles(day, startMonth, startYear)

  const template = await readFile(path.join(__dirname, 'newsletter.ejs'), 'utf8');

  return ejs.render(template, {
    posts: articles,
    month: monthName,
    year: startYear,
    origin: process.env.ORIGIN,
    token: token || null,
    email: email || null,
  })
}