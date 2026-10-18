// Facebook via fdown.net tanpa browser: ambil cookie dari halaman utama,
// lalu kirim form (URLz) ke download.php, dan baca link #sdlink / #hdlink.
const axios = require('axios')

const BASE = 'https://fdown.net'
const TIMEOUT_MS = 20000
const UA = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Mobile Safari/537.36'

function cookieHeader(setCookie) {
  if (!Array.isArray(setCookie)) return ''
  return setCookie.map((c) => c.split(';')[0]).join('; ')
}

// Ambil atribut dari elemen dengan id tertentu (tanpa library HTML).
function attrById(html, id, attr) {
  const tag = html.match(new RegExp('<[^>]*\\bid=["\']' + id + '["\'][^>]*>', 'i'))
  if (!tag) return ''
  const value = tag[0].match(new RegExp('\\b' + attr + '=["\']([^"\']+)["\']', 'i'))
  return value ? value[1].replace(/&amp;/g, '&') : ''
}

// Teks di dalam elemen dengan class tertentu.
function textByClass(html, cls) {
  const m = html.match(new RegExp('class=["\'][^"\']*\\b' + cls + '\\b[^"\']*["\'][^>]*>([\\s\\S]*?)<', 'i'))
  return m ? m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : ''
}

// Mengubah HTML hasil menjadi { title, downloads } atau { error }.
function parseResult(html) {
  const alert = textByClass(html, 'alert-danger')
  if (alert) return { error: alert }

  const downloads = []
  const sd = attrById(html, 'sdlink', 'href')
  const hd = attrById(html, 'hdlink', 'href')
  if (sd) downloads.push({ quality: 'Normal (SD)', url: sd })
  if (hd) downloads.push({ quality: 'HD', url: hd })

  const title = textByClass(html, 'lib-text') || 'Facebook Video'
  return downloads.length ? { title, downloads } : { error: 'Tidak ada link download.' }
}

async function scrape(url) {
  try {
    const home = await axios.get(`${BASE}/`, {
      headers: { 'User-Agent': UA },
      timeout: TIMEOUT_MS,
      validateStatus: () => true
    })
    const cookie = cookieHeader(home.headers['set-cookie'])

    const body = new URLSearchParams({ URLz: url }).toString()
    const response = await axios.post(`${BASE}/download.php`, body, {
      headers: {
        'User-Agent': UA,
        'Content-Type': 'application/x-www-form-urlencoded',
        Referer: `${BASE}/`,
        Origin: BASE,
        ...(cookie ? { Cookie: cookie } : {})
      },
      timeout: TIMEOUT_MS,
      validateStatus: () => true
    })
    if (response.status !== 200) return { status: false, message: `fdown HTTP ${response.status}` }

    const parsed = parseResult(String(response.data))
    if (parsed.error) return { status: false, message: parsed.error }
    return { status: true, result: parsed }
  } catch (err) {
    return { status: false, message: err.message }
  }
}

module.exports = { scrape, parseResult }
