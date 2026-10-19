// Twitter/X lewat endpoint publik syndication (tanpa login, tanpa browser).
// Mengambil data postingan lalu daftar video mp4 atau foto dari sana.
const axios = require('axios')

const TIMEOUT_MS = 15000
const UA = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Mobile Safari/537.36'

function tweetId(url) {
  const m = String(url).match(/(?:twitter|x)\.com\/[^/]+\/status\/(\d+)/i) || String(url).match(/status\/(\d+)/i)
  return m ? m[1] : ''
}

// Token yang dipakai endpoint syndication (algoritma publik).
function getToken(id) {
  return ((Number(id) / 1e15) * Math.PI).toString(36).replace(/(0+|\.)/g, '')
}

// Mengubah data tweet menjadi { title, author, thumbnail, downloads }.
function parseTweet(data) {
  if (!data || typeof data !== 'object') return null
  const media = Array.isArray(data.mediaDetails) ? data.mediaDetails : []
  const downloads = []
  let thumbnail = ''

  for (const item of media) {
    if (!thumbnail && item.media_url_https) thumbnail = item.media_url_https
    if (item.type === 'video' || item.type === 'animated_gif') {
      const variants = ((item.video_info && item.video_info.variants) || [])
        .filter((v) => v.content_type === 'video/mp4' && v.url)
        .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))
      variants.forEach((v, i) => {
        const height = (v.url.match(/\/(\d{3,4})x(\d{3,4})\//) || [])[2]
        downloads.push({
          type: 'video',
          quality: (i === 0 ? 'HD ' : 'SD ') + (height ? `${height}p` : ''),
          url: v.url
        })
      })
    } else if (item.type === 'photo' && item.media_url_https) {
      downloads.push({ type: 'photo', url: item.media_url_https + '?name=orig' })
    }
  }

  if (downloads.length === 0) return null
  const user = data.user || {}
  return {
    title: String(data.text || 'Postingan X').slice(0, 200),
    author: { username: String(user.screen_name || '') },
    thumbnail,
    downloads
  }
}

async function scrape(url) {
  try {
    const id = tweetId(url)
    if (!id) return { status: false, message: 'Link X tidak valid.' }

    const response = await axios.get('https://cdn.syndication.twimg.com/tweet-result', {
      params: { id, lang: 'en', token: getToken(id) },
      headers: { 'User-Agent': UA, Accept: 'application/json' },
      timeout: TIMEOUT_MS,
      validateStatus: () => true
    })
    if (response.status !== 200) return { status: false, message: `Syndication HTTP ${response.status}` }

    const result = parseTweet(response.data)
    if (!result) return { status: false, message: 'Tidak ada video atau foto di postingan ini.' }
    return { status: true, result }
  } catch (err) {
    return { status: false, message: err.message }
  }
}

module.exports = { scrape, parseTweet, tweetId, getToken }
