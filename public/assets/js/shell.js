// Kerangka bersama semua halaman: menu samping, bar atas, toast, dan boot.
window.LX = window.LX || {}
LX.pages = {}

LX.$ = (id) => document.getElementById(id)
LX.isUrl = (text) => /^https?:\/\//i.test(String(text))

LX.escape = (text) => {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }
  return String(text).replace(/[&<>"]/g, (c) => map[c])
}

LX.params = () => new URLSearchParams(location.search)
LX.go = (href) => { location.href = href }

let toastTimer = null
LX.toast = (message) => {
  const toast = LX.$('toast')
  if (!toast) return
  toast.textContent = message
  toast.classList.add('show')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => toast.classList.remove('show'), 4500)
}

LX.openMenu = () => {
  document.body.classList.add('menu-open')
  const button = LX.$('menu-open')
  if (button) button.setAttribute('aria-expanded', 'true')
}

LX.closeMenu = () => {
  document.body.classList.remove('menu-open')
  const button = LX.$('menu-open')
  if (button) button.setAttribute('aria-expanded', 'false')
}

LX.brand = () => `
  <a class="brand" href="/">
    <svg class="logo-mark" viewBox="0 0 32 32" aria-hidden="true">
      <defs><linearGradient id="lixtik-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2563eb"/><stop offset="1" stop-color="#7db4ff"/></linearGradient></defs>
      <rect width="32" height="32" rx="9" fill="url(#lixtik-grad)"/>
      <path d="M16 7.5v12M11 14.8l5 5 5-5M9.5 24.5h13" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <span class="wordmark">${LX.config.name}</span>
  </a>`

LX.renderShell = (page) => {
  const link = (f) => `<a class="menu-link ${f.id === page ? 'active' : ''}" href="${f.path}" ${f.id === page ? 'aria-current="page"' : ''}>${LX.icons[f.icon] || ''}${f.title}</a>`

  const groups = LX.groups.map((g) => {
    const items = LX.featuresIn(g.id).filter((f) => !f.soon)
    return items.length ? `<p class="menu-label">${g.title}</p>${items.map(link).join('')}` : ''
  }).join('')

  LX.$('shell').innerHTML = `
    <header class="topbar">
      ${LX.brand()}
      <button class="icon-btn" id="menu-open" type="button" aria-label="Buka menu" aria-controls="sidebar" aria-expanded="false">${LX.icons.menu}</button>
    </header>
    <div class="overlay" id="overlay"></div>
    <aside class="sidebar" id="sidebar" aria-label="Menu utama">
      <div class="sidebar-head">
        ${LX.brand()}
        <button class="icon-btn close-btn" id="menu-close" type="button" aria-label="Tutup menu">${LX.icons.close}</button>
      </div>
      <nav class="menu">
        <a class="menu-link ${page === 'home' ? 'active' : ''}" href="/" ${page === 'home' ? 'aria-current="page"' : ''}>${LX.icons.home}Home</a>
        ${groups}
        <hr class="menu-line">
        <a class="menu-link menu-wa" href="#" data-channel="whatsapp" rel="noopener noreferrer">${LX.icons.whatsapp}Channel WhatsApp</a>
      </nav>
      <p class="sidebar-foot">Gratis, tanpa login.</p>
    </aside>`

  LX.$('menu-open').addEventListener('click', LX.openMenu)
  LX.$('menu-close').addEventListener('click', LX.closeMenu)
  LX.$('overlay').addEventListener('click', LX.closeMenu)
  document.querySelectorAll('#sidebar .menu-link').forEach((a) => a.addEventListener('click', LX.closeMenu))

  document.querySelectorAll('[data-channel]').forEach((a) => {
    const url = LX.config.whatsappUrl
    if (url) {
      a.href = url
      a.target = '_blank'
      return
    }
    a.addEventListener('click', (event) => {
      event.preventDefault()
      LX.toast('Link channel belum diisi di config.js.')
    })
  })
}

LX.boot = () => {
  const body = document.body
  const page = body.dataset.page || 'home'
  const kind = body.dataset.kind || page
  const feature = LX.featureById(page)

  LX.closeMenu()
  body.classList.toggle('home-neon', kind === 'home')
  document.title = feature ? `${feature.pageTitle || feature.title} - ${LX.config.name}` : `${LX.config.name} - Semua fitur dalam satu tempat`

  LX.renderShell(page)
  if (LX.pages[kind]) LX.pages[kind]()
  window.scrollTo(0, 0)
}

if (!LX._bound) {
  LX._bound = true
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') LX.closeMenu()
  })
}

// Halaman biasa: jalan otomatis. (Pratinjau memanggil LX.boot() sendiri.)
if (!LX.manualBoot) document.addEventListener('DOMContentLoaded', LX.boot)
