const instagram = require('./instagram')
const pinterest = require('./pinterest')
const { SCRAPR_PROVIDERS } = require('./scrapr')
const { spotisaver } = require('./scrapr/spotify')
const { listFromEmbed } = require('./spotify-list')
const { coverSrc } = require('./spotify-cover')
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
  youtube: { ms: 25000, merge: true }
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
function playlistResult(r, tracks, url) {
  const m = String(url || '').match(/spotify\.com\/(playlist|album)\/([A-Za-z0-9]{10,40})/i)
  return {
    title: String(r.title || 'Playlist Spotify').slice(0, 200),
    author: typeof r.author === 'string' ? r.author : '',
    thumbnail: r.thumbnail || '',
    coverSrc: m ? coverSrc(m[1].toLowerCase(), m[2]) : '',
    type: 'playlist',
    stats: { views: null, likes: null, comments: null, favorites: null, shares: null },
    downloads: [],
    username: '',
    platform: 'spotify',
    tracks
  }
}

async function spotifyTracks(url) {
  // Sumber utama: halaman embed publik Spotify (tidak bergantung layanan pihak ketiga).
  const embed = await listFromEmbed(url)
  if (embed && embed.tracks.length > 0) {
    return playlistResult(embed, embed.tracks.map((t, i) => ({ ...t, index: i + 1 })), url)
  }

  // Cadangan: daftar lagu dari Spotisaver.
  try {
    const response = await withTimeout(spotisaver(url), 10000)
    const raw = response && response.status && response.result && response.result.tracks
    if (!Array.isArray(raw) || raw.length === 0) return null

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

    return playlistResult(response.result, tracks, url)
  } catch (err) {
    return null
  }
}

// Gabungkan hasil semua sumber (MP4 + MP3), tanpa duplikat link.
async function runMerged(url, providers, ms) {
  const settled = await Promise.allSettled(
    providers.map(async (provider) => {
      const response = await withTimeout(provider(url), ms)
      if (!response || !response.status || !response.result) throw new Error('Kosong')
      const data = normalize(response.result, LABELS)
      if (data.downloads.length === 0) throw new Error('Tanpa media')
      return data
    })
  )
  const ok = settled.filter((s) => s.status === 'fulfilled').map((s) => s.value)
  if (ok.length === 0) return null

  const seen = new Set()
  const downloads = []
  for (const item of ok.flatMap((d) => d.downloads)) {
    if (seen.has(item.url)) continue
    seen.add(item.url)
    downloads.push(item)
  }
  // Video dulu, lalu MP3.
  downloads.sort((a, b) => (a.kind === 'audio') - (b.kind === 'audio'))
  return { ...ok[0], downloads }
}

async function downloadSimple(url, platform) {
  if (platform === 'pinterest') return downloadPinterest(url)

  if (platform === 'spotify' && SPOTIFY_LIST.test(url)) {
    // Playlist yang gagal didaftarkan dianggap gagal, bukan dipaksa jadi satu lagu.
    return spotifyTracks(url)
  }

  if (PARALLEL[platform]) {
    const config = PARALLEL[platform]
    const data = config.merge
      ? await runMerged(url, PROVIDERS[platform] || [], config.ms)
      : await runParallel(url, PROVIDERS[platform] || [], config.ms)
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

module.exports = { downloadSimple, runParallel, runMerged }
