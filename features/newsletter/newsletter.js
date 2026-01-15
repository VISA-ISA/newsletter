const Articles = require("../articles/articles")
const { readFile } = require('fs').promises;
const path = require('path');
const ejs = require('ejs');

module.exports = async (params = {}) => {
  const { token = null, email = null } = params

  const now = new Date()
  const day = 1
  let month = now.getMonth() - 1
  let year = now.getFullYear()
  if (month === 0) {
    month = 12
    year = year - 1
  } else if (month === 11) {
    month = 0
    year = year + 1
  }
  const monthName = new Date(year, month, 1).toLocaleString('fr-FR', { month: 'long' })
  const articles = await Articles(day, month, year)

  const template = await readFile(path.join(__dirname, 'newsletter.ejs'), 'utf8');

  return ejs.render(template, {
    posts: articles,
    month: monthName,
    year,
    origin: process.env.ORIGIN,
    token: token || null,
    email: email || null,
  })
}