// Halaman Fake Lobby FF: nickname -> gambar lewat /api/fakelobyff.
LX.pages.fakelobyff = function () {
  const $ = LX.$
  const feature = LX.featureById('fakelobyff')
  const MAX = 30
  let objectUrl = null

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
        <button class="btn btn-primary" id="btn-make" type="button">Buat</button>
        <button class="btn" id="btn-clear" type="button">Reset</button>
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

  const show = (blob, nickname) => {
    releaseUrl()
    objectUrl = URL.createObjectURL(blob)
    const file = `fake-lobby-${nickname.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'ff'}.png`
    result.innerHTML = `
      <div class="box">
        <h2>Fake Lobby FF</h2>
        <p>Nickname: ${LX.escape(nickname)}</p>
        <img src="${objectUrl}" alt="Fake Lobby FF ${LX.escape(nickname)}" style="display:block;width:100%;height:auto;border-radius:16px;margin:12px 0;">
        <div class="stack">
          <a class="btn btn-primary" href="${objectUrl}" download="${file}">Download Photo</a>
        </div>
      </div>`
  }

  const make = async () => {
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

    btnMake.disabled = true
    btnMake.classList.add('is-loading')
    btnMake.textContent = 'Membuat...'
    loading()

    try {
      const response = await fetch(`/api/fakelobyff?nickname=${encodeURIComponent(nickname)}`)
      if (!response.ok) {
        let text = 'Gagal membuat Fake Lobby FF. Coba lagi sebentar lagi.'
        try { text = (await response.json()).error || text } catch (err) {}
        throw new Error(text)
      }
      show(await response.blob(), nickname)
    } catch (err) {
      message('Gagal', err.message || 'Gagal membuat Fake Lobby FF.', true)
    } finally {
      btnMake.disabled = false
      btnMake.classList.remove('is-loading')
      btnMake.textContent = 'Buat'
    }
  }

  btnMake.addEventListener('click', make)
  input.addEventListener('keydown', (event) => { if (event.key === 'Enter') make() })
  $('btn-clear').addEventListener('click', () => {
    input.value = ''
    releaseUrl()
    result.innerHTML = EMPTY
    input.focus()
  })

  result.innerHTML = EMPTY
}
