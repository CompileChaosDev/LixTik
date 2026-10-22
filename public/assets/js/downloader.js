// Halaman downloader. Satu kode untuk semua platform:
// platform dibaca dari <body data-tool="..."> dan pengaturannya dari platforms.js.
LX.pages.downloader = function () {
  const tool = document.body.dataset.tool
  const config = LX.platforms[tool]
  if (!config) return

  const $ = LX.$
  const escapeHTML = LX.escape
  const isUrl = LX.isUrl


  $('page').innerHTML = `
    <div class="page-head">
      <h1>${config.title}</h1>
      <p>${config.subtitle}</p>
    </div>

    <section class="search" aria-label="${config.title}">
      <label class="field-label" for="url-input">Link ${config.name}</label>
      <input id="url-input" type="url" inputmode="url" autocomplete="off" placeholder="${config.placeholder}">
      <p class="hint">${config.hint}</p>
      <div class="actions">
        <button class="btn btn-primary" id="btn-go" type="button">Download</button>
        <button class="btn" id="btn-paste" type="button">Paste</button>
        <button class="btn" id="btn-reset" type="button">Reset</button>
      </div>
    </section>

    <div id="result" aria-live="polite"></div>

    <h2 class="block-title">Cara pakai</h2>
    <div class="steps-card">
      <ol>${config.steps.map((step) => `<li>${step}</li>`).join('')}</ol>
      ${config.note ? `<p class="guide-note">${config.note}</p>` : ''}
    </div>

    <footer class="footer"><p>&copy; 2026 ${LX.config.name}</p></footer>`

  const urlInput = $('url-input')
  const btnGo = $('btn-go')
  const result = $('result')

  let currentData = null
  let slideIndex = 0
  let loadingTimer = null

  const LOADING_STEPS = [
    'Mengambil data...',
    'Mencari link download...',
    'Menyiapkan file...',
    'Hampir selesai...'
  ]

  const EMPTY_STATE = `
    <div class="box empty">
      <h2>Belum ada link</h2>
      <p>Paste link ${config.name} di atas, lalu klik Download.</p>
    </div>`

  const HISTORY_LABELS = { video: 'Video', audio: 'MP3', photo: 'Foto' }

  function recordHistory(label) {
    if (!currentData || !currentData.sourceUrl) return
    const photos = currentData.downloads.filter((item) => item.kind === 'photo')
    LX.store.record({
      url: currentData.sourceUrl,
      platform: tool,
      title: String(currentData.title || 'Tanpa judul').slice(0, 200),
      author: String(currentData.author || '').slice(0, 80),
      thumb: isUrl(currentData.thumbnail) ? currentData.thumbnail : (photos[0] ? photos[0].url : ''),
      label
    })
  }

  result.innerHTML = EMPTY_STATE

  const EXTENSIONS = {
    'image/webp': 'webp',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'audio/mpeg': 'mp3',
    'audio/mp4': 'm4a'
  }

  function formatNumber(value) {
    const number = Number(value)
    if (!Number.isFinite(number)) return '-'
    if (number < 10000) return number.toLocaleString('id-ID')

    return number.toLocaleString('id-ID', { notation: 'compact', maximumFractionDigits: 1 })
  }

  function reportBlock() {
    const telegram = LX.config.telegramUrl
    if (!telegram) return ''

    return `
      <div class="report">
        <p>Masalah ini berulang? Kabari kami supaya segera diperbaiki.</p>
        <a class="btn" href="${escapeHTML(telegram)}" target="_blank" rel="noopener noreferrer">Laporkan lewat Telegram</a>
      </div>`
  }

  function showMessage(title, text, isError = false, withReport = false) {
    result.innerHTML = `
      <div class="box ${isError ? 'box-pink' : ''}">
        <h2>${title}</h2>
        <p>${text}</p>
        ${withReport ? reportBlock() : ''}
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


  function proxyUrl(url, name, kind) {
    return `/api/file?url=${encodeURIComponent(url)}&name=${encodeURIComponent(name)}&kind=${kind}`
  }

  function fileBase(kind) {
    const stamp = Date.now()
    if (kind === 'video' && currentData.username) return `${LX.config.name}_@${currentData.username}_${stamp}`
    return `${LX.config.name}_${stamp}`
  }

  const showToast = LX.toast

  function clickLink(href) {
    const link = document.createElement('a')
    link.href = href
    link.download = ''
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  // Muat skrip eksternal sekali, saat benar-benar dibutuhkan.
  const scriptCache = {}
  function loadScript(src) {
    if (!scriptCache[src]) {
      scriptCache[src] = new Promise((resolve, reject) => {
        const el = document.createElement('script')
        el.src = src
        el.onload = () => resolve()
        el.onerror = () => { delete scriptCache[src]; reject(new Error('Gagal memuat skrip')) }
        document.head.appendChild(el)
      })
    }
    return scriptCache[src]
  }

  // Fetch dengan batas waktu supaya halaman tidak menunggu tanpa akhir.
  function fetchWithTimeout(url, options = {}, ms = 25000) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), ms)
    return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer))
  }

  async function proxyWorks(href) {
    try {
      const check = await fetchWithTimeout(href + '&probe=1', {}, 15000)
      return check.ok
    } catch {
      return false
    }
  }

  async function saveDirect(url, name) {
    try {
      const response = await fetchWithTimeout(url, { referrerPolicy: 'no-referrer' }, 60000)
      if (!response.ok) throw new Error('Ditolak')

      const blob = await response.blob()
      const href = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = href
      link.download = `${name}.${EXTENSIONS[blob.type] || 'mp4'}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(href), 10000)
    } catch {
      window.open(url, '_blank', 'noopener')
      showToast('Dibuka di tab baru. Tekan lama lalu pilih simpan.')
    }
  }

  async function saveFile(url, kind) {
    const name = fileBase(kind)
    const href = proxyUrl(url, name, kind)

    recordHistory(HISTORY_LABELS[kind] || 'File')
    if (LX.demo) { showToast(LX.demo.note); return }

    if (!currentData.directOnly && await proxyWorks(href)) {
      clickLink(href)
      return
    }

    await saveDirect(url, name)
  }

  async function downloadZip(button) {
    if (LX.demo) { recordHistory('ZIP'); showToast(LX.demo.note); return }
    const photos = currentData.downloads.filter((item) => item.kind === 'photo')
    const label = button.textContent

    button.disabled = true
    button.textContent = 'Menyiapkan ZIP...'

    try {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js')
      const zip = new JSZip()
      const stamp = Date.now()

      await Promise.all(photos.map(async (item, index) => {
        const name = `${LX.config.name}_${stamp}_${index + 1}`
        let response = await fetch(proxyUrl(item.url, name, 'photo')).catch(() => null)
        if (!response || !response.ok) response = await fetch(item.url, { referrerPolicy: 'no-referrer' })
        if (!response.ok) throw new Error('Gagal mengambil foto')

        const blob = await response.blob()
        zip.file(`${name}.${EXTENSIONS[blob.type] || 'jpg'}`, blob)
      }))

      const content = await zip.generateAsync({ type: 'blob' })
      const href = URL.createObjectURL(content)
      const link = document.createElement('a')
      link.href = href
      link.download = `${LX.config.name}_${stamp}.zip`
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(href), 10000)
      recordHistory('ZIP')
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
    const photo = data.downloads.find((item) => item.kind === 'photo')
    const imageSrc = isUrl(data.thumbnail) ? data.thumbnail : (photo && isUrl(photo.url) ? photo.url : '')
    const poster = imageSrc ? escapeHTML(imageSrc) : ''

    let player = ''
    if (video) {
      const proxy = escapeHTML(proxyUrl(video.url, 'play', 'video') + '&inline=1')
      player = `<video controls playsinline preload="metadata" referrerpolicy="no-referrer" ${poster ? `poster="${poster}"` : ''} data-proxy="${proxy}" src="${escapeHTML(video.url)}"></video>`
    } else if (poster) {
      player = `<img src="${poster}" referrerpolicy="no-referrer" alt="Thumbnail video">`
    } else {
      player = `<div class="cover-placeholder" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/></svg></div>`
    }

    result.innerHTML = `
      <div class="box">
        ${player ? `<div class="player" data-poster="${poster}" data-embed="${escapeHTML(data.embedUrl || '')}">${player}</div>` : ''}
        <h2>${data.downloads.some((item) => item.kind === 'video') ? 'Video' : 'Lagu'} ketemu</h2>
        ${data.author ? `<p class="owner">${escapeHTML(data.author)}</p>` : ''}
        <p class="caption">${escapeHTML(data.title)}</p>
        ${renderStats(data.stats)}
        <div class="downloads">${media.map((item, index) => fileButton(item.kind === 'audio' ? { ...item, label: 'Download MP3' } : item, index === 0)).join('')}</div>
      </div>`
  }

  // ----- Playlist Spotify: daftar lagu, pilih, lalu unduh -----
  const TRACK_PAGE = 7
  let trackPage = 0
  let picked = new Set()

  function safeTitle(text) {
    return String(text).replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80) || 'Lagu'
  }

  // ----- Pratinjau lagu (Bandcamp dan sumber yang punya link audio) -----
  let previewAudio = null
  let previewIndex = null

  function togglePreview(index) {
    const track = currentData.tracks.find((t) => t.index === index)
    if (!track || !track.audio) return
    if (!previewAudio) {
      previewAudio = new Audio()
      previewAudio.addEventListener('ended', () => renderPlaylist())
    }
    if (previewIndex === index && !previewAudio.paused) {
      previewAudio.pause()
    } else {
      if (previewIndex !== index) {
        previewAudio.src = track.audio
        previewIndex = index
      }
      previewAudio.play().catch(() => {
        previewAudio.pause()
        showToast('Lagu ini belum bisa diputar. Kamu tetap bisa download.')
        renderPlaylist()
      })
    }
    renderPlaylist()
  }

  // ----- Daftar playlist -----
  function coverSrcFor(track) {
    return `/api/spotify-cover?type=track&id=${encodeURIComponent(track.id)}`
  }

  function renderPlaylist() {
    const tracks = currentData.tracks
    const pages = Math.max(1, Math.ceil(tracks.length / TRACK_PAGE))
    trackPage = Math.min(Math.max(trackPage, 0), pages - 1)
    const items = tracks.slice(trackPage * TRACK_PAGE, (trackPage + 1) * TRACK_PAGE)
    const allPicked = picked.size === tracks.length

    result.innerHTML = `
      <div class="box">
        <div class="playlist-head">
        ${currentData.coverSrc ? `<img class="playlist-cover" src="${escapeHTML(currentData.coverSrc)}" alt="Cover ${escapeHTML(currentData.title)}" referrerpolicy="no-referrer" data-fallback="${escapeHTML(coverSrcFor(currentData.tracks[0]))}" onerror="if(!this.dataset.tried){this.dataset.tried=1;this.src=this.dataset.fallback}else{this.outerHTML='<div class=&quot;playlist-cover cover-placeholder&quot;><svg viewBox=&quot;0 0 24 24&quot;><path d=&quot;M9 18V6l10-2v12&quot;/><circle cx=&quot;6.5&quot; cy=&quot;18&quot; r=&quot;2.5&quot;/><circle cx=&quot;16.5&quot; cy=&quot;16&quot; r=&quot;2.5&quot;/></svg></div>'}">` : `<div class="playlist-cover cover-placeholder" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/></svg></div>`}
        <h2>${escapeHTML(currentData.title)}</h2>
        <p>${tracks.length} lagu${currentData.author ? ' · ' + escapeHTML(currentData.author) : ''}</p>
        </div>
        <div class="stack">
          <button class="btn" type="button" data-action="tall">${allPicked ? 'Batal pilih semua' : 'Pilih semua'}</button>
        </div>
        <ul class="track-list">
          ${items.map((t) => `
            <li class="track${picked.has(t.index) ? ' is-picked' : ''}">
              <button class="track-main" type="button" data-action="tpick" data-track-index="${t.index}" aria-pressed="${picked.has(t.index) ? 'true' : 'false'}">
                <span class="track-cover-wrap" aria-hidden="true">
                  <svg class="track-cover-fallback" viewBox="0 0 24 24"><path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/></svg>
                  <img class="track-cover" src="${escapeHTML(t.audio && isUrl(t.thumbnail) ? t.thumbnail : coverSrcFor(t))}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">
                </span>
                <span class="track-text">
                  <span class="track-name">${escapeHTML(t.title)}</span>
                  ${t.artist ? `<small>${escapeHTML(t.artist)}</small>` : ''}
                </span>
              </button>
              ${t.audio ? `<button class="track-play" type="button" data-action="tplay" data-track-index="${t.index}" aria-label="Putar ${escapeHTML(t.title)}">${previewIndex === t.index && previewAudio && !previewAudio.paused ? '&#10074;&#10074;' : '&#9654;'}</button>` : ''}
            </li>`).join('')}
        </ul>
        <div class="pager">
          <button class="btn btn-small" type="button" data-action="tprev" aria-label="Halaman sebelumnya" ${trackPage === 0 ? 'disabled' : ''}>&#8249;</button>
          <span>Halaman ${trackPage + 1} / ${pages}</span>
          <button class="btn btn-small" type="button" data-action="tnext" aria-label="Halaman berikutnya" ${trackPage >= pages - 1 ? 'disabled' : ''}>&#8250;</button>
        </div>
        <div class="downloads"><button class="btn" type="button" data-action="tbatch">Download MP3</button></div>
      </div>`
  }

  async function saveTrack(url, name) {
    const href = proxyUrl(url, name, 'audio')
    if (await proxyWorks(href)) {
      clickLink(href)
      return
    }
    await saveDirect(url, name)
  }

  async function downloadPicked(button) {
    const list = currentData.tracks.filter((t) => picked.has(t.index))
    if (list.length === 0) {
      showToast('Pilih lagu yang ingin diunduh terlebih dahulu.')
      return
    }

    button.disabled = true
    let ok = 0
    let fail = 0

    for (let i = 0; i < list.length; i++) {
      const track = list[i]
      showToast(`Mengunduh ${i + 1} dari ${list.length}...`)
      try {
        let audioUrl = track.audio || ''
        if (!audioUrl) {
          const response = await fetchWithTimeout(`/api/spotify-track?id=${encodeURIComponent(track.id)}`, {}, 30000)
          const data = await response.json().catch(() => ({}))
          if (!response.ok || !data.url) throw new Error('gagal')
          audioUrl = data.url
        }
        await saveTrack(audioUrl, safeTitle(track.artist ? `${track.artist} - ${track.title}` : track.title))
        recordHistory('MP3')
        ok += 1
      } catch (err) {
        fail += 1
      }
      if (i < list.length - 1) await new Promise((r) => setTimeout(r, 900))
    }

    button.disabled = false
    showToast(`Selesai: ${ok} berhasil${fail ? `, ${fail} gagal` : ''}.`)
  }

  function renderResult(data) {
    currentData = data
    slideIndex = 0
    if (previewAudio) previewAudio.pause()
    previewIndex = null

    if (Array.isArray(data.tracks) && data.tracks.length > 0) {
      trackPage = 0
      picked = new Set()
      renderPlaylist()
      return
    }

    if (data.downloads.some((item) => item.kind === 'photo')) {
      renderPhotoPost(data)
    } else {
      renderVideoPost(data)
    }
  }

  async function fetchData(url) {
    if (LX.demo) return LX.demo.fetchData()
    const response = await fetchWithTimeout('/api/download?url=' + encodeURIComponent(url), {}, 35000)
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
    const detected = LX.detectPlatform(url)

    if (!detected) {
      showMessage('Link tidak dikenali', 'Pakai link dari TikTok, Instagram, atau Pinterest.', true)
      return
    }

    if (detected !== tool) {
      const other = LX.platforms[detected]
      showMessage(
        `Link ini dari ${other.name}`,
        `Halaman ini khusus ${config.name}. Buka halaman ${other.name} untuk memprosesnya.
         <div class="stack"><a class="btn btn-dark" href="${other.path}?url=${encodeURIComponent(url)}">Buka ${other.title}</a></div>`,
        false
      )
      return
    }

    btnGo.disabled = true
    btnGo.classList.add('is-loading')
    btnGo.textContent = 'Mencari...'
    showLoading()

    try {
      const data = await fetchData(url)
      data.sourceUrl = url
      renderResult(data)
    } catch (err) {
      showMessage('Gagal', escapeHTML(err.message) + '.', true, true)
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
    if (action === 'slide') saveFile(photos[slideIndex].url, 'photo')
    if (action === 'file') saveFile(target.dataset.url, target.dataset.kind)
    if (action === 'tprev') { trackPage -= 1; renderPlaylist() }
    if (action === 'tnext') { trackPage += 1; renderPlaylist() }
    if (action === 'tall') {
      picked = picked.size === currentData.tracks.length ? new Set() : new Set(currentData.tracks.map((t) => t.index))
      renderPlaylist()
    }
    if (action === 'tbatch') downloadPicked(target)
    if (action === 'tplay') togglePreview(Number(target.dataset.trackIndex))
    if (action === 'tpick') {
      const index = Number(target.dataset.trackIndex)
      if (picked.has(index)) picked.delete(index)
      else picked.add(index)
      renderPlaylist()
    }
  })

  // Media gagal dimuat: coba lewat proxy, lalu embed, lalu thumbnail.
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

    if (player.dataset.embed) {
      player.classList.add('embed')
      player.innerHTML = `<iframe src="${player.dataset.embed}" title="Video ${config.name}" loading="lazy" allowfullscreen scrolling="no"></iframe>`
      return
    }

    player.innerHTML = (poster ? `<img src="${poster}" referrerpolicy="no-referrer" alt="Thumbnail video">` : '') +
      '<p class="player-note">Video nggak bisa diputar di sini, tapi masih bisa didownload.</p>'
  }, true)

  // Geser slide foto di layar sentuh.
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

  btnGo.addEventListener('click', search)
  $('btn-paste').addEventListener('click', pasteFromClipboard)
  $('btn-reset').addEventListener('click', () => {
    stopLoading()
    urlInput.value = ''
    currentData = null
    result.innerHTML = EMPTY_STATE
  })
  urlInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') search()
  })

  // Dibuka dari History atau halaman lain dengan ?url=...
  result.innerHTML = EMPTY_STATE

  const preset = LX.params().get('url')
  if (preset) {
    urlInput.value = preset
    search()
  }
}
