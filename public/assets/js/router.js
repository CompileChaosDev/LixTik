// Navigasi tanpa reload: klik menu/link internal cukup mengganti isi halaman.
// Skrip sudah termuat sekali, jadi pindah halaman tidak perlu mengunduh ulang apa pun.
;(function () {
  const VIEWS = {"history": "\n      <div class=\"page-head page-head-row\">\n        <div>\n          <h1>History</h1>\n          <p>Semua yang pernah kamu download di perangkat ini.</p>\n        </div>\n        <button class=\"btn btn-small btn-danger-soft\" id=\"history-clear\" type=\"button\" hidden>Hapus semua</button>\n      </div>\n      <div class=\"filters\" id=\"history-filters\" hidden></div>\n      <div id=\"history-list\"></div>\n      <footer class=\"footer\"><p>&copy; 2026 LixTik</p></footer>\n    ", "guide": "\n      <div class=\"page-head\">\n        <h1>Panduan</h1>\n        <p>Cara pakai tiap fitur, dari salin link sampai file tersimpan.</p>\n      </div>\n\n      <div class=\"guide\" id=\"guide-list\"></div>\n\n      <h2 class=\"block-title\">File tersimpan di mana?</h2>\n      <div class=\"rows\">\n        <div class=\"row\"><b>Android</b><span>Folder Download, atau Galeri.</span></div>\n        <div class=\"row\"><b>iPhone</b><span>Aplikasi Berkas, folder Unduhan. Pakai Safari.</span></div>\n        <div class=\"row\"><b>Komputer</b><span>Folder Downloads di browser kamu.</span></div>\n      </div>\n\n      <h2 class=\"block-title\">Kalau ada masalah</h2>\n      <div class=\"faq\">\n        <details><summary>Link saya gagal diproses</summary><p>Pastikan kontennya publik dan belum dihapus, lalu salin ulang linknya dari aplikasinya. Kalau masih gagal, tunggu sebentar dan coba lagi.</p></details>\n        <details><summary>File terbuka di tab baru, bukan terunduh</summary><p>Tekan lama pada video atau gambarnya, lalu pilih simpan atau download.</p></details>\n        <details><summary>Tombol MP3 tidak muncul</summary><p>Tidak semua video punya audio terpisah. Kalau ada, tombolnya muncul otomatis.</p></details>\n        <details><summary>Bisa download konten pribadi atau dikunci?</summary><p>Tidak bisa. Hanya konten publik yang bisa diunduh.</p></details>\n        <details><summary>History hilang</summary><p>History disimpan di browser perangkat ini. Kalau data browser dihapus atau pindah perangkat, history ikut hilang.</p></details>\n      </div>\n      <footer class=\"footer\"><p>&copy; 2026 LixTik</p></footer>\n    "}
  const main = document.querySelector('main.main')
  if (!main || !window.LX) return

  const kindOf = (f) => {
    if (!f) return 'home'
    if (f.id === 'history') return 'history'
    if (f.id === 'panduan') return 'guide'
    return LX.platforms[f.id] ? 'downloader' : f.id
  }

  function routeFor(path) {
    if (path === '/' || path === '/index.html') return { feature: null }
    const feature = LX.features.find((f) => f.path === path)
    return feature ? { feature } : null
  }

  function render(path, push) {
    const route = routeFor(path)
    if (!route) return false
    const body = document.body
    const f = route.feature
    body.dataset.page = f ? f.id : 'home'
    body.dataset.kind = kindOf(f)
    if (f && LX.platforms[f.id]) body.dataset.tool = f.id
    else delete body.dataset.tool
    const kind = body.dataset.kind
    main.innerHTML = VIEWS[kind] || (f ? '<div id="page"></div><footer class="footer"><p>&copy; 2026 LixTik</p></footer>' : '<div id="hub" class="home-page"></div>')
    if (push) history.pushState({ lx: true }, '', path)
    document.title = f ? `${f.pageTitle || f.title} - ${LX.config.name}` : `${LX.config.name}`
    window.scrollTo(0, 0)
    LX.boot()
    return true
  }

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const a = e.target.closest('a[href]')
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return
    const href = a.getAttribute('href')
    if (!href || !href.startsWith('/') || href.startsWith('//')) return
    const path = href.split(/[?#]/)[0] || '/'
    if (path === location.pathname) return
    if (render(path, true)) e.preventDefault()
  })

  window.addEventListener('popstate', () => {
    render(location.pathname, false)
  })
})()
