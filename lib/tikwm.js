const axios = require('axios')

const BASE = 'https://www.tikwm.com'
const CACHE_MS = 20000
const USER_AGENT = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36'
const cache = new Map()

function absolute(link) {
  if (!link) return ''
  if (/^https?:\/\//i.test(link)) return link
  return BASE + (String(link).startsWith('/') ? '' : '/') + link
}

function toNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function fetchRaw(url) {
  const hit = cache.get(url)
  if (hit && Date.now() - hit.time < CACHE_MS) return hit.promise

  const promise = axios
    .get(BASE + '/api/', {
      params: { url, hd: 1 },
      timeout: 8000,
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' }
    })
    .then((response) => (response.data && response.data.code === 0 && response.data.data ? response.data.data : null))
    .catch(() => null)

  if (cache.size > 50) cache.clear()
  cache.set(url, { time: Date.now(), promise })
  return promise
}

function mapStats(data) {
  return {
    views: toNumber(data.play_count),
    likes: toNumber(data.digg_count),
    comments: toNumber(data.comment_count),
    favorites: toNumber(data.collect_count),
    shares: toNumber(data.share_count)
  }
}

async function fetchInfo(url) {
  const data = await fetchRaw(url)
  if (!data) return null

  const author = data.author || {}
  return {
    stats: mapStats(data),
    username: author.unique_id || '',
    author: author.nickname || ''
  }
}

async function scrape(url) {
  const data = await fetchRaw(url)
  if (!data) return { status: false }

  const images = Array.isArray(data.images) ? data.images : []
  const downloads = []

  if (data.play) downloads.push({ type: 'mp4', quality: 'Normal', url: absolute(data.play) })
  if (data.hdplay) downloads.push({ type: 'mp4', quality: 'HD', url: absolute(data.hdplay) })
  if (data.music) downloads.push({ type: 'music', url: absolute(data.music) })
  for (const image of images) downloads.push({ type: 'photo', url: absolute(image) })

  return {
    status: downloads.length > 0,
    result: {
      title: data.title || 'Video TikTok',
      thumbnail: absolute(data.cover),
      type: images.length > 0 ? 'photo' : 'video',
      author: (data.author && data.author.nickname) || '',
      stats: mapStats(data),
      downloads
    }
  }
}

module.exports = { scrape, fetchInfo }
