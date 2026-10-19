const { openUpstream, ALLOWED_TYPE } = require('./upstream')
const { safeName, pickExtension } = require('./fileUtils')

const MAX_BYTES = 150 * 1024 * 1024

module.exports = async function fileHandler(req, res) {
  const query = req.query || {}
  const kind = String(query.kind || '')
  const inline = query.inline === '1'
  const probe = query.probe === '1'
  const baseName = safeName(query.name)
  const range = inline ? String((req.headers && req.headers.range) || '') : ''

  try {
    const upstream = await openUpstream(String(query.url || ''), { range })

    if (upstream.status !== 200 && upstream.status !== 206) {
      upstream.data.destroy()
      return res.status(502).json({ error: `File nggak bisa diambil (kode ${upstream.status})` })
    }

    const type = String(upstream.headers['content-type'] || '').split(';')[0].trim().toLowerCase()
    const length = Number(upstream.headers['content-length'] || 0)

    if (!ALLOWED_TYPE.test(type) && type !== 'application/octet-stream') {
      upstream.data.destroy()
      return res.status(415).json({ error: 'Jenis file nggak didukung' })
    }

    if (upstream.status === 200 && length > MAX_BYTES) {
      upstream.data.destroy()
      return res.status(413).json({ error: 'File terlalu besar' })
    }

    if (probe) {
      upstream.data.destroy()
      return res.status(204).end()
    }

    const fileName = baseName + pickExtension(type, kind)

    res.status(upstream.status)
    res.setHeader('Content-Type', type || 'application/octet-stream')
    res.setHeader('Content-Disposition', `${inline ? 'inline' : 'attachment'}; filename="${fileName}"`)
    res.setHeader('Cache-Control', inline ? 'private, max-age=600' : 'no-store')
    res.setHeader('Accept-Ranges', 'bytes')
    if (length) res.setHeader('Content-Length', length)
    if (upstream.headers['content-range']) res.setHeader('Content-Range', upstream.headers['content-range'])

    upstream.data.on('error', () => res.destroy())
    upstream.data.pipe(res)
  } catch (err) {
    if (res.headersSent) return res.destroy()
    res.status(400).json({ error: 'URL tidak valid atau tidak diizinkan' })
  }
}
