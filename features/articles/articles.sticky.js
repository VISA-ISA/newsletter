const urls = require('../api/api.const')
const authCron = require('../cron/cron.auth')
const auth = require('../api/api.store')

module.exports = async (r, h) => {

  await authCron(r, h)

  try {
    const response = await fetch(urls.graphql, {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        query: `
        query posts {
          posts(where: {onlySticky: true, 
          orderby: {field: DATE, order: DESC}
          }
          first: 10000
          ) {
            edges {
              node {
                postId
                title
              }
            }
          }
        }
        `,
      })
    })
    const { data } = await response.json()
    const ids = data.posts.edges.map((o) => o.node.postId).slice(5)

    for (const id of ids) {
      const response = await fetch(urls.cleanStickyPosts + id, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await auth.token}`,
        },
        body: JSON.stringify({
          sticky: false,
        }),
      })
      await response.json()
    }

    return h.response(ids)
  } catch (error) {
    console.error('Erreur lors de la récupération des articles épinglés', error)
    return h.response(error, 500)
  }
}