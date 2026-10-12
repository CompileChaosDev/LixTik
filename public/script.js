const $ = (id) => document.getElementById(id)

const urlInput = $('url-input')
const btnGo = $('btn-go')
const result = $('result')

let currentData = null
let slideIndex = 0
let loadingTimer = null
let platform = 'tiktok'

const LOADING_STEPS = [
  'Mengambil data video...',
  'Mencari link download...',
  'Menyiapkan file...',
  'Hampir selesai...'
]

const EMPTY_STATE = `
  <div class="box">
    <h2>Belum ada link</h2>
    <p>Paste link di atas, lalu klik Download.</p>
  </div>`

const PLATFORMS = {
  tiktok: {
    eyebrow: 'Download TikTok',
    title: 'Simpan video TikTok.<br>Bersih, tanpa watermark.',
    subtitle: 'Tempel link, pilih MP4 atau MP3. Gratis dan tanpa login.',
    placeholder: 'Tempel link TikTok',
    pattern: /tiktok\.com/i
  },
  instagram: {
    eyebrow: 'Download Instagram',
    title: 'Simpan video dan foto<br>dari Instagram.',
    subtitle: 'Tempel link postingan atau reel, lalu pilih file yang mau disimpan.',
    placeholder: 'Tempel link Instagram',
    pattern: /instagram\.com/i
  },
  pinterest: {
    eyebrow: 'Download Pinterest',
    title: 'Simpan video dan gambar<br>dari Pinterest.',
    subtitle: 'Tempel link pin, lalu simpan videonya atau gambar kualitas aslinya.',
    placeholder: 'Tempel link Pinterest',
    pattern: /pinterest\.|pin\.it/i
  }
}

const EXTENSIONS = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif' }

function escapeHTML(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }
  return String(text).replace(/[&<>"]/g, (c) => map[c])
}

function isUrl(text) {
  return /^https?:\/\//i.test(String(text))
}

function formatNumber(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return '-'
  if (number < 10000) return number.toLocaleString('id-ID')

  return number.toLocaleString('id-ID', { notation: 'compact', maximumFractionDigits: 1 })
}

function showMessage(title, text, isError = false) {
  result.innerHTML = `
    <div class="box ${isError ? 'box-pink' : ''}">
      <h2>${title}</h2>
      <p>${text}</p>
    </div>`
}

function stopLoading() {
  clearInterval(loadingTimer)
  loadingTimer = null
}

function showLoading() {
  stopLoading()

  result.innerHTML = `
    <div class="box loading" aria-busy="true">
      <div class="loading-head">
        <span class="spinner" aria-hidden="true"></span>
        <div>
          <h2>Lagi memproses</h2>
          <p id="loading-text">${LOADING_STEPS[0]}</p>
        </div>
      </div>
      <div class="skeleton skeleton-player"></div>
      <div class="skeleton skeleton-line"></div>
      <div class="skeleton skeleton-line short"></div>
      <div class="skeleton-grid">
        <div class="skeleton"></div>
        <div class="skeleton"></div>
        <div class="skeleton"></div>
        <div class="skeleton"></div>
      </div>
    </div>`

  let step = 0
  loadingTimer = setInterval(() => {
    step = Math.min(step + 1, LOADING_STEPS.length - 1)
    const text = $('loading-text')
    if (text) text.textContent = LOADING_STEPS[step]
  }, 3000)
}

function setPlatform(name) {
  platform = name
  const config = PLATFORMS[name]

  $('hero-eyebrow').textContent = config.eyebrow
  $('hero-title').innerHTML = config.title
  $('hero-subtitle').textContent = config.subtitle
  urlInput.placeholder = config.placeholder

  document.querySelectorAll('.tab').forEach((tab) => {
    const active = tab.dataset.platform === name
    tab.classList.toggle('active', active)
    tab.setAttribute('aria-selected', String(active))
  })
}

function detectPlatform(link) {
  return Object.keys(PLATFORMS).find((name) => PLATFORMS[name].pattern.test(link)) || null
}

function proxyUrl(url, name, kind) {
  return `/api/file?url=${encodeURIComponent(url)}&name=${encodeURIComponent(name)}&kind=${kind}`
}

function fileBase(kind) {
  const stamp = Date.now()
  if (kind === 'video' && currentData.username) return `LixTik_@${currentData.username}_${stamp}`
  return `LixTik_${stamp}`
}

let toastTimer = null

function showToast(message) {
  const toast = $('toast')
  toast.textContent = message
  toast.classList.add('show')

  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => toast.classList.remove('show'), 4500)
}

async function startDownload(href) {
  try {
    const check = await fetch(href + '&probe=1')

    if (!check.ok) {
      const data = await check.json().catch(() => ({}))
      throw new Error(data.error || 'Server menolak permintaan')
    }
  } catch (err) {
    showToast('Download gagal: ' + err.message)
    return
  }

  const link = document.createElement('a')
  link.href = href
  link.download = ''
  document.body.appendChild(link)
  link.click()
  link.remove()
}

async function downloadZip(button) {
  const photos = currentData.downloads.filter((item) => item.kind === 'photo')
  const label = button.textContent

  button.disabled = true
  button.textContent = 'Menyiapkan ZIP...'

  try {
    const zip = new JSZip()
    const stamp = Date.now()

    await Promise.all(photos.map(async (item, index) => {
      const name = `LixTik_${stamp}_${index + 1}`
      const response = await fetch(proxyUrl(item.url, name, 'photo'))
      if (!response.ok) throw new Error('Gagal mengambil foto')

      const blob = await response.blob()
      zip.file(`${name}.${EXTENSIONS[blob.type] || 'jpg'}`, blob)
    }))

    const content = await zip.generateAsync({ type: 'blob' })
    const href = URL.createObjectURL(content)
    const link = document.createElement('a')
    link.href = href
    link.download = `LixTik_${stamp}.zip`
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(href), 10000)
  } catch {
    button.textContent = 'Gagal, coba lagi'
    await new Promise((resolve) => setTimeout(resolve, 2000))
  } finally {
    button.textContent = label
    button.disabled = false
  }
}

function showSlide(index) {
  const photos = currentData.downloads.filter((item) => item.kind === 'photo')
  slideIndex = (index + photos.length) % photos.length

  const image = $('slide-image')
  delete image.dataset.retried
  image.dataset.proxy = proxyUrl(photos[slideIndex].url, 'slide', 'photo') + '&inline=1'
  image.src = photos[slideIndex].url
  image.alt = `Slide ${slideIndex + 1}`

  document.querySelectorAll('.dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === slideIndex)
  })

  const counter = $('slide-counter')
  if (counter) counter.textContent = `${slideIndex + 1} / ${photos.length}`
}

function renderStats(stats) {
  const items = [
    ['likes', 'Suka'],
    ['comments', 'Komentar'],
    ['favorites', 'Favorit'],
    ['shares', 'Share']
  ].filter(([key]) => stats && stats[key] != null)

  if (items.length === 0) return ''

  return `
    <div class="stats">
      ${items.map(([key, label]) => `<div class="stat"><b>${formatNumber(stats[key])}</b>${label}</div>`).join('')}
    </div>`
}

function fileButton(item, isMain) {
  return `<button class="btn ${isMain ? 'btn-dark' : ''}" type="button" data-action="file" data-kind="${item.kind}" data-url="${escapeHTML(item.url)}">${escapeHTML(item.label)}</button>`
}

function renderPhotoPost(data) {
  const photos = data.downloads.filter((item) => item.kind === 'photo')
  const videos = data.downloads.filter((item) => item.kind === 'video')
  const audio = data.downloads.find((item) => item.kind === 'audio')
  const many = photos.length > 1

  const controls = many
    ? `
      <button class="arrow arrow-prev" type="button" data-action="prev" aria-label="Slide sebelumnya">&#8249;</button>
      <button class="arrow arrow-next" type="button" data-action="next" aria-label="Slide berikutnya">&#8250;</button>
      <div class="dots">${photos.map((_, i) => `<span class="dot ${i === 0 ? 'active' : ''}"></span>`).join('')}</div>
      <span class="counter" id="slide-counter">1 / ${photos.length}</span>`
    : ''

  result.innerHTML = `
    <div class="box">
      <h2>Foto ketemu</h2>
      ${data.author ? `<p class="owner">${escapeHTML(data.author)}</p>` : ''}
      <p class="caption">${escapeHTML(data.title)}</p>
      <div class="slider">
        <img id="slide-image" src="${escapeHTML(photos[0].url)}" data-proxy="${escapeHTML(proxyUrl(photos[0].url, 'slide', 'photo') + '&inline=1')}" referrerpolicy="no-referrer" alt="Slide 1">
        ${controls}
      </div>
      <div class="stack">
        <button class="btn btn-dark" type="button" data-action="slide">Download foto ini</button>
        ${many ? `<button class="btn" type="button" data-action="zip">Download semua foto (ZIP) (${photos.length})</button>` : ''}
        ${videos.map((item, index) => `<button class="btn" type="button" data-action="file" data-kind="video" data-url="${escapeHTML(item.url)}">${videos.length > 1 ? `Download video ${index + 1}` : 'Download sebagai video'}</button>`).join('')}
        ${audio ? `<button class="btn" type="button" data-action="file" data-kind="audio" data-url="${escapeHTML(audio.url)}">Unduh MP3</button>` : ''}
      </div>
    </div>`
}

function renderVideoPost(data) {
  const media = data.downloads.filter((item) => item.kind === 'video' || item.kind === 'audio')
  const video = data.downloads.find((item) => item.kind === 'video')
  const poster = isUrl(data.thumbnail) ? escapeHTML(data.thumbnail) : ''

  let player = ''
  if (video) {
    const proxy = escapeHTML(proxyUrl(video.url, 'play', 'video') + '&inline=1')
    player = `<video controls playsinline preload="metadata" referrerpolicy="no-referrer" ${poster ? `poster="${poster}"` : ''} data-proxy="${proxy}" src="${escapeHTML(video.url)}"></video>`
  } else if (poster) {
    player = `<img src="${poster}" referrerpolicy="no-referrer" alt="Thumbnail video">`
  }

  result.innerHTML = `
    <div class="box">
      ${player ? `<div class="player" data-poster="${poster}">${player}</div>` : ''}
      <h2>Video ketemu</h2>
      ${data.author ? `<p class="owner">${escapeHTML(data.author)}</p>` : ''}
      <p class="caption">${escapeHTML(data.title)}</p>
      ${renderStats(data.stats)}
      <div class="downloads">${media.map((item, index) => fileButton(item, index === 0)).join('')}</div>
    </div>`
}

function renderResult(data) {
  currentData = data
  slideIndex = 0

  if (data.downloads.some((item) => item.kind === 'photo')) {
    renderPhotoPost(data)
  } else {
    renderVideoPost(data)
  }
}

async function fetchData(url) {
  const response = await fetch('/api/download?url=' + encodeURIComponent(url))
  const text = await response.text()

  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error(
      response.status === 404
        ? 'Server /api/download nggak ketemu. Jalankan lewat server.js (npm start) atau deploy ke Vercel'
        : 'Respons server bukan JSON'
    )
  }

  if (!response.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Gagal mengambil video')
  }
  return data
}

async function search() {
  const url = urlInput.value.trim()

  const detected = detectPlatform(url)

  if (!detected) {
    showMessage('Link nggak didukung', 'Pakai link dari TikTok, Instagram, atau Pinterest.', true)
    return
  }

  if (detected !== platform) setPlatform(detected)

  btnGo.disabled = true
  btnGo.classList.add('is-loading')
  btnGo.textContent = 'Mencari...'
  showLoading()

  try {
    renderResult(await fetchData(url))
  } catch (err) {
    showMessage('Gagal', escapeHTML(err.message) + '.', true)
  } finally {
    stopLoading()
    btnGo.disabled = false
    btnGo.classList.remove('is-loading')
    btnGo.textContent = 'Download'
  }
}

async function pasteFromClipboard() {
  try {
    urlInput.value = await navigator.clipboard.readText()
    const detected = detectPlatform(urlInput.value)
    if (detected && detected !== platform) setPlatform(detected)
  } catch {
    urlInput.focus()
  }
}

result.addEventListener('click', (event) => {
  const target = event.target.closest('[data-action]')
  if (!target || !currentData) return

  const action = target.dataset.action
  const photos = currentData.downloads.filter((item) => item.kind === 'photo')

  if (action === 'prev') showSlide(slideIndex - 1)
  if (action === 'next') showSlide(slideIndex + 1)
  if (action === 'zip') downloadZip(target)
  if (action === 'slide') startDownload(proxyUrl(photos[slideIndex].url, `LixTik_${Date.now()}`, 'photo'))
  if (action === 'file') {
    const kind = target.dataset.kind
    startDownload(proxyUrl(target.dataset.url, fileBase(kind), kind))
  }
})

result.addEventListener('error', (event) => {
  const media = event.target

  if (media.tagName !== 'VIDEO' && media.tagName !== 'IMG') return

  if (media.dataset.proxy && !media.dataset.retried) {
    media.dataset.retried = '1'
    media.src = media.dataset.proxy
    if (media.tagName === 'VIDEO') media.load()
    return
  }

  if (media.tagName !== 'VIDEO') return

  const player = media.closest('.player')
  const poster = player.dataset.poster
  player.innerHTML = (poster ? `<img src="${poster}" referrerpolicy="no-referrer" alt="Thumbnail video">` : '') +
    '<p class="player-note">Video nggak bisa diputar di sini, tapi masih bisa didownload.</p>'
}, true)

let touchStartX = null

result.addEventListener('touchstart', (event) => {
  touchStartX = event.target.closest('.slider') ? event.touches[0].clientX : null
}, { passive: true })

result.addEventListener('touchend', (event) => {
  if (touchStartX === null || !currentData || !$('slide-image')) return

  const distance = event.changedTouches[0].clientX - touchStartX
  touchStartX = null
  if (Math.abs(distance) > 40) showSlide(slideIndex + (distance < 0 ? 1 : -1))
})

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    stopLoading()
    setPlatform(tab.dataset.platform)
    currentData = null
    result.innerHTML = EMPTY_STATE
  })
})

urlInput.addEventListener('input', () => {
  const detected = detectPlatform(urlInput.value)
  if (detected && detected !== platform) setPlatform(detected)
})

btnGo.addEventListener('click', search)
$('btn-paste').addEventListener('click', pasteFromClipboard)
$('btn-reset').addEventListener('click', () => {
  stopLoading()
  urlInput.value = ''
  currentData = null
  result.innerHTML = EMPTY_STATE
})
urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') search()
})
