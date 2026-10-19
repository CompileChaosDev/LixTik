function pick(obj, keys) {
  for (const key of keys) {
    if (obj && obj[key] != null) return obj[key]
  }
  return null
}

function authorName(author) {
  if (!author) return ''
  if (typeof author === 'string') return author
  return author.nickname || author.name || author.username || author.unique_id || ''
}

const STAT_ALIASES = {
  views: ['views', 'viewcount', 'playcount', 'plays'],
  likes: ['likes', 'likecount', 'diggcount', 'diggs', 'digg', 'hearts', 'heartcount'],
  comments: ['comments', 'commentcount'],
  favorites: ['favorites', 'favorite', 'favoritecount', 'favouritecount', 'collectcount', 'collect', 'saves', 'savecount', 'bookmarks', 'bookmarkcount'],
  shares: ['shares', 'sharecount']
}

function normalizeStats(stats) {
  const flat = {}
  for (const [key, value] of Object.entries(stats || {})) {
    flat[String(key).toLowerCase().replace(/[^a-z0-9]/g, '')] = value
  }

  const result = {}
  for (const [name, aliases] of Object.entries(STAT_ALIASES)) {
    const alias = aliases.find((item) => flat[item] != null && flat[item] !== '')
    const number = alias ? Number(flat[alias]) : NaN
    result[name] = Number.isFinite(number) ? number : null
  }
  return result
}

const DEFAULT_LABELS = { video: 'MP4 tanpa watermark', videoHD: 'MP4 HD' }

function normalize(result, labels = DEFAULT_LABELS) {
  const seen = new Set()
  const downloads = []
  let photoCount = 0

  for (const item of result.downloads || []) {
    if (!item || !item.url || seen.has(item.url)) continue
    seen.add(item.url)

    const type = String(item.type || '').toLowerCase()

    const hint = `${type} ${item.quality || ''} ${item.label || ''}`
    const looksAudio = /mp3|m4a|audio|music/i.test(hint) || /\.(mp3|m4a|aac|ogg|opus)(\?|$)/i.test(item.url)
    const looksVideo = /mp4|video/i.test(hint) && !/\.(mp3|m4a|aac)(\?|$)/i.test(item.url)

    if (['music', 'mp3', 'audio'].includes(type) || (looksAudio && !looksVideo)) {
      downloads.push({ kind: 'audio', label: 'MP3', url: item.url })
    } else if (['photo', 'image'].includes(type)) {
      photoCount += 1
      downloads.push({ kind: 'photo', label: 'Foto ' + photoCount, url: item.url })
    } else {
      const isHD = /hd/i.test(String(item.quality || ''))
      downloads.push({ kind: 'video', label: isHD ? labels.videoHD : labels.video, url: item.url })
    }
  }

  const labelCount = {}
  for (const item of downloads) {
    if (item.kind !== 'video') continue
    labelCount[item.label] = (labelCount[item.label] || 0) + 1
    if (labelCount[item.label] > 1) item.label += ' ' + labelCount[item.label]
  }

  return {
    title: result.title || 'Video TikTok',
    author: authorName(result.author),
    thumbnail: result.thumbnail || '',
    type: photoCount > 0 ? 'photo' : 'video',
    stats: normalizeStats(result.stats),
    downloads
  }
}

module.exports = { normalize }
