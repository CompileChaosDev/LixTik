const instagram = require('./instagram')
const pinterest = require('./pinterest')
const { normalize } = require('./normalize')

const PROVIDERS = {
  instagram: [instagram.direct, instagram.indown, instagram.snapsave],
  pinterest: [pinterest.direct, pinterest.pindown]
}

const LABELS = { video: 'Download video', videoHD: 'Download video HD' }
const TOTAL_MS = 22000
const PER_PROVIDER_MS = 10000

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
  ])
}

async function downloadSimple(url, platform) {
  const deadline = Date.now() + TOTAL_MS

  for (const provider of PROVIDERS[platform] || []) {
    const remaining = deadline - Date.now()
    if (remaining < 1500) break

    try {
      const response = await withTimeout(provider(url), Math.min(PER_PROVIDER_MS, remaining))
      if (!response || !response.status || !response.result) continue

      const data = normalize(response.result, LABELS)
      if (data.downloads.length === 0) continue

      const author = response.result.author
      data.username = author && typeof author === 'object' ? String(author.username || '').replace(/^@/, '') : ''
      return data
    } catch (err) {
      continue
    }
  }

  return null
}

module.exports = { downloadSimple }
