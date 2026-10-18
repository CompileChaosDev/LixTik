// Kumpulan ikon. Tambah ikon baru di sini, lalu pakai lewat LX.icons.namaIkon
window.LX = window.LX || {}

const svg = (body) => `<svg viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`

LX.icons = {
  home: svg('<path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>'),
  clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  book: svg('<path d="M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3z"/><path d="M5 17a3 3 0 013-3h11"/>'),
  whatsapp: svg('<path d="M4 20l1.4-4.2A8.5 8.5 0 1 1 8.4 18.8z"/><path d="M9.2 9.2c0 3 2.6 5.6 5.6 5.6l1.1-1.3-2-1-.9.7c-.8-.3-1.7-1.2-2-2l.7-.9-1-2z"/>'),
  tiktok: svg('<path d="M14 3v11.5a3.5 3.5 0 11-3.5-3.5"/><path d="M14 3c.4 2.6 2.1 4.2 5 4.4"/>'),
  instagram: svg('<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.2 6.8h.01"/>'),
  pinterest: svg('<circle cx="12" cy="12" r="9"/><path d="M12 21l1.2-5.6"/><path d="M9.2 13c-1-2.2.2-5.5 3.3-5.5 2.4 0 3.5 1.7 3.2 3.6-.3 2-1.5 3.3-3 3.1-.8-.1-1.2-.8-1.3-1.5"/>'),
  youtube: svg('<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="M10 9.5v5l4.5-2.5z"/>'),
  twitter: svg('<path d="M4 4l16 16M20 4L4 20"/>'),
  facebook: svg('<path d="M15 4h-2.5A3.5 3.5 0 009 7.5V10H7v3h2v7h3v-7h2.5l.5-3H12V7.5c0-.3.2-.5.5-.5H15z"/>'),
  spotify: svg('<circle cx="12" cy="12" r="9"/><path d="M7.5 9.5c3-1 6.5-.7 9 .8M8 12.6c2.5-.8 5.3-.5 7.3.7M8.5 15.5c2-.6 4-.4 5.7.6"/>'),
  soundcloud: svg('<path d="M6 16.5h11.5a3.5 3.5 0 000-7 5 5 0 00-9.6 1.5A3 3 0 006 16.5z"/><path d="M3.5 15.5v-2M5 16v-3"/>'),
  applemusic: svg('<path d="M9 17.5V6l10-2v11.5"/><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="15.5" r="2.5"/>'),
  bilibili: svg('<rect x="3.5" y="7.5" width="17" height="12" rx="3"/><path d="M9 4.5L11 7.5M15 4.5L13 7.5M9 12.5v2M15 12.5v2"/>'),
  douyin: svg('<path d="M13 4v11.5a3.5 3.5 0 11-3.5-3.5"/><path d="M13 4c.5 2.5 2.2 4 5 4.2M4.5 9.5c1.5-1.2 2.5-1.2 3.5 0M19.5 9.5c-1.5-1.2-2.5-1.2-3.5 0"/>'),
  bandcamp: svg('<path d="M7 6.5h13l-6 11H1z" transform="translate(1.5 0)"/>'),
  pixiv: svg('<path d="M8 20V4h4.5a4 4 0 010 8H8"/>'),
  reddit: svg('<circle cx="12" cy="13.5" r="7.5"/><circle cx="9.5" cy="13" r=".8"/><circle cx="14.5" cy="13" r=".8"/><path d="M9 16.5c1.8 1.2 4.2 1.2 6 0M12.5 6l1-3 4 1"/>'),
  rednote: svg('<path d="M5 19c0-8 4-13 14-14-.5 9-4.5 14-12 14"/><path d="M5 19l6-6"/>'),
  terabox: svg('<path d="M12 3.5l8 4.5v8.5l-8 4.5-8-4.5V8z"/><path d="M4 8l8 4.5 8-4.5M12 12.5V21"/>'),
  threads: svg('<path d="M16.5 11.5c-.5-2.6-2.2-4-4.5-4-2.8 0-4.5 2-4.5 4.5s1.7 4.5 4.5 4.5c2.3 0 3.8-1.2 4.2-3M16.5 11.5c.2 1.2 0 2.3-.9 2.9"/>'),
  download: svg('<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>'),
  trash: svg('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'),
  arrow: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  menu: svg('<path d="M4 9h16M4 15h16"/>'),
  close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  check: svg('<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><path d="M8 12.5l3 3 5-6"/>'),
  grid: svg('<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>')
}
