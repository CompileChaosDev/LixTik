const net = require('net')

const EXTENSIONS = {
  'image/webp': '.webp',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'audio/mpeg': '.mp3',
  'audio/mp3': '.mp3',
  'audio/mp4': '.m4a',
  'audio/x-m4a': '.m4a'
}

const FALLBACK_EXTENSIONS = { video: '.mp4', audio: '.mp3', photo: '.jpg' }

function isPrivateAddress(address) {
  if (net.isIPv4(address)) {
    const [a, b] = address.split('.').map(Number)
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    )
  }

  const lower = address.toLowerCase()
  return (
    lower === '::' ||
    lower === '::1' ||
    lower.startsWith('fc') ||
    lower.startsWith('fd') ||
    lower.startsWith('fe80') ||
    lower.startsWith('::ffff:')
  )
}

function safeName(name) {
  const cleaned = String(name || '').replace(/[^A-Za-z0-9@._-]/g, '_').slice(0, 100)
  return cleaned || 'LixTik_' + Date.now()
}

function pickExtension(contentType, kind) {
  return EXTENSIONS[contentType] || FALLBACK_EXTENSIONS[kind] || ''
}

module.exports = { isPrivateAddress, safeName, pickExtension }
