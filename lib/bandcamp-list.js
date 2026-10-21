// Daftar lagu album/lagu Bandcamp dari data halaman (data-tralbum), dengan nama, cover, dan link MP3 per lagu.
const axios = require('axios')

const TIMEOUT_MS = 15000
const HOST = /(^|\.)bandcamp\.com$/i

function decodeEntities(s) {
  return String(s)
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

// Mengubah HTML halaman Bandcamp menjadi { title, author, thumbnail, tracks } atau null.
function parseBandcamp(html) {
  const raw = String(html).match(/data-tralbum="([^"]+)"/)
  if (!raw) return null

  let data
  try {
    data = JSON.parse(decodeEntities(raw[1]))
  } catch (err) {
    return null
  }

  const og = String(html).match(/<meta property="og:image" content="([^"]+)"/)
  let cover = og ? decodeEntities(og[1]) : ''
  if (cover.includes('_16.')) cover = cover.replace('_16.', '_10.')
  if (!/^https:\/\//.test(cover)) cover = ''

  const artist = String(data.artist || '')
  const title = String((data.current && data.current.title) || 'Bandcamp')
  const tracks = (Array.isArray(data.trackinfo) ? data.trackinfo : [])
    .map((t, i) => {
      const audio = t.file && (t.file['mp3-128'] || Object.values(t.file)[0])
      if (!audio) return null
      return {
        index: i + 1,
        id: String(t.track_id || t.id || i + 1),
        title: String(t.title || `Lagu ${i + 1}`),
        artist: String(t.artist || artist),
        duration: t.duration ? Math.round(Number(t.duration)) : null,
        thumbnail: cover,
        audio: String(audio)
      }
    })
    .filter(Boolean)

  if (tracks.length === 0) return null
  return { title, author: artist, thumbnail: cover, tracks }
}

async function bandcampList(url) {
  try {
    if (!HOST.test(new URL(String(url)).hostname)) return null
    const clean = String(url).trim().split('?')[0]
    const response = await axios.get(clean, {
      headers: { 'User-Agent': 'curl/8.7.1', Accept: '*/*' },
      timeout: TIMEOUT_MS,
      validateStatus: () => true
    })
    if (response.status !== 200) return null

    const parsed = parseBandcamp(response.data)
    if (!parsed) return null
    return {
      title: parsed.title.slice(0, 200),
      author: parsed.author,
      thumbnail: parsed.thumbnail,
      coverSrc: parsed.thumbnail,
      type: 'playlist',
      stats: { views: null, likes: null, comments: null, favorites: null, shares: null },
      downloads: [],
      username: '',
      platform: 'bandcamp',
      tracks: parsed.tracks
    }
  } catch (err) {
    return null
  }
}

module.exports = { bandcampList, parseBandcamp }
