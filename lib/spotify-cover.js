// Cover asli lagu/playlist Spotify, diambil dari endpoint oEmbed resmi Spotify (publik).
// Respons: { thumbnail_url: "https://i.scdn.co/..." }.
const axios = require('axios')

const TYPES = ['track', 'playlist', 'album']
const ID_PATTERN = /^[A-Za-z0-9]{10,40}$/
const TIMEOUT_MS = 8000

// Alamat yang dipakai di browser untuk cover (lagu atau playlist).
function coverSrc(type, id) {
  return `/api/spotify-cover?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`
}

async function handler(req, res) {
  const type = String((req.query && req.query.type) || 'track')
  const id = String((req.query && req.query.id) || '').trim()
  if (!TYPES.includes(type) || !ID_PATTERN.test(id)) {
    return res.status(400).json({ error: 'Parameter cover tidak valid.' })
  }

  try {
    const response = await axios.get('https://open.spotify.com/oembed', {
      params: { url: `https://open.spotify.com/${type}/${id}` },
      timeout: TIMEOUT_MS,
      validateStatus: () => true
    })
    const image = response.status === 200 && response.data && response.data.thumbnail_url
    if (!image || !/^https:\/\//.test(image)) {
      return res.status(404).json({ error: 'Cover tidak tersedia.' })
    }
    res.setHeader('Cache-Control', 'public, max-age=86400')
    return res.redirect(302, image)
  } catch (err) {
    return res.status(404).json({ error: 'Cover tidak tersedia.' })
  }
}

module.exports = { handler, coverSrc, ID_PATTERN }
