// Pengaturan khusus fitur downloader.
// Satu entri untuk setiap platform.
window.LX = window.LX || {}

LX.platforms = {
  tiktok: {
    name: 'TikTok',
    title: 'TikTok Downloader',
    subtitle: 'Simpan video TikTok atau ambil audionya.',
    hint: 'Pilih MP4 untuk video atau MP3 untuk audio jika tersedia.',
    placeholder: 'Tempel link TikTok di sini',
    pattern: /tiktok\.com/i,
    path: '/tiktok',
    steps: [
      'Buka TikTok dan pilih video yang ingin kamu simpan.',
      'Ketuk <b>Bagikan</b>, lalu pilih <b>Salin tautan</b>.',
      'Tempel tautan ke kolom di atas, lalu ketuk <b>Download</b>.',
      'Pilih MP4 untuk video atau MP3 untuk audio jika tersedia.'
    ],
  },

  instagram: {
    name: 'Instagram',
    title: 'Instagram Downloader',
    subtitle: 'Simpan Reel, video, dan foto dari Instagram.',
    hint: 'Gunakan tautan postingan dari akun publik.',
    placeholder: 'Tempel link Instagram di sini',
    pattern: /instagram\.com/i,
    path: '/instagram',
    steps: [
      'Buka Reel, video, atau foto yang ingin kamu simpan.',
      'Ketuk <b>Bagikan</b> atau menu <b>titik tiga</b>, lalu pilih <b>Salin tautan</b>.',
      'Tempel tautan ke kolom di atas, lalu ketuk <b>Download</b>.',
      'Pilih foto atau video yang ingin kamu simpan jika tersedia.'
    ],
  },

  pinterest: {
    name: 'Pinterest',
    title: 'Pinterest Downloader',
    subtitle: 'Simpan gambar dan video dari Pinterest.',
    hint: 'Tautan pin.it juga didukung.',
    placeholder: 'Tempel link Pinterest di sini',
    pattern: /pinterest\.|pin\.it/i,
    path: '/pinterest',
    steps: [
      'Buka Pinterest dan pilih pin yang ingin kamu simpan.',
      'Ketuk <b>Bagikan</b>, lalu pilih <b>Salin tautan</b>.',
      'Tempel tautan ke kolom di atas, lalu ketuk <b>Download</b>.',
      'Pilih gambar atau video yang tersedia untuk disimpan.'
    ],
  },

  youtube: {
    name: 'YouTube',
    title: 'YouTube Downloader',
    subtitle: 'Simpan video atau audio dari YouTube.',
    hint: 'Tautan youtube.com dan youtu.be didukung.',
    placeholder: 'Tempel link YouTube di sini',
    pattern: /youtube\.com|youtu\.be/i,
    path: '/youtube',
    steps: [
      'Buka video YouTube yang ingin kamu simpan.',
      'Ketuk <b>Bagikan</b>, lalu pilih <b>Salin link</b>.',
      'Tempel link ke kolom di atas, lalu ketuk <b>Download</b>.',
      'Pilih format yang tersedia untuk menyimpan hasilnya.'
    ],
  },

  twitter: {
    name: 'Twitter / X',
    title: 'Twitter / X Downloader',
    subtitle: 'Simpan video dan gambar dari Twitter atau X.',
    hint: 'Gunakan tautan postingan yang dapat diakses.',
    placeholder: 'Tempel link Twitter atau X di sini',
    pattern: /(^|[\/.])(twitter|x)\.com/i,
    path: '/twitter',
    steps: [
      'Buka postingan Twitter atau X yang ingin kamu simpan.',
      'Ketuk <b>Bagikan</b>, lalu pilih <b>Salin tautan</b>.',
      'Tempel tautan ke kolom di atas, lalu ketuk <b>Download</b>.',
      'Pilih video atau gambar yang tersedia untuk disimpan.'
    ],
  },

  facebook: {
    name: 'Facebook',
    title: 'Facebook Downloader',
    subtitle: 'Simpan video dan Reel dari Facebook.',
    hint: 'Tautan facebook.com dan fb.watch didukung.',
    placeholder: 'Tempel link Facebook di sini',
    pattern: /facebook\.com|fb\.watch/i,
    path: '/facebook',
    steps: [
      'Buka video atau Reel Facebook yang ingin kamu simpan.',
      'Ketuk <b>Bagikan</b> atau menu <b>titik tiga</b>, lalu pilih <b>Salin tautan</b>.',
      'Tempel tautan ke kolom di atas, lalu ketuk <b>Download</b>.',
      'Pilih video yang tersedia, lalu simpan ke perangkat.'
    ],
  },

  spotify: {
    name: 'Spotify',
    title: 'Spotify Downloader',
    subtitle: 'Proses tautan lagu, album, atau playlist Spotify.',
    hint: 'Format hasil mengikuti dukungan layanan.',
    placeholder: 'Tempel link Spotify di sini',
    pattern: /spotify\.com/i,
    path: '/spotify',
    steps: [
      'Buka lagu, album, atau playlist yang ingin kamu proses.',
      'Ketuk menu <b>titik tiga</b>, pilih <b>Bagikan</b>, lalu <b>Salin link</b>.',
      'Tempel link ke kolom di atas, lalu ketuk <b>Download</b>.',
      'Ikuti pilihan yang muncul untuk melihat hasil yang tersedia.'
    ],
  },

  bandcamp: {
    name: 'Bandcamp',
    title: 'Bandcamp Downloader',
    subtitle: 'Proses tautan lagu dan album Bandcamp.',
    hint: 'Hasil mengikuti dukungan sumber dan layanan.',
    placeholder: 'Tempel link Bandcamp di sini',
    pattern: /bandcamp\.com/i,
    path: '/bandcamp',
    steps: [
      'Buka halaman lagu atau album Bandcamp yang ingin kamu proses.',
      'Salin tautan halaman tersebut.',
      'Tempel tautan ke kolom di atas, lalu ketuk <b>Download</b>.',
      'Pilih hasil yang tersedia untuk melanjutkan.'
    ],
  },

  pixiv: {
    name: 'Pixiv',
    title: 'Pixiv Downloader',
    subtitle: 'Simpan karya gambar dari Pixiv.',
    hint: 'Gunakan tautan karya yang dapat diakses.',
    placeholder: 'Tempel link Pixiv di sini',
    pattern: /pixiv\.net/i,
    path: '/pixiv',
    steps: [
      'Buka karya Pixiv yang ingin kamu simpan.',
      'Salin tautan halaman karya tersebut.',
      'Tempel tautan ke kolom di atas, lalu ketuk <b>Download</b>.',
      'Pilih gambar yang tersedia untuk disimpan.'
    ],
  },

  threads: {
    name: 'Threads',
    title: 'Threads Downloader',
    subtitle: 'Simpan video dan gambar dari Threads.',
    hint: 'Gunakan tautan postingan yang dapat diakses.',
    placeholder: 'Tempel link Threads di sini',
    pattern: /threads\.(net|com)/i,
    path: '/threads',
    steps: [
      'Buka postingan Threads yang ingin kamu simpan.',
      'Ketuk <b>Bagikan</b>, lalu pilih <b>Salin tautan</b>.',
      'Tempel tautan ke kolom di atas, lalu ketuk <b>Download</b>.',
      'Pilih media yang tersedia untuk disimpan ke perangkat.'
    ],
  }
}

LX.detectPlatform = (link) => {
  const url = String(link || '').trim()

  return Object.keys(LX.platforms).find((id) => {
    return LX.platforms[id].pattern.test(url)
  }) || null
}