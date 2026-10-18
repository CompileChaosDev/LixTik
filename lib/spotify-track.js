// Ambil link audio untuk satu lagu Spotify (dipakai saat pilih lagu dari playlist).
const { spotisaver } = require('./scrapr/spotify')

const ID_PATTERN = /^[A-Za-z0-9]{10,40}$/
const TIMEOUT_MS = 25000

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
  ])
}

async function handler(req, res) {
  const id = String((req.query && req.query.id) || '').trim()
  if (!ID_PATTERN.test(id)) {
    return res.status(400).json({ error: 'ID lagu tidak valid.' })
  }

  try {
    const response = await withTimeout(spotisaver(`https://open.spotify.com/track/${id}`), TIMEOUT_MS)
    const downloads = (response && response.status && response.result && response.result.downloads) || []
    const audio = downloads.find((item) => item && item.url && (item.type === 'audio' || item.type === 'mp3'))
    if (!audio) throw new Error('Tanpa audio')

    return res.status(200).json({ url: audio.url, title: response.result.title || '' })
  } catch (err) {
    return res.status(502).json({ error: 'Lagu ini gagal diambil. Coba lagi.' })
  }
}

module.exports = { handler, ID_PATTERN }
