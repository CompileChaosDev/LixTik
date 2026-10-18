// Ambil daftar lagu playlist/album Spotify dari halaman embed publik.
// Tidak bergantung pada layanan pihak ketiga; hanya perlu playlist/album bersifat publik.
const axios = require('axios')

const LIST_URL = /spotify\.com\/(playlist|album)\/([A-Za-z0-9]{10,40})/i
const TIMEOUT_MS = 12000

function findTrackList(node, depth = 0) {
  if (!node || typeof node !== 'object' || depth > 12) return null
  if (Array.isArray(node.trackList) && node.trackList.length > 0) return node.trackList
  for (const value of Object.values(node)) {
    const found = findTrackList(value, depth + 1)
    if (found) return found
  }
  return null
}

function findEntity(node, depth = 0) {
  if (!node || typeof node !== 'object' || depth > 12) return null
  if (node.entity && typeof node.entity === 'object' && node.entity.trackList) return node.entity
  for (const value of Object.values(node)) {
    const found = findEntity(value, depth + 1)
    if (found) return found
  }
  return null
}

function coverOf(entity) {
  const sources = (entity.coverArt && entity.coverArt.sources) || []
  const first = sources.find((item) => item && typeof item.url === 'string' && /^https:\/\//.test(item.url))
  return first ? first.url : ''
}

function imageOf(item) {
  const list = (item.coverArt && item.coverArt.sources) || item.images || item.image && [item.image] || []
  const first = list.find((x) => x && typeof x.url === 'string' && /^https:\/\//.test(x.url))
  return first ? first.url : ''
}

// Mengubah HTML embed Spotify menjadi { title, author, thumbnail, tracks }.
function parseEmbed(html) {
  const match = String(html).match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)
  if (!match) return null

  let json
  try {
    json = JSON.parse(match[1])
  } catch (err) {
    return null
  }

  const entity = findEntity(json) || {}
  const raw = findTrackList(json)
  if (!raw) return null

  const tracks = raw
    .map((item, i) => {
      const uri = String(item.uri || item.trackUri || '')
      const idMatch = uri.match(/spotify:track:([A-Za-z0-9]+)/) || uri.match(/track[/:]([A-Za-z0-9]+)/)
      return {
        index: i + 1,
        id: idMatch ? idMatch[1] : '',
        title: String(item.title || item.name || 'Tanpa judul'),
        artist: String(item.subtitle || item.artist || ''),
        duration: item.duration ? Math.round(Number(item.duration) / 1000) : null,
        thumbnail: imageOf(item)
      }
    })
    .filter((t) => t.id)

  if (tracks.length === 0) return null

  return {
    title: String(entity.title || entity.name || 'Playlist Spotify'),
    author: String(entity.subtitle || ''),
    thumbnail: coverOf(entity),
    tracks
  }
}

async function listFromEmbed(url) {
  const match = String(url).match(LIST_URL)
  if (!match) return null

  try {
    const response = await axios.get(`https://open.spotify.com/embed/${match[1].toLowerCase()}/${match[2]}`, {
      timeout: TIMEOUT_MS,
      validateStatus: () => true,
      headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Mobile Safari/537.36' }
    })
    if (response.status !== 200) return null
    return parseEmbed(response.data)
  } catch (err) {
    return null
  }
}

module.exports = { listFromEmbed, parseEmbed, LIST_URL }
