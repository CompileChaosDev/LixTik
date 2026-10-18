const instagram = require('./instagram')
const pinterest = require('./pinterest')
const { SCRAPR_PROVIDERS } = require('./scrapr')
const { normalize } = require('./normalize')
const { probeMedia } = require('./upstream')

const PROVIDERS = {
  instagram: [instagram.direct, instagram.indown, instagram.snapsave],
  pinterest: [pinterest.direct, pinterest.pindown],
  ...SCRAPR_PROVIDERS
}

const LABELS = { video: 'Download video', videoHD: 'Download video HD' }
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

async function downloadSimple(url, platform) {
  if (platform === 'pinterest') return downloadPinterest(url)

  const deadline = Date.now() + TOTAL_MS
  let fallback = null

  for (const provider of PROVIDERS[platform] || []) {
    const remaining = deadline - Date.now()
    if (remaining < 1500) break

    try {
      const response = await withTimeout(provider(url), Math.min(PER_PROVIDER_MS, remaining))
      if (!response || !response.status || !response.result) continue

      const data = normalize(response.result, LABELS)
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

module.exports = { downloadSimple }
