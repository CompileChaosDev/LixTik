const axios = require('axios')
const tiktok = require('./tiktok')
const { normalize } = require('./normalize')
const { logRequest } = require('./logger')
const { fetchPageInfo } = require('./pageInfo')
const { probeMedia } = require('./upstream')
const tikwm = require('./tikwm')
const { detectPlatform } = require('./platforms')
const { downloadSimple } = require('./simple')

const PROVIDERS = [tiktok.snaptik, tiktok.ssstik, tiktok.tiktokio, tikwm.scrape, tiktok.tikdownloader]
const STAT_KEYS = ['views', 'likes', 'comments', 'favorites', 'shares']
const SHORT_HOST = /^(vt|vm)\.tiktok\.com$/i
const TIKTOK_HOST = /(^|\.)tiktok\.com$/i
const PHOTO_TYPE = /photo|image|slide|carousel/i
const TOTAL_MS = 22000
const HARD_LIMIT_MS = 35000
const PER_PROVIDER_MS = 10000
const USER_AGENT = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36'

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
  ])
}

async function resolveUrl(url) {
  let current = url

  try {
    for (let hop = 0; hop < 3; hop++) {
      if (!SHORT_HOST.test(new URL(current).hostname)) break

      const response = await axios.get(current, {
        maxRedirects: 0,
        timeout: 4000,
        validateStatus: () => true,
        headers: { 'User-Agent': USER_AGENT }
      })

      const next = response.headers.location
      if (!next) break

      const target = new URL(next, current)
      if (!TIKTOK_HOST.test(target.hostname)) break
      current = target.href
    }
  } catch (err) {
    return current
  }

  return current
}

function hasPhotos(data) {
  return data.downloads.some((item) => item.kind === 'photo')
}

function mergeResults(best, all) {
  const merged = { ...best, downloads: [...best.downloads] }

  for (const other of all) {
    if (other === best) continue

    for (const kind of ['video', 'audio']) {
      if (merged.downloads.some((item) => item.kind === kind)) continue
      const extra = other.downloads.find((item) => item.kind === kind)
      if (extra) merged.downloads.push(extra)
    }

    if (!merged.thumbnail) merged.thumbnail = other.thumbnail
    if (!merged.author) merged.author = other.author
  }

  return merged
}

async function findAudio(url, providers, deadline) {
  const budget = Math.min(7000, deadline - Date.now())
  if (budget < 1500 || providers.length === 0) return null

  const attempts = providers.map(async (provider) => {
    const response = await withTimeout(provider(url), budget)
    if (!response || !response.status || !response.result) throw new Error('Kosong')

    const audio = normalize(response.result).downloads.find((item) => item.kind === 'audio')
    if (!audio) throw new Error('Tanpa audio')
    return audio
  })

  try {
    return await Promise.any(attempts)
  } catch (err) {
    return null
  }
}

async function download(url, expectPhoto) {
  const deadline = Date.now() + TOTAL_MS
  const found = []
  const called = []
  let wantPhotos = expectPhoto
  let verified = null

  for (const provider of PROVIDERS) {
    const remaining = deadline - Date.now()
    if (remaining < 1500) break

    called.push(provider)

    try {
      const response = await withTimeout(provider(url), Math.min(PER_PROVIDER_MS, remaining))
      if (!response || !response.status || !response.result) continue

      const data = normalize(response.result)
      if (data.downloads.length === 0) continue

      if (PHOTO_TYPE.test(String(response.result.type || ''))) wantPhotos = true

      found.push(data)

      if (wantPhotos) {
        if (hasPhotos(data)) break
        continue
      }

      const video = data.downloads.find((item) => item.kind === 'video')
      if (!video || (await probeMedia(video.url))) {
        verified = data
        break
      }
    } catch (err) {
      continue
    }
  }

  if (found.length === 0) return null

  const best = found.find(hasPhotos) || verified || found[0]
  const merged = mergeResults(best, found)
  if (!wantPhotos && best !== verified) merged.directOnly = true

  if (!merged.downloads.some((item) => item.kind === 'audio')) {
    const audio = await findAudio(url, PROVIDERS.filter((provider) => !called.includes(provider)), deadline)
    if (audio) merged.downloads.push(audio)
  }

  return merged
}

function mergeStats(...sources) {
  const merged = {}

  for (const key of STAT_KEYS) {
    const source = sources.find((item) => item && item[key] != null)
    merged[key] = source ? source[key] : null
  }
  return merged
}

function clientIp(req) {
  const headers = req.headers || {}
  const header = headers['x-vercel-forwarded-for'] || headers['x-real-ip'] || headers['x-forwarded-for'] || ''
  return String(header).split(',')[0].trim() || (req.socket && req.socket.remoteAddress) || ''
}

function finishTikTok(data, url, extra) {
  const { resolved, pageInfo, wmInfo } = extra
  const handle = resolved.match(/@([^\/?#]+)/) || url.match(/@([^\/?#]+)/)
  const info = pageInfo || wmInfo || {}

  data.username = handle ? decodeURIComponent(handle[1]) : info.username || (wmInfo && wmInfo.username) || ''
  data.stats = mergeStats(pageInfo && pageInfo.stats, wmInfo && wmInfo.stats, data.stats)
  if (!data.author) data.author = info.author || (wmInfo && wmInfo.author) || ''
}

async function gather(platform, url) {
  if (platform === 'tiktok') {
    const resolved = await resolveUrl(url)
    const isPhoto = /\/photo\//i.test(resolved)
    const [data, pageInfo, wmInfo] = await Promise.all([
      download(url, isPhoto),
      fetchPageInfo(resolved),
      tikwm.fetchInfo(url)
    ])
    return { data, extra: { resolved, pageInfo, wmInfo } }
  }

  return { data: await downloadSimple(url, platform), extra: null }
}

async function handleRequest(req, res) {
  const started = Date.now()
  const url = String((req.query && req.query.url) || '').trim()
  const platform = detectPlatform(url)

  if (!platform) {
    return res.status(400).json({ error: 'Link nggak didukung. Pakai link TikTok, Instagram, atau Pinterest' })
  }

  let outcome = null
  let failure = null

  try {
    outcome = await Promise.race([
      gather(platform, url),
      new Promise((resolve) => setTimeout(() => resolve({ timedOut: true }), HARD_LIMIT_MS))
    ])
  } catch (err) {
    failure = { status: 500, code: 'INTERNAL_SERVER_ERROR' }
  }

  if (outcome && outcome.timedOut) failure = { status: 504, code: 'UPSTREAM_TIMEOUT' }

  const durationMs = Date.now() - started
  const data = !failure && outcome ? outcome.data : null

  if (data) {
    if (platform === 'tiktok') finishTikTok(data, url, outcome.extra)
    data.platform = platform

    await logRequest({ ok: true, status: 200, platform, durationMs, ip: clientIp(req) })
    return res.status(200).json(data)
  }

  const status = failure ? failure.status : 502
  const errorCode = failure ? failure.code : 'UPSTREAM_FAILED'

  await logRequest({ ok: false, status, platform, errorCode, durationMs, ip: clientIp(req) })

  const messages = {
    504: 'Server terlalu lama merespons. Coba lagi sebentar lagi',
    500: 'Terjadi kesalahan di server. Coba lagi sebentar lagi'
  }
  const message = messages[status] || 'Semua server downloader gagal. Pastikan postingannya publik, lalu coba lagi'

  res.status(status).json({ error: message })
}

module.exports = async function handler(req, res) {
  try {
    await handleRequest(req, res)
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: 'Terjadi kesalahan di server. Coba lagi sebentar lagi' })
    }
  }
}
