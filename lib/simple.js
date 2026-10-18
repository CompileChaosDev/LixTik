const instagram = require('./instagram')
const pinterest = require('./pinterest')
const { SCRAPR_PROVIDERS } = require('./scrapr')
const { spotisaver } = require('./scrapr/spotify')
const { normalize } = require('./normalize')
const { probeMedia } = require('./upstream')

const PROVIDERS = {
  instagram: [instagram.direct, instagram.indown, instagram.snapsave],
  pinterest: [pinterest.direct, pinterest.pindown],
  ...SCRAPR_PROVIDERS
}

const LABELS = { video: 'Download video', videoHD: 'Download video HD' }

// Platform yang sumbernya butuh waktu lama (polling): dijalankan paralel,
// ambil yang paling cepat berhasil, dengan batas waktu sendiri.
const PARALLEL = {
  youtube: { ms: 25000 }
}
const TOTAL_MS = 22000
const PER_PROVIDER_MS = 10000

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
  ])
}

function keepMainMedia(data) {
  const video = data.downloads.find((item) => item.kind === 'video')
  const photo = data.downloads.find((item) => item.kind === 'photo')

  data.downloads = video ? [video] : photo ? [photo] : []
}

async function downloadPinterest(url) {
  const run = (provider) =>
    withTimeout(provider(url), PER_PROVIDER_MS)
      .then((response) => {
        if (!response || !response.status || !response.result) return null

        const data = normalize(response.result, LABELS)
        return data.downloads.length > 0 ? data : null
      })
      .catch(() => null)

  const [direct, pindown] = PROVIDERS.pinterest
  const directPromise = run(direct)
  const pindownPromise = run(pindown)

  const first = await directPromise
  const hasVideo = (data) => data && data.downloads.some((item) => item.kind === 'video')

  if (hasVideo(first)) {
    keepMainMedia(first)
    return first
  }

  const second = await pindownPromise
  const best = hasVideo(second) ? second : first || second
  if (!best) return null

  const other = best === first ? second : first
  keepMainMedia(best)

  if (!best.thumbnail && other && other.thumbnail) best.thumbnail = other.thumbnail
  if (best.downloads[0].kind === 'video' && !best.thumbnail && other) {
    const photo = other.downloads.find((item) => item.kind === 'photo')
    if (photo) best.thumbnail = photo.url
  }

  best.username = ''
  return best
}

function instagramEmbed(link) {
  const match = String(link).match(/instagram\.com\/(?:[\w.]+\/)?(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i)
  return match ? `https://www.instagram.com/p/${match[1]}/embed/` : ''
}

async function runParallel(url, providers, ms) {
  const attempts = providers.map(async (provider) => {
    const response = await withTimeout(provider(url), ms)
    if (!response || !response.status || !response.result) throw new Error('Kosong')

    const data = normalize(response.result, LABELS)
    if (data.downloads.length === 0) throw new Error('Tanpa media')
    return data
  })

  try {
    return await Promise.any(attempts)
  } catch (err) {
    return null
  }
}

// Platform yang hasilnya lagu saja: cover tidak boleh dianggap foto.
const AUDIO_ONLY = ['spotify', 'soundcloud', 'applemusic', 'bandcamp']
const SPOTIFY_LIST = /spotify\.com\/(playlist|album)\//i

function stripCover(data, platform) {
  if (!AUDIO_ONLY.includes(platform)) return data
  const cover = data.downloads.find((item) => item.kind === 'photo')
  if (cover && !data.thumbnail) data.thumbnail = cover.url
  data.downloads = data.downloads.filter((item) => item.kind !== 'photo')
  return data
}

// Daftar lagu dari playlist/album Spotify (tanpa mengunduh dulu).
async function spotifyTracks(url) {
  try {
    const response = await withTimeout(spotisaver(url), 25000)
    const raw = response && response.status && response.result && response.result.tracks
    if (!Array.isArray(raw) || raw.length === 0) return null

    const r = response.result
    const tracks = raw
      .filter((t) => t && t.id)
      .map((t, i) => ({
        index: i + 1,
        id: String(t.id),
        title: String(t.title || 'Tanpa judul'),
        artist: String(t.artist || ''),
        duration: t.duration || null,
        thumbnail: t.thumbnail || ''
      }))
    if (tracks.length === 0) return null

    return {
      title: String(r.title || 'Playlist Spotify').slice(0, 200),
      author: typeof r.author === 'string' ? r.author : '',
      thumbnail: r.thumbnail || '',
      type: 'playlist',
      stats: { views: null, likes: null, comments: null, favorites: null, shares: null },
      downloads: [],
      username: '',
      platform: 'spotify',
      tracks
    }
  } catch (err) {
    return null
  }
}

async function downloadSimple(url, platform) {
  if (platform === 'pinterest') return downloadPinterest(url)

  if (platform === 'spotify' && SPOTIFY_LIST.test(url)) {
    const list = await spotifyTracks(url)
    if (list) return list
  }

  if (PARALLEL[platform]) {
    const data = await runParallel(url, PROVIDERS[platform] || [], PARALLEL[platform].ms)
    if (data) data.username = ''
    return data
  }

  const deadline = Date.now() + TOTAL_MS
  let fallback = null

  for (const provider of PROVIDERS[platform] || []) {
    const remaining = deadline - Date.now()
    if (remaining < 1500) break

    try {
      const response = await withTimeout(provider(url), Math.min(PER_PROVIDER_MS, remaining))
      if (!response || !response.status || !response.result) continue

      const data = stripCover(normalize(response.result, LABELS), platform)
      if (data.downloads.length === 0) continue

      const author = response.result.author
      data.username = author && typeof author === 'object' ? String(author.username || '').replace(/^@/, '') : ''
      data.embedUrl = platform === 'instagram' ? instagramEmbed(url) : ''

      if (!fallback) fallback = data

      const videos = data.downloads.filter((item) => item.kind === 'video')
      if (videos.length === 0) return data

      const checks = await Promise.all(videos.map((item) => probeMedia(item.url)))
      const working = videos.filter((_, index) => checks[index])

      if (working.length > 0) {
        data.downloads = data.downloads.filter((item) => item.kind !== 'video' || working.includes(item))
        return data
      }
    } catch (err) {
      continue
    }
  }

  if (fallback) {
    fallback.directOnly = true
    return fallback
  }

  return null
}

module.exports = { downloadSimple, runParallel }
