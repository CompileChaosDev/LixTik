const LINE = '━━━━━━━━━━━━━━━━━━━━'

const STATUS_TEXT = {
  200: 'REQUEST SUCCESSFUL',
  500: 'INTERNAL SERVER ERROR',
  502: 'BAD GATEWAY',
  504: 'GATEWAY TIMEOUT'
}

let counter = 0
let counterDay = ''

function cleanIp(ip) {
  return String(ip || '').replace(/^::ffff:/, '').trim() || 'unknown'
}

function formatDuration(ms) {
  return (ms / 1000).toFixed(2) + 's'
}

function formatTimestamp(date) {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z')
}

function nextLogId(date) {
  const day = date.toISOString().slice(0, 10).replace(/-/g, '')

  if (day !== counterDay) {
    counterDay = day
    counter = 0
  }
  counter += 1

  return `LXT-${day}-${String(counter).padStart(4, '0')}`
}

const SOURCES = { tiktok: 'TikTok', instagram: 'Instagram', pinterest: 'Pinterest' }

function buildReport({ ok, status, errorCode, durationMs, ip, platform = 'tiktok', date = new Date() }) {
  const timestamp = formatTimestamp(date)
  const duration = formatDuration(durationMs)
  const logId = nextLogId(date)
  const statusText = STATUS_TEXT[status] || 'UNKNOWN'

  const header = ['LixTik // SYSTEM MONITOR', '', '"API ACTIVITY — REQUEST DETAILS"', '', LINE, '']

  const request = ok
    ? [
        '[ 01 ] REQUEST INFORMATION',
        '',
        '«METHOD       "GET"',
        '',
        `ENDPOINT     "/download/${platform}"`,
        '',
        `SOURCE       "${SOURCES[platform] || platform}"`,
        '',
        `TIMESTAMP    "${timestamp}"`,
        '',
        `CLIENT IP    "${cleanIp(ip)}"`,
        '',
        `DURATION     "${duration}"»`
      ]
    : [
        '[ 01 ] REQUEST INFORMATION',
        '',
        '«METHOD       "GET"',
        '',
        `ENDPOINT     "/download/${platform}"`,
        '',
        `TIMESTAMP    "${timestamp}"`,
        '',
        `CLIENT IP    "${cleanIp(ip)}"`,
        '',
        `DURATION     "${duration}"»`
      ]

  const response = ok
    ? [
        '[ 02 ] RESPONSE STATUS',
        '',
        `"● ${status} — ${statusText}"`,
        '',
        'Request processed successfully. Download data is ready.'
      ]
    : [
        '[ 02 ] RESPONSE STATUS',
        '',
        `"● ${status} — ${statusText}"`,
        '',
        'The request could not be completed due to a server-side error.'
      ]

  const diagnostics = ok
    ? [
        '[ 03 ] SYSTEM DIAGNOSTICS',
        '',
        '"API STATUS"       OPERATIONAL',
        '"SERVER STATUS"    ONLINE',
        `"RESPONSE TIME"    ${duration}`,
        '"ERROR CODE"       NONE'
      ]
    : [
        '[ 03 ] ERROR DIAGNOSTICS',
        '',
        '"API STATUS"       FAILED',
        `"ERROR CODE"       ${errorCode}`,
        '"RETRY STATUS"     AVAILABLE'
      ]

  const footer = ok
    ? ['LixTik API LOGGER', '', '"SYSTEM: ACTIVE"', `"LOG ID: ${logId}"`, '', 'Automated request monitoring system.']
    : ['LixTik API LOGGER', '', '"SYSTEM: INVESTIGATING"', `"LOG ID: ${logId}"`, '', 'Request failure recorded for diagnostics.']

  return [...header, ...request, '', LINE, '', ...response, '', LINE, '', ...diagnostics, '', LINE, '', ...footer].join('\n')
}

module.exports = { buildReport, cleanIp }
