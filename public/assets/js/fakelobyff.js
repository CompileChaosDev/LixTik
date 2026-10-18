// Halaman Fake Lobby FF: nickname -> gambar lewat /api/fakelobyff.
LX.pages.fakelobyff = function () {
  const $ = LX.$
  const feature = LX.featureById('fakelobyff')
  const MAX = 30
  const TIMEOUT_MS = 45000
  let objectUrl = null
  let busy = false

  $('page').innerHTML = `
    <div class="page-head">
      <h1>${feature.pageTitle}</h1>
      <p>${feature.desc}</p>
    </div>

    <section class="search" aria-label="${feature.pageTitle}">
      <label class="field-label" for="nick-input">Nickname Free Fire</label>
      <input id="nick-input" type="text" autocomplete="off" maxlength="${MAX}" placeholder="Contoh: Malix">
      <p class="hint">Maksimal ${MAX} karakter.</p>
      <div class="actions">
        <button class="btn btn-primary" id="btn-make" type="button" data-action="make">Buat</button>
        <button class="btn" id="btn-clear" type="button" data-action="clear">Reset</button>
      </div>
    </section>

    <div id="result" aria-live="polite"></div>

    <h2 class="block-title">Cara pakai</h2>
    <div class="steps-card">
      <ol>
        <li>Ketik nickname kamu di kolom di atas.</li>
        <li>Ketuk <b>Buat</b> dan tunggu sebentar.</li>
        <li>Simpan gambarnya lewat tombol <b>Download Photo</b>.</li>
      </ol>
    </div>`

  const input = $('nick-input')
  const btnMake = $('btn-make')
  const result = $('result')

  const EMPTY = `
    <div class="box empty">
      <h2>Belum ada gambar</h2>
      <p>Isi nickname di atas, lalu ketuk Buat.</p>
    </div>`

  const message = (title, text, isError) => {
    result.innerHTML = `
      <div class="box ${isError ? 'box-pink' : ''}">
        <h2>${LX.escape(title)}</h2>
        <p>${LX.escape(text)}</p>
      </div>`
  }

  const loading = () => {
    result.innerHTML = `
      <div class="box loading" aria-busy="true">
        <div class="loading-head">
          <span class="spinner" aria-hidden="true"></span>
          <div>
            <h2>Lagi membuat</h2>
            <p>Mohon tunggu sebentar...</p>
          </div>
        </div>
        <div class="skeleton skeleton-player"></div>
      </div>`
  }

  const releaseUrl = () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl)
    objectUrl = null
  }

  const fileName = (nickname) =>
    `fake-lobby-${nickname.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'ff'}.png`

  // Simpan gambar lewat link sementara, bukan navigasi halaman.
  const saveImage = (name) => {
    if (!objectUrl) return
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = name || 'fake-lobby-ff.png'
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const show = (blob, nickname) => {
    releaseUrl()
    objectUrl = URL.createObjectURL(blob)
    result.innerHTML = `
      <div class="box">
        <h2>Fake Lobby FF</h2>
        <p>Nickname: ${LX.escape(nickname)}</p>
        <img src="${objectUrl}" alt="Fake Lobby FF ${LX.escape(nickname)}" style="display:block;width:100%;height:auto;border-radius:16px;margin:12px 0;">
        <div class="stack">
          <button class="btn btn-primary" type="button" data-action="save" data-name="${fileName(nickname)}">Download Photo</button>
        </div>
      </div>`
  }

  const setBusy = (on) => {
    busy = on
    btnMake.disabled = on
    btnMake.classList.toggle('is-loading', on)
    btnMake.textContent = on ? 'Membuat...' : 'Buat'
  }

  const make = async () => {
    if (busy) return
    const nickname = input.value.replace(/\s+/g, ' ').trim()
    if (!nickname) {
      message('Belum diisi', 'Tulis nickname dulu sebelum membuat.', true)
      input.focus()
      return
    }
    if (nickname.length > MAX) {
      message('Terlalu panjang', `Nickname maksimal ${MAX} karakter.`, true)
      return
    }

    setBusy(true)
    loading()
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const response = await fetch(`/api/fakelobyff?nickname=${encodeURIComponent(nickname)}`, { signal: controller.signal })
      if (!response.ok) {
        let text = 'Gagal membuat Fake Lobby FF. Coba lagi sebentar lagi.'
        try { text = (await response.json()).error || text } catch (err) {}
        throw new Error(text)
      }
      const type = response.headers.get('content-type') || ''
      if (!type.startsWith('image/')) throw new Error('Respons server bukan gambar. Coba lagi sebentar lagi.')
      show(await response.blob(), nickname)
    } catch (err) {
      const timedOut = err.name === 'AbortError'
      message('Gagal', timedOut ? 'Waktunya habis. Coba lagi sebentar lagi.' : (err.message || 'Gagal membuat Fake Lobby FF.'), true)
    } finally {
      clearTimeout(timer)
      setBusy(false)
    }
  }

  const clear = () => {
    input.value = ''
    releaseUrl()
    result.innerHTML = EMPTY
    input.focus()
  }

  // Satu pendengar di #page: tombol di dalam hasil tetap jalan walau hasilnya diganti.
  $('page').addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]')
    if (!button) return
    const action = button.dataset.action
    if (action === 'make') make()
    else if (action === 'clear') clear()
    else if (action === 'save') saveImage(button.dataset.name)
  })
  input.addEventListener('keydown', (event) => { if (event.key === 'Enter') make() })

  result.innerHTML = EMPTY
}
