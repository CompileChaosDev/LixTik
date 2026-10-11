const axios = require('axios')
const dns = require('dns').promises
const { isPrivateAddress, safeName, pickExtension } = require('./fileUtils')

const MAX_BYTES = 150 * 1024 * 1024
const MAX_REDIRECTS = 3
const ALLOWED_TYPE = /^(video|image|audio)\//i
const USER_AGENT = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36'

async function assertPublicHost(target) {
  if (!/^https?:$/.test(target.protocol)) throw new Error('Protokol tidak didukung')

  const records = await dns.lookup(target.hostname, { all: true })
  if (!records.length || records.some((record) => isPrivateAddress(record.address))) {
    throw new Error('Alamat tidak diizinkan')
  }
}

async function openStream(link) {
  let current = new URL(link)

  for (let attempt = 0; attempt <= MAX_REDIRECTS; attempt++) {
    await assertPublicHost(current)

    const response = await axios.get(current.href, {
      responseType: 'stream',
      maxRedirects: 0,
      timeout: 20000,
      validateStatus: () => true,
      headers: { 'User-Agent': USER_AGENT, Accept: '*/*' }
    })

    if (response.status >= 300 && response.status < 400 && response.headers.location) {
      response.data.destroy()
      current = new URL(response.headers.location, current)
      continue
    }
    return response
  }

  throw new Error('Terlalu banyak redirect')
}

module.exports = async function fileHandler(req, res) {
  const query = req.query || {}
  const kind = String(query.kind || '')
  const baseName = safeName(query.name)

  try {
    const upstream = await openStream(String(query.url || ''))

    if (upstream.status !== 200) {
      upstream.data.destroy()
      return res.status(502).json({ error: 'File nggak bisa diambil' })
    }

    const type = String(upstream.headers['content-type'] || '').split(';')[0].trim().toLowerCase()
    const length = Number(upstream.headers['content-length'] || 0)

    if (!ALLOWED_TYPE.test(type) && type !== 'application/octet-stream') {
      upstream.data.destroy()
      return res.status(415).json({ error: 'Jenis file nggak didukung' })
    }

    if (length > MAX_BYTES) {
      upstream.data.destroy()
      return res.status(413).json({ error: 'File terlalu besar' })
    }

    const fileName = baseName + pickExtension(type, kind)

    res.setHeader('Content-Type', type || 'application/octet-stream')
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    res.setHeader('Cache-Control', 'no-store')
    if (length) res.setHeader('Content-Length', length)

    upstream.data.on('error', () => res.destroy())
    upstream.data.pipe(res)
  } catch (err) {
    if (res.headersSent) return res.destroy()
    res.status(400).json({ error: 'URL tidak valid atau tidak diizinkan' })
  }
}
