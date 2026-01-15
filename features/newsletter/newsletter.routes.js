module.exports = [
  {
    method: 'GET',
    path: '/',
    handler: require("./newsletter.get"),
  },
  {
    method: 'POST',
    path: '/',
    handler: require("./newsletter.post"),
  },
  {
    method: 'GET',
    path: '/newsletter/inscription',
    handler: require("./newsletter.inscription"),
  },
  {
    method: 'POST',
    path: '/newsletter/inscription',
    handler: require("./newsletter.inscription.post"),
  },
  {
    method: 'GET',
    path: '/newsletter/form',
    handler: require("./newsletter.form.get"),
  },
  {
    method: 'GET',
    path: '/newsletter/desinscription',
    handler: require("./newsletter.desinscription"),
  },
  {
    method: 'GET',
    path: '/newsletter/admin/login',
    handler: require("./newsletter.admin.login"),
  },
  {
    method: 'POST',
    path: '/newsletter/admin/login',
    handler: require("./newsletter.admin.login"),
  },
  {
    method: 'GET',
    path: '/newsletter/admin',
    handler: require("./newsletter.admin.dashboard").getHandler,
  },
  {
    method: 'POST',
    path: '/newsletter/admin',
    handler: require("./newsletter.admin.dashboard").postHandler,
  }
]