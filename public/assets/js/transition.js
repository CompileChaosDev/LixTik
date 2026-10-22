// Transisi antar halaman: intro tas + nama situs (nama dibaca dari config.js).
// Dimuat sinkron di <head> supaya overlay sudah ada sejak frame pertama halaman baru.
//
// Alur:
//  1. Halaman lama: klik link internal -> overlay masuk (fade + tas geser + nama naik) -> pindah halaman.
//  2. Halaman baru: overlay langsung tampil dalam keadaan akhir (tanpa memutar ulang animasi),
//     lalu memudar setelah halaman siap. Semua langkah punya batas waktu, tidak menunggu tanpa akhir.
window.LX = window.LX || {}

;(function () {
  const SEEN_KEY = 'lx_intro_seen_v1'
  const INTRO_MS = 2250
  const EXIT_MS = 320

  const root = document.documentElement
  const reduce = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches
  const siteName = () => (window.LX && LX.config && LX.config.name) || 'LIXX SHOP'
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

  const markup = () => `
    <div class="lx-tr-stage" aria-hidden="true">
      <svg class="lx-tr-layer lx-tr-bag" viewBox="0 0 540 470" xmlns="http://www.w3.org/2000/svg" focusable="false">
        <g fill="none" stroke="#082239" stroke-width="11" stroke-linecap="round" stroke-linejoin="round">
          <path d="M48 340 L75 126 Q76 117 86 117 H275 L299 340 Z" />
          <path d="M126 139 L139 340 M250 139 L263 340" stroke-width="7" opacity=".85"/>
          <path d="M132 123 L143 69 Q150 32 184 32 Q218 32 225 69 L236 123"/>
        </g>
        <g fill="none" stroke="#082239" stroke-width="9" stroke-linecap="round" stroke-linejoin="round">
          <path d="M263 178 H421 Q433 178 429 192 L410 266 Q407 277 394 277 H291 Q280 277 277 266 L258 194"/>
          <path d="M288 210 H419 M293 232 H413 M299 254 H407" stroke-width="6"/>
          <path d="M302 210 L310 267 M338 210 L342 272 M374 210 V272 M408 210 L398 267" stroke-width="5"/>
          <path d="M289 306 H408 M314 306 V325 M383 306 V325" stroke-width="9"/>
          <circle cx="314" cy="340" r="14" fill="#082239" stroke="none"/>
          <circle cx="383" cy="340" r="14" fill="#082239" stroke="none"/>
        </g>
      </svg>
      <svg class="lx-tr-layer lx-tr-brand" viewBox="0 0 540 470" xmlns="http://www.w3.org/2000/svg" focusable="false">
        <text x="270" y="420" text-anchor="middle" font-family="Poppins, Arial, Helvetica, sans-serif" font-size="45" font-weight="800" letter-spacing="2" fill="#082239">${esc(siteName())}</text>
      </svg>
    </div>`

  let el = null
  let exitTimer = 0

  function remove() {
    clearTimeout(exitTimer)
    if (el && el.parentNode) el.parentNode.removeChild(el)
    el = null
    root.classList.remove('lx-tr-on')
  }

  function build() {
    remove()
    el = document.createElement('div')
    el.id = 'lx-transition'
    el.className = 'is-entering'
    el.setAttribute('aria-hidden', 'true')
    el.innerHTML = markup()
    root.appendChild(el)
    root.classList.add('lx-tr-on')
  }

  function exit() {
    if (!el) return
    const node = el
    node.classList.add('is-exiting')
    exitTimer = setTimeout(() => {
      if (el === node) remove()
      else if (node.parentNode) node.parentNode.removeChild(node)
    }, EXIT_MS + 100)
  }

  // Navigasi biasa: intro tidak ikut dipasang ulang pada setiap halaman.
  // LX.go tetap tersedia untuk fitur lama yang memanggilnya.
  LX.go = (href) => { if (href) location.href = href }

  function firstVisitIntro() {
    let seen = false
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === '1'
      if (!seen) sessionStorage.setItem(SEEN_KEY, '1')
    } catch (err) {
      // Jika storage diblokir, tetap tampilkan intro sekali pada dokumen ini.
    }
    if (seen || reduce()) return
    build()
    const finish = () => exit()
    const fontsReady = document.fonts && document.fonts.ready
      ? Promise.race([document.fonts.ready.catch(() => {}), new Promise(resolve => setTimeout(resolve, 500))])
      : Promise.resolve()
    const pageReady = document.readyState === 'complete'
      ? Promise.resolve()
      : new Promise(resolve => window.addEventListener('load', resolve, { once: true }))
    Promise.all([fontsReady, pageReady]).then(() => {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const elapsed = performance.now()
        const remaining = Math.max(350, INTRO_MS - elapsed)
        setTimeout(finish, remaining)
      }))
    })
    // Safety net: intro tidak boleh menutupi halaman terlalu lama.
    setTimeout(finish, 3200)
  }

  if (document.prerendering) document.addEventListener('prerenderingchange', firstVisitIntro, { once: true })
  else firstVisitIntro()

  // Bersihkan overlay jika halaman dipulihkan dari back-forward cache.
  window.addEventListener('pageshow', (event) => { if (event.persisted) remove() })
})()
