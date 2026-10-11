const axios = require('axios')

const SCRIPT = /<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/
const TIKTOK_HOST = /(^|\.)tiktok\.com$/i
const POST_PATH = /\/(video|photo)\/\d+/
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'

function toNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function parsePageInfo(html) {
  const match = SCRIPT.exec(html)
  if (!match) return null

  let json
  try {
    json = JSON.parse(match[1])
  } catch (err) {
    return null
  }

  const scope = json.__DEFAULT_SCOPE__ || {}
  const detail = scope['webapp.video-detail'] || {}
  const item = detail.itemInfo && detail.itemInfo.itemStruct
  if (!item || !item.stats) return null

  const stats = item.stats
  const author = item.author || {}

  return {
    stats: {
      views: toNumber(stats.playCount),
      likes: toNumber(stats.diggCount),
      comments: toNumber(stats.commentCount),
      favorites: toNumber(stats.collectCount),
      shares: toNumber(stats.shareCount)
    },
    username: author.uniqueId || '',
    author: author.nickname || ''
  }
}

async function fetchPageInfo(pageUrl) {
  try {
    const target = new URL(pageUrl)
    if (!TIKTOK_HOST.test(target.hostname) || !POST_PATH.test(target.pathname)) return null

    const response = await axios.get(target.href, {
      timeout: 5000,
      responseType: 'text',
      maxRedirects: 3,
      headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'en-US,en;q=0.9' }
    })

    return parsePageInfo(String(response.data))
  } catch (err) {
    return null
  }
}

module.exports = { fetchPageInfo, parsePageInfo }
    
