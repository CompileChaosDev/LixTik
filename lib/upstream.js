const axios = require('axios')
const dns = require('dns').promises
const { isPrivateAddress } = require('./fileUtils')

const MAX_REDIRECTS = 3
const ALLOWED_TYPE = /^(video|image|audio)\//i
const INSTAGRAM_CDN = /(instagram\.com|cdninstagram\.com|fbcdn\.net)$/i
const USER_AGENT = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36'

async function assertPublicHost(target) {
  if (!/^https?:$/.test(target.protocol)) throw new Error('Protokol tidak didukung')

  const records = await dns.lookup(target.hostname, { all: true })
  if (!records.length || records.some((record) => isPrivateAddress(record.address))) {
    throw new Error('Alamat tidak diizinkan')
  }
}

function refererCandidates(target) {
  const list = ['']

  if (INSTAGRAM_CDN.test(target.hostname)) list.push('https://www.instagram.com/')
  list.push(target.origin + '/')

  return list
}

async function openUpstream(link, { range = '', timeout = 20000 } = {}) {
  let current = new URL(link)

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicHost(current)

    const referers = refererCandidates(current)
    let response = null

    for (let index = 0; index < referers.length; index++) {
      const headers = { 'User-Agent': USER_AGENT, Accept: '*/*' }
      if (referers[index]) headers.Referer = referers[index]
      if (range) headers.Range = range

      response = await axios.get(current.href, {
        responseType: 'stream',
        maxRedirects: 0,
        timeout,
        validateStatus: () => true,
        headers
      })

      const blocked = response.status === 401 || response.status === 403
      if (!blocked || index === referers.length - 1) break
      response.data.destroy()
    }

    if (response.status >= 300 && response.status < 400 && response.headers.location) {
      response.data.destroy()
      current = new URL(response.headers.location, current)
      continue
    }
    return response
  }

  throw new Error('Terlalu banyak redirect')
}

async function probeMedia(link) {
  try {
    const response = await openUpstream(link, { range: 'bytes=0-1', timeout: 6000 })
    response.data.destroy()

    const type = String(response.headers['content-type'] || '').split(';')[0].trim().toLowerCase()
    const okStatus = response.status === 200 || response.status === 206
    return okStatus && (ALLOWED_TYPE.test(type) || type === 'application/octet-stream')
  } catch (err) {
    return false
  }
}

module.exports = { openUpstream, probeMedia, ALLOWED_TYPE }
