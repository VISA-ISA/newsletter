const urls = require('../api/api.const')
const HTMLDecoderEncoder = require('html-encoder-decoder')

module.exports = async (startDay = 1, startMonth = 1, startYear = 2025) => {

  const response = await fetch(urls.graphql, {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({
      query: `
        query getPosts($day: Int, $month: Int, $year: Int) {
          posts(where: {
            dateQuery: {
              after: {day: $day, month: $month, year: $year}
            },
            categoryNotIn: ["584"]
          }, first: 10000) {
            edges {
              node {
                featuredImage {
                  node {
                    mediaDetails {
                      sizes {
                        sourceUrl
                        fileSize
                        file
                        height
                        name
                      }
                    }
                  }
                }
                date
                excerpt(format: RENDERED)
                title(format: RENDERED)
                slug
              }
            }
          }
        }
        `,
      variables: {
        day: startDay,
        month: startMonth,
        year: startYear
      },
    })
  })

  const { data } = await response.json()

  return data.posts.edges

    .map((o) => {

      const splitExcerpt = o.node.excerpt.split('<a class="more-link"')
      o.excerpt = splitExcerpt?.[0]
      if (splitExcerpt?.[0]) {
        o.excerpt += '</p>'
      }
      o.title = HTMLDecoderEncoder.decode(o.node.title)

      return {
        title: HTMLDecoderEncoder.decode(o.node.title),
        excerpt: o.excerpt,
        slug: o.node.slug,
        thumbnail: [...o?.node?.featuredImage?.node?.mediaDetails?.sizes || []]?.find((o) => o.name === 'thumbnail'),
      }
    })
}