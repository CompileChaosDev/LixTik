// YouTube lewat endpoint player internal (innertube), klien Android. Tanpa browser.
// Mengambil link MP4 langsung (format gabungan video+audio) dari streamingData.
const axios = require('axios')

const TIMEOUT_MS = 15000
const CLIENT_VERSION = '19.09.37'
const UA = `com.google.android.youtube/${CLIENT_VERSION} (Linux; U; Android 11) gzip`

function videoId(url) {
  const s = String(url)
  const m = s.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i)
  return m ? m[1] : ''
}

// Mengubah respons player menjadi { title, author, thumbnail, downloads } atau null.
function parsePlayer(data) {
  if (!data || !data.playabilityStatus || data.playabilityStatus.status !== 'OK') return null
  const streaming = data.streamingData || {}
  const formats = Array.isArray(streaming.formats) ? streaming.formats : []

  const downloads = formats
    .filter((f) => f && f.url && /video\/mp4/.test(f.mimeType || ''))
    .sort((a, b) => (b.height || 0) - (a.height || 0))
    .map((f) => ({
      type: 'video',
      quality: `${f.qualityLabel || (f.height ? f.height + 'p' : '')}`,
      url: f.url
    }))
  if (downloads.length === 0) return null

  const details = data.videoDetails || {}
  const thumbs = (details.thumbnail && details.thumbnail.thumbnails) || []
  return {
    title: String(details.title || 'Video YouTube').slice(0, 200),
    author: { username: String(details.author || '').replace(/^@/, '') },
    thumbnail: thumbs.length ? thumbs[thumbs.length - 1].url : '',
    downloads
  }
}

async function scrape(url) {
  try {
    const id = videoId(url)
    if (!id) return { status: false, message: 'Link YouTube tidak valid.' }

    const response = await axios.post(
      'https://www.youtube.com/youtubei/v1/player?prettyPrint=false',
      {
        context: {
          client: {
            clientName: 'ANDROID',
            clientVersion: CLIENT_VERSION,
            androidSdkVersion: 30,
            hl: 'en',
            gl: 'US'
          }
        },
        videoId: id,
        contentCheckOk: true,
        racyCheckOk: true
      },
      {
        headers: {
          'User-Agent': UA,
          'Content-Type': 'application/json',
          'X-YouTube-Client-Name': '3',
          'X-YouTube-Client-Version': CLIENT_VERSION
        },
        timeout: TIMEOUT_MS,
        validateStatus: () => true
      }
    )
    if (response.status !== 200) return { status: false, message: `YouTube HTTP ${response.status}` }

    const result = parsePlayer(response.data)
    if (!result) return { status: false, message: 'Video tidak bisa diambil (mungkin dibatasi atau tidak publik).' }
    return { status: true, result }
  } catch (err) {
    return { status: false, message: err.message }
  }
}

module.exports = { scrape, parsePlayer, videoId }
