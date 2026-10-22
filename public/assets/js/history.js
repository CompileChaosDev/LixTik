// Halaman History: semua download dari semua fitur downloader, dalam satu daftar gabungan.
LX.pages.history = function () {
  const box = LX.$('history-list')

  const ago = (ms) => {
    const diff = Math.max(0, Date.now() - ms)
    const minute = 60000
    if (diff < minute) return 'Baru saja'
    if (diff < 60 * minute) return `${Math.floor(diff / minute)} menit lalu`
    if (diff < 24 * 60 * minute) return `${Math.floor(diff / (60 * minute))} jam lalu`
    if (diff < 7 * 24 * 60 * minute) return `${Math.floor(diff / (24 * 60 * minute))} hari lalu`
    return new Date(ms).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const render = () => {
    const all = LX.store.load().filter((item) => LX.platforms[item.platform])
    const list = all
    LX.$('history-clear').hidden = all.length === 0

    if (list.length === 0) {
      box.innerHTML = `
        <div class="box empty-state">
          <span class="chip">${LX.icons.clock}</span>
          <h2>Belum ada download</h2>
          <p>Video atau foto yang kamu download akan muncul di sini.</p>
          <a class="btn" href="/">Pilih fitur</a>
        </div>`
      return
    }

    box.innerHTML = list.map((item) => {
      const feature = LX.featureById(item.platform)
      const icon = LX.icons[(feature && feature.icon) || item.platform] || LX.icons.download
      const thumb = LX.isUrl(item.thumb)
        ? `<img class="thumb-img" src="${LX.escape(item.thumb)}" referrerpolicy="no-referrer" loading="lazy" alt="">`
        : icon

      return `
        <article class="hist-item" data-id="${item.id}">
          <div class="thumb" data-platform="${LX.escape(item.platform)}">${thumb}</div>
          <div class="hist-body">
            <p class="hist-title">${LX.escape(item.title)}</p>
            <div class="hist-meta">
              <span class="tag">${LX.escape(item.label)}</span>
              <span>${feature ? feature.title : ''}</span>
              <span>${ago(item.id)}</span>
            </div>
          </div>
          <div class="hist-actions">
            <button class="icon-btn" type="button" data-hist="again" aria-label="Download lagi">${LX.icons.download}</button>
            <button class="icon-btn del" type="button" data-hist="delete" aria-label="Hapus dari history">${LX.icons.trash}</button>
          </div>
        </article>`
    }).join('')
  }

  box.addEventListener('click', (event) => {
    const button = event.target.closest('[data-hist]')
    if (!button) return

    const id = Number(button.closest('.hist-item').dataset.id)
    const item = LX.store.load().find((entry) => entry.id === id)
    if (!item) return

    if (button.dataset.hist === 'delete') {
      LX.store.remove(id)
      render()
      return
    }

    const platform = LX.platforms[item.platform]
    if (platform) LX.go(`${platform.path}?url=${encodeURIComponent(item.url)}`)
  })

  LX.$('history-clear').addEventListener('click', () => {
    if (!confirm('Hapus semua history download?')) return
    LX.store.clear()
    render()
  })

  // Thumbnail gagal dimuat: ganti ikon platform.
  box.addEventListener('error', (event) => {
    const img = event.target
    if (img.className !== 'thumb-img') return
    img.parentElement.innerHTML = LX.icons[img.parentElement.dataset.platform] || LX.icons.download
  }, true)

  render()
}
