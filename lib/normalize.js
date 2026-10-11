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

function normalizeStats(stats) {
  const source = stats || {}
  return {
    views: pick(source, ['views', 'play_count', 'playCount', 'plays']),
    likes: pick(source, ['likes', 'digg_count', 'diggCount']),
    comments: pick(source, ['comments', 'comment_count', 'commentCount']),
    shares: pick(source, ['shares', 'share_count', 'shareCount'])
  }
}

function normalize(result) {
  const seen = new Set()
  const downloads = []
  let photoCount = 0

  for (const item of result.downloads || []) {
    if (!item || !item.url || seen.has(item.url)) continue
    seen.add(item.url)

    const type = String(item.type || '').toLowerCase()

    if (['music', 'mp3', 'audio'].includes(type)) {
      downloads.push({ kind: 'audio', label: 'MP3', url: item.url })
    } else if (['photo', 'image'].includes(type)) {
      photoCount += 1
      downloads.push({ kind: 'photo', label: 'Foto ' + photoCount, url: item.url })
    } else {
      const isHD = /hd/i.test(String(item.quality || ''))
      downloads.push({ kind: 'video', label: isHD ? 'MP4 HD' : 'MP4 tanpa watermark', url: item.url })
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
