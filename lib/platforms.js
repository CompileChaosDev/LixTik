const RULES = [
  { name: 'tiktok', host: /(^|\.)tiktok\.com$/i },
  { name: 'instagram', host: /(^|\.)instagram\.com$/i },
  { name: 'pinterest', host: /(^|\.)(pinterest\.[a-z.]+|pin\.it)$/i }
]

function detectPlatform(link) {
  try {
    const target = new URL(link)
    if (!/^https?:$/.test(target.protocol)) return null

    const rule = RULES.find((item) => item.host.test(target.hostname))
    return rule ? rule.name : null
  } catch (err) {
    return null
  }
}

module.exports = { detectPlatform }
