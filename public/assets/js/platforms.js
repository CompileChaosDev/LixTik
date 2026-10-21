// Pengaturan khusus fitur downloader. Satu entri per platform.
// Kunci (tiktok, instagram, ...) harus sama dengan id di features.js.
window.LX = window.LX || {}

LX.platforms = {
  tiktok: {
    name: 'TikTok',
    title: 'TikTok Downloader',
    subtitle: 'Simpan video TikTok tanpa watermark, atau ambil suaranya saja.',
    hint: 'Hasil tanpa watermark. Pilih MP4 atau MP3.',
    placeholder: 'Tempel link TikTok',
    pattern: /tiktok\.com/i,
    path: '/tiktok',
    steps: [
      'Buka videonya di TikTok, ketuk <b>Bagikan</b>, lalu <b>Salin tautan</b>.',
      'Tempel linknya di kolom di atas (atau ketuk <b>Paste</b>).',
      'Ketuk <b>Download</b> dan tunggu beberapa detik sampai hasilnya muncul.',
      'Pilih <b>MP4</b> untuk video tanpa watermark (pilih HD kalau ada), atau <b>MP3</b> untuk suaranya saja.'
    ],
    note: 'Postingan foto tampil sebagai slider. Geser, lalu simpan satu foto atau semuanya dalam ZIP.'
  },
  instagram: {
    name: 'Instagram',
    title: 'Instagram Downloader',
    subtitle: 'Simpan reel, video, dan foto dari postingan Instagram.',
    hint: 'Untuk postingan dan reel dari akun publik.',
    placeholder: 'Tempel link Instagram',
    pattern: /instagram\.com/i,
    path: '/instagram',
    steps: [
      'Buka postingan atau reel dari akun yang <b>tidak dikunci</b>. Ketuk ikon kirim atau titik tiga, lalu <b>Salin link</b>.',
      'Tempel linknya di kolom di atas, lalu ketuk <b>Download</b>.',
      'Pilih video atau foto yang mau disimpan.'
    ],
    note: 'Postingan dengan banyak foto tampil sebagai slider, sama seperti TikTok.'
  },
  pinterest: {
    name: 'Pinterest',
    title: 'Pinterest Downloader',
    subtitle: 'Simpan video dan gambar kualitas asli dari Pinterest.',
    hint: 'Link pendek pin.it juga bisa.',
    placeholder: 'Tempel link Pinterest',
    pattern: /pinterest\.|pin\.it/i,
    path: '/pinterest',
    steps: [
      'Buka pin-nya, ketuk <b>Bagikan</b>, lalu <b>Salin link</b>.',
      'Tempel linknya di kolom di atas, lalu ketuk <b>Download</b>.',
      'Simpan videonya atau gambar kualitas aslinya.'
    ],
    note: ''
  },
  youtube: {
    name: 'YouTube',
    title: 'YouTube Downloader',
    subtitle: 'Simpan video atau audio dari YouTube.',
    hint: 'Video publik. Link youtu.be juga bisa.',
    placeholder: 'Tempel link YouTube',
    pattern: /youtube\.com|youtu\.be/i,
    path: '/youtube',
    steps: [
      'Buka postingan atau halamannya di YouTube, lalu salin link-nya.',
      'Tempel linknya di kolom di atas, lalu ketuk <b>Download</b>.',
      'Pilih format yang kamu mau, lalu simpan ke perangkat.'
    ],
    note: 'Video panjang butuh waktu lebih lama. Kalau gagal, coba lagi beberapa saat kemudian.'
  },
  twitter: {
    name: 'Twitter / X',
    title: 'Twitter / X Downloader',
    subtitle: 'Simpan video dan gambar dari postingan Twitter atau X.',
    hint: 'Untuk postingan publik.',
    placeholder: 'Tempel link Twitter atau X',
    pattern: /(^|[\/.])(twitter|x)\.com/i,
    path: '/twitter',
    steps: [
      'Buka postingan atau halamannya di Twitter / X, lalu salin link-nya.',
      'Tempel linknya di kolom di atas, lalu ketuk <b>Download</b>.',
      'Pilih format yang kamu mau, lalu simpan ke perangkat.'
    ],
    note: 'Postingan yang hanya berisi teks tidak punya media untuk diunduh.'
  },
  facebook: {
    name: 'Facebook',
    title: 'Facebook Downloader',
    subtitle: 'Simpan video dari postingan Facebook.',
    hint: 'Untuk video dan Reel publik. Link fb.watch juga bisa.',
    placeholder: 'Tempel link Facebook',
    pattern: /facebook\.com|fb\.watch/i,
    path: '/facebook',
    steps: [
      'Buka postingan atau halamannya di Facebook, lalu salin link-nya.',
      'Tempel linknya di kolom di atas, lalu ketuk <b>Download</b>.',
      'Pilih format yang kamu mau, lalu simpan ke perangkat.'
    ],
    note: 'Video dari grup atau akun yang dikunci tidak bisa diunduh.'
  },
  spotify: {
    name: 'Spotify',
    title: 'Spotify Downloader',
    subtitle: 'Ambil audio lagu, album, atau playlist Spotify.',
    hint: 'Hasilnya berupa MP3.',
    placeholder: 'Tempel link Spotify',
    pattern: /spotify\.com/i,
    path: '/spotify',
    steps: [
      'Buka postingan atau halamannya di Spotify, lalu salin link-nya.',
      'Tempel linknya di kolom di atas, lalu ketuk <b>Download</b>.',
      'Pilih format yang kamu mau, lalu simpan ke perangkat.'
    ],
    note: 'Ini hanya mengambil audio, bukan video.'
  },
  bandcamp: {
    name: 'Bandcamp',
    title: 'Bandcamp Downloader',
    subtitle: 'Ambil audio dari lagu atau album Bandcamp.',
    hint: 'Hasilnya berupa MP3.',
    placeholder: 'Tempel link Bandcamp',
    pattern: /bandcamp\.com/i,
    path: '/bandcamp',
    steps: [
      'Buka postingan atau halamannya di Bandcamp, lalu salin link-nya.',
      'Tempel linknya di kolom di atas, lalu ketuk <b>Download</b>.',
      'Pilih format yang kamu mau, lalu simpan ke perangkat.'
    ],
    note: 'Ini hanya mengambil audio, bukan video.'
  },
  pixiv: {
    name: 'Pixiv',
    title: 'Pixiv Downloader',
    subtitle: 'Simpan gambar kualitas asli dari Pixiv.',
    hint: 'Untuk karya publik.',
    placeholder: 'Tempel link Pixiv',
    pattern: /pixiv\.net/i,
    path: '/pixiv',
    steps: [
      'Buka postingan atau halamannya di Pixiv, lalu salin link-nya.',
      'Tempel linknya di kolom di atas, lalu ketuk <b>Download</b>.',
      'Pilih format yang kamu mau, lalu simpan ke perangkat.'
    ],
    note: 'Karya yang dikunci atau khusus dewasa tidak bisa diunduh.'
  },
  threads: {
    name: 'Threads',
    title: 'Threads Downloader',
    subtitle: 'Simpan video dan gambar dari postingan Threads.',
    hint: 'Untuk postingan publik.',
    placeholder: 'Tempel link Threads',
    pattern: /threads\.(net|com)/i,
    path: '/threads',
    steps: [
      'Buka postingan atau halamannya di Threads, lalu salin link-nya.',
      'Tempel linknya di kolom di atas, lalu ketuk <b>Download</b>.',
      'Pilih format yang kamu mau, lalu simpan ke perangkat.'
    ],
    note: 'Postingan yang hanya berisi teks tidak punya media untuk diunduh.'
  }
}

// Cari platform dari sebuah link. Hasilnya id platform, atau null.
LX.detectPlatform = (link) =>
  Object.keys(LX.platforms).find((id) => LX.platforms[id].pattern.test(link)) || null
