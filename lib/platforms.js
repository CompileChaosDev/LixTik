const RULES = [
  { name: 'tiktok', host: /(^|\.)tiktok\.com$/i },
  { name: 'instagram', host: /(^|\.)instagram\.com$/i },
  { name: 'pinterest', host: /(^|\.)(pinterest\.[a-z.]+|pin\.it)$/i },
  { name: 'youtube', host: /(^|\.)(youtube\.com|youtu\.be)$/i },
  { name: 'twitter', host: /(^|\.)(twitter|x)\.com$/i },
  { name: 'facebook', host: /(^|\.)(facebook\.com|fb\.watch)$/i },
  { name: 'spotify', host: /(^|\.)spotify\.com$/i },
  { name: 'soundcloud', host: /(^|\.)soundcloud\.com$/i },
  { name: 'applemusic', host: /^music\.apple\.com$/i },
  { name: 'bilibili', host: /(^|\.)(bilibili\.com|b23\.tv)$/i },
  { name: 'douyin', host: /(^|\.)(douyin\.com|iesdouyin\.com)$/i },
  { name: 'bandcamp', host: /(^|\.)bandcamp\.com$/i },
  { name: 'pixiv', host: /(^|\.)pixiv\.net$/i },
  { name: 'reddit', host: /(^|\.)(reddit\.com|redd\.it)$/i },
  { name: 'rednote', host: /(^|\.)(xiaohongshu\.com|xhslink\.com)$/i },
  { name: 'terabox', host: /(^|\.)(1024terabox\.com|terabox\.com|terabox\.app|teraboxapp\.com)$/i },
  { name: 'threads', host: /(^|\.)threads\.(net|com)$/i }
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
