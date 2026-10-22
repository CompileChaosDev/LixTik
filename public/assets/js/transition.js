// Transisi antar halaman: intro tas + nama situs (nama dibaca dari config.js).
// Dimuat sinkron di <head> supaya overlay sudah ada sejak frame pertama halaman baru.
//
// Alur:
//  1. Halaman lama: klik link internal -> overlay masuk (fade + tas geser + nama naik) -> pindah halaman.
//  2. Halaman baru: overlay langsung tampil dalam keadaan akhir (tanpa memutar ulang animasi),
//     lalu memudar setelah halaman siap. Semua langkah punya batas waktu, tidak menunggu tanpa akhir.
window.LX = window.LX || {}

;(function () {
  const KEY = 'lx_tr'
  const INTRO_MS = 650       // total animasi intro (dihitung sejak klik, lintas halaman)
  const EXIT_MS = 260        // lama memudar
  const MAX_ON_NEW_MS = 2200 // batas keras overlay di halaman baru
  const LEAVE_GUARD_MS = 7000 // jika navigasi batal/gagal, overlay dilepas

  LX.TR_KEY = KEY

  const root = document.documentElement
  const reduce = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches
  const siteName = () => (window.LX && LX.config && LX.config.name) || ''
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

  // Dua SVG bertumpuk dengan viewBox sama: tas dan teks masing-masing jadi layer sendiri,
  // jadi animasinya berjalan di GPU (transform + opacity) dan bayangan tidak digambar ulang tiap frame.
  const markup = () => `
    <div class="lx-tr-stage">
      <svg class="lx-tr-layer lx-tr-bag" viewBox="0 0 540 470" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <defs><linearGradient id="lx-tr-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2563eb"/><stop offset="1" stop-color="#7db4ff"/></linearGradient></defs>
        <g transform="translate(170 40) scale(6.25)">
          <rect width="32" height="32" rx="9" fill="url(#lx-tr-grad)" stroke="none"/>
          <path d="M16 7.5v12M11 14.8l5 5 5-5M9.5 24.5h13" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
      </svg>
      <svg class="lx-tr-layer lx-tr-brand" viewBox="0 0 540 470" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <text x="270" y="420" text-anchor="middle" font-family="Poppins, Arial, Helvetica, sans-serif" font-size="45" font-weight="800" letter-spacing="2" fill="#082239">${esc(siteName())}</text>
      </svg>
    </div>`

  let el = null
  let gen = 0          // naik setiap overlay dibuat/dilepas; timer lama yang usang jadi tidak berlaku
  let chainStart = 0   // kapan intro yang sedang berjalan dimulai (lintas halaman)
  let leaving = false
  let guardTimer = 0
  let exitTimer = 0

  function build(mode) {
    remove()
    gen++
    el = document.createElement('div')
    el.id = 'lx-transition'
    el.className = mode // 'is-entering' (animasi masuk) | 'is-static' (sudah di posisi akhir)
    el.setAttribute('aria-hidden', 'true')
    el.innerHTML = markup()
    root.appendChild(el)
    root.classList.add('lx-tr-on')
  }

  function remove() {
    gen++
    clearTimeout(exitTimer)
    if (el && el.parentNode) el.parentNode.removeChild(el)
    el = null
    root.classList.remove('lx-tr-on')
  }

  // Memudar lalu dilepas. Tidak bergantung pada transitionend saja: ada timer cadangan.
  function exit(g) {
    if (!el || (g !== undefined && g !== gen)) return
    const node = el
    let done = false
    const finish = () => {
      if (done) return
      done = true
      if (el === node) remove()
      else if (node.parentNode) node.parentNode.removeChild(node)
    }
    node.classList.add('is-exiting')
    node.addEventListener('transitionend', finish, { once: true })
    exitTimer = setTimeout(finish, EXIT_MS + 120)
  }

  function reset() {
    leaving = false
    clearTimeout(guardTimer)
    try { sessionStorage.removeItem(KEY) } catch (err) {}
    remove()
  }

  // ---- Halaman lama: keluar ----
  // Navigasi dimulai langsung saat klik (halaman tujuan dimuat sambil intro berjalan).
  // Waktu klik disimpan supaya halaman baru melanjutkan intro di titik yang sama.
  LX.go = (href) => {
    if (leaving) return
    if (reduce()) { location.href = href; return }
    leaving = true
    // Kalau overlay sedang tampil (klik beruntun saat halaman baru baru terbuka), sambung saja, jangan mulai ulang.
    const keep = el && !el.classList.contains('is-exiting')
    const start = keep && chainStart ? chainStart : Date.now()
    chainStart = start
    try { sessionStorage.setItem(KEY, String(start)) } catch (err) {}
    if (keep) gen++              // batalkan timer 'tutup' milik halaman ini
    else build('is-entering')
    clearTimeout(guardTimer)
    guardTimer = setTimeout(reset, LEAVE_GUARD_MS)
    location.href = href
  }

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const a = e.target.closest && e.target.closest('a[href]')
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return
    const raw = a.getAttribute('href')
    if (!raw || raw.charAt(0) !== '/' || raw.charAt(1) === '/' || raw.indexOf('/api/') === 0) return
    let url
    try { url = new URL(a.href, location.href) } catch (err) { return }
    if (url.origin !== location.origin) return
    if (url.pathname === location.pathname && url.search === location.search) return // sama halaman / hanya hash
    e.preventDefault()
    LX.go(url.pathname + url.search + url.hash)
  })

  // ---- Halaman baru: masuk ----
  function arrive() {
    let stamp = ''
    try {
      stamp = sessionStorage.getItem(KEY) || ''
      sessionStorage.removeItem(KEY)
    } catch (err) {}
    if (!stamp || reduce()) return
    const sinceClick = Date.now() - Number(stamp)
    chainStart = Number(stamp)
    const elapsed = Math.min(Math.max(isFinite(sinceClick) ? sinceClick : INTRO_MS, 0), INTRO_MS)
    if (elapsed >= INTRO_MS) { build('is-static') } else {
      // lanjutkan animasi dari titik terakhir di halaman lama (delay negatif), tanpa lompat
      build('is-entering')
      el.style.setProperty('--lx-el', elapsed + 'ms')
    }
    const g = gen
    let closed = false
    const close = () => {
      if (closed || g !== gen) return
      closed = true
      const wait = Math.max(0, INTRO_MS - (Date.now() - chainStart))
      setTimeout(() => exit(g), wait)
    }
    // Siap = DOM selesai dibaca + dua frame berjalan (shell sudah dirender). Tidak menunggu gambar.
    // Tunggu juga gambar dan font awal supaya isi halaman tidak 'pop-in' setelah overlay hilang,
    // tapi dibatasi 700 ms agar tidak menahan layar kalau jaringan lambat.
    const loaded = new Promise((res) => {
      if (document.readyState === 'complete') res()
      else window.addEventListener('load', res, { once: true })
    })
    const fonts = document.fonts && document.fonts.ready ? document.fonts.ready.catch(() => {}) : Promise.resolve()
    const cap = new Promise((res) => setTimeout(res, 700))
    const ready = () => Promise.race([Promise.all([loaded, fonts]), cap]).then(() => requestAnimationFrame(() => requestAnimationFrame(close)))
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true })
    else ready()
    // Batas keras: apa pun yang terjadi, overlay lepas.
    setTimeout(() => exit(g), MAX_ON_NEW_MS)
  }

  // Halaman yang di-prerender baru dijalankan saat benar-benar dibuka.
  if (document.prerendering) document.addEventListener('prerenderingchange', arrive, { once: true })
  else arrive()

  // Tombol kembali/maju memakai bfcache: halaman dipulihkan apa adanya, jadi bersihkan overlay yang tertinggal.
  window.addEventListener('pageshow', (e) => { if (e.persisted) reset() })
  // Kalau tab disembunyikan saat transisi (pindah aplikasi), jangan biarkan state macet.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && leaving && el) {
      clearTimeout(guardTimer)
      guardTimer = setTimeout(reset, 1500)
    }
  })
})()
