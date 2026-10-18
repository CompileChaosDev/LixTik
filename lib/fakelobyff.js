// Fitur Fake Lobby Free Fire: meneruskan pembuatan gambar dari API pihak ketiga.
const axios = require('axios')

const API_URL = 'https://api.nexray.eu.cc/maker/fakelobyff'
const MAX_NICKNAME = 30
const TIMEOUT_MS = 30000

function cleanNickname(value) {
  // buang karakter kontrol dan spasi berlebih
  return String(value || '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

async function makeFakeLobby(nickname) {
  const response = await axios.get(API_URL, {
    params: { nickname },
    responseType: 'arraybuffer',
    timeout: TIMEOUT_MS,
    validateStatus: () => true
  })

  const type = String(response.headers['content-type'] || '')
  if (response.status !== 200 || !type.startsWith('image/')) {
    throw new Error('Upstream gagal')
  }

  return { buffer: Buffer.from(response.data), contentType: type }
}

async function handler(req, res) {
  const nickname = cleanNickname(req.query && req.query.nickname)

  if (!nickname) {
    return res.status(400).json({ error: 'Nickname belum diisi.' })
  }
  if (nickname.length > MAX_NICKNAME) {
    return res.status(400).json({ error: `Nickname maksimal ${MAX_NICKNAME} karakter.` })
  }

  try {
    const { buffer, contentType } = await makeFakeLobby(nickname)
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).send(buffer)
  } catch (err) {
    return res.status(502).json({ error: 'Gagal membuat Fake Lobby FF. Coba lagi sebentar lagi.' })
  }
}

module.exports = { handler, cleanNickname, MAX_NICKNAME }
