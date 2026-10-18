// Ambil link audio untuk satu lagu Spotify. Mencoba semua sumber berurutan
// sampai ada yang berhasil, dengan batas total waktu.
const spotify = require('./scrapr/spotify')

const ID_PATTERN = /^[A-Za-z0-9]{10,40}$/
const TOTAL_MS = 24000
const PER_SOURCE_MS = 12000

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
  ])
}

// Mengembalikan { url, title } atau null.
async function findAudio(id) {
  const trackUrl = `https://open.spotify.com/track/${id}`
  const sources = [spotify.spotisaver, spotify.spotmate, spotify.spotidown, spotify.soundloaders]
  const deadline = Date.now() + TOTAL_MS

  for (const source of sources) {
    const remaining = deadline - Date.now()
    if (remaining < 1500) break
    try {
      const response = await withTimeout(source(trackUrl), Math.min(PER_SOURCE_MS, remaining))
      const downloads = (response && response.status && response.result && response.result.downloads) || []
      const audio = downloads.find((item) => item && item.url && (item.type === 'audio' || item.type === 'mp3'))
      if (audio) return { url: audio.url, title: response.result.title || '' }
    } catch (err) {
      // coba sumber berikutnya
    }
  }
  return null
}

async function handler(req, res) {
  const id = String((req.query && req.query.id) || '').trim()
  if (!ID_PATTERN.test(id)) {
    return res.status(400).json({ error: 'ID lagu tidak valid.' })
  }

  const found = await findAudio(id)
  if (!found) {
    return res.status(502).json({ error: 'Lagu ini gagal diambil. Coba lagi.' })
  }
  return res.status(200).json(found)
}

module.exports = { handler, ID_PATTERN, findAudio }
