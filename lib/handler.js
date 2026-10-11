const axios = require('axios')
const tiktok = require('./tiktok')
const { normalize } = require('./normalize')
const { logRequest } = require('./logger')

const PROVIDERS = [tiktok.snaptik, tiktok.ssstik, tiktok.tiktokio, tiktok.tikdownloader]
const TIKTOK_URL = /^https?:\/\/([\w-]+\.)*tiktok\.com\//i
const SHORT_HOST = /^(vt|vm)\.tiktok\.com$/i
const TIKTOK_HOST = /(^|\.)tiktok\.com$/i
const PHOTO_TYPE = /photo|image|slide|carousel/i
const TOTAL_MS = 22000
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
      if (!wantPhotos || hasPhotos(data)) break
    } catch (err) {
      continue
    }
  }

  if (found.length === 0) return null

  const best = found.find(hasPhotos) || found[0]
  const merged = mergeResults(best, found)

  if (!merged.downloads.some((item) => item.kind === 'audio')) {
    const audio = await findAudio(url, PROVIDERS.filter((provider) => !called.includes(provider)), deadline)
    if (audio) merged.downloads.push(audio)
  }

  return merged
}

function clientIp(req) {
  const forwarded = String((req.headers && req.headers['x-forwarded-for']) || '').split(',')[0].trim()
  return forwarded || (req.socket && req.socket.remoteAddress) || ''
}

module.exports = async function handler(req, res) {
  const started = Date.now()
  const url = String((req.query && req.query.url) || '').trim()

  if (!TIKTOK_URL.test(url)) {
    return res.status(400).json({ error: 'Link TikTok tidak valid' })
  }

  let data = null
  let crashed = false
  let resolved = url

  try {
    resolved = await resolveUrl(url)
    data = await download(url, /\/photo\//i.test(resolved))
  } catch (err) {
    crashed = true
  }

  const durationMs = Date.now() - started

  if (data) {
    const handle = resolved.match(/@([^\/?#]+)/) || url.match(/@([^\/?#]+)/)
    data.username = handle ? decodeURIComponent(handle[1]) : ''

    await logRequest({ ok: true, status: 200, durationMs, ip: clientIp(req) })
    return res.status(200).json(data)
  }

  const status = crashed ? 500 : 502
  await logRequest({
    ok: false,
    status,
    errorCode: crashed ? 'INTERNAL_SERVER_ERROR' : 'UPSTREAM_FAILED',
    durationMs
  })

  res.status(status).json({ error: 'Semua server downloader gagal. Pastikan videonya publik, lalu coba lagi' })
  }
