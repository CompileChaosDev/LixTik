const tiktok = require('./tiktok')
const { normalize } = require('./normalize')
const { logRequest } = require('./logger')

const PROVIDERS = [tiktok.snaptik, tiktok.ssstik, tiktok.tiktokio, tiktok.tikdownloader]
const TIKTOK_URL = /^https?:\/\/([\w-]+\.)*tiktok\.com\//i
const TOTAL_MS = 25000
const PER_PROVIDER_MS = 10000

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
  ])
}

async function download(url) {
  const deadline = Date.now() + TOTAL_MS

  for (const provider of PROVIDERS) {
    const remaining = deadline - Date.now()
    if (remaining < 1500) break

    try {
      const response = await withTimeout(provider(url), Math.min(PER_PROVIDER_MS, remaining))
      if (response && response.status && response.result) {
        const data = normalize(response.result)
        if (data.downloads.length > 0) return data
      }
    } catch (err) {
      continue
    }
  }

  return null
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

  try {
    data = await download(url)
  } catch (err) {
    crashed = true
  }

  const durationMs = Date.now() - started

  if (data) {
    const handle = url.match(/@([^\/?#]+)/)
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
