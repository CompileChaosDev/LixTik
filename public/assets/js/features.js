// DAFTAR FITUR: satu-satunya tempat yang perlu diubah untuk menambah fitur baru.
// Homepage, menu samping, dan halaman lain membaca daftar ini secara otomatis.
//
// Cara menambah fitur: lihat README.md bagian "Menambah fitur baru".
window.LX = window.LX || {}

// Kelompok di homepage dan menu. Urutan di sini = urutan tampil.
LX.groups = [
  { id: 'downloader', title: 'Downloader', desc: 'Simpan video dan foto dari media sosial.' },
  { id: 'lainnya', title: 'Lainnya', desc: 'Riwayat dan bantuan.' }
  // { id: 'alat', title: 'Alat', desc: 'Kumpulan alat bantu.' },
]

// id = nama file halaman dan nilai data-page di <body>.
// path = alamat halaman. icon = nama ikon dari icons.js.
// soon: true menampilkan kartu "Segera" yang belum bisa dibuka.
LX.features = [
  { id: 'tiktok', group: 'downloader', title: 'TikTok', pageTitle: 'TikTok Downloader',
    desc: 'Video tanpa watermark, MP3, dan slideshow foto.', path: '/tiktok', icon: 'tiktok', color: '#38bdf8' },
  { id: 'instagram', group: 'downloader', title: 'Instagram', pageTitle: 'Instagram Downloader',
    desc: 'Reel, video, dan foto dari postingan publik.', path: '/instagram', icon: 'instagram', color: '#60a5fa' },
  { id: 'pinterest', group: 'downloader', title: 'Pinterest', pageTitle: 'Pinterest Downloader',
    desc: 'Video dan gambar kualitas asli dari pin.', path: '/pinterest', icon: 'pinterest', color: '#3b82f6' },
  { id: 'youtube', group: 'downloader', title: 'YouTube', pageTitle: 'YouTube Downloader',
    desc: 'Simpan video atau audio dari YouTube.', path: '/youtube', icon: 'youtube', color: '#ef4444' },
  { id: 'twitter', group: 'downloader', title: 'Twitter / X', pageTitle: 'Twitter / X Downloader',
    desc: 'Simpan video dan gambar dari postingan Twitter atau X.', path: '/twitter', icon: 'twitter', color: '#38bdf8' },
  { id: 'facebook', group: 'downloader', title: 'Facebook', pageTitle: 'Facebook Downloader',
    desc: 'Simpan video dari postingan Facebook.', path: '/facebook', icon: 'facebook', color: '#3b82f6' },
  { id: 'spotify', group: 'downloader', title: 'Spotify', pageTitle: 'Spotify Downloader',
    desc: 'Ambil audio lagu, album, atau playlist Spotify.', path: '/spotify', icon: 'spotify', color: '#22c55e' },
  { id: 'bandcamp', group: 'downloader', title: 'Bandcamp', pageTitle: 'Bandcamp Downloader',
    desc: 'Ambil audio dari lagu atau album Bandcamp.', path: '/bandcamp', icon: 'bandcamp', color: '#1d4ed8' },
  { id: 'pixiv', group: 'downloader', title: 'Pixiv', pageTitle: 'Pixiv Downloader',
    desc: 'Simpan gambar kualitas asli dari Pixiv.', path: '/pixiv', icon: 'pixiv', color: '#0284c7' },
  { id: 'reddit', group: 'downloader', title: 'Reddit', pageTitle: 'Reddit Downloader',
    desc: 'Simpan video dari postingan Reddit.', path: '/reddit', icon: 'reddit', color: '#f43f5e' },
  { id: 'rednote', group: 'downloader', title: 'RedNote', pageTitle: 'RedNote Downloader',
    desc: 'Simpan video dan gambar dari RedNote (Xiaohongshu).', path: '/rednote', icon: 'rednote', color: '#ef4444' },
  { id: 'terabox', group: 'downloader', title: 'TeraBox', pageTitle: 'TeraBox Downloader',
    desc: 'Ambil file dari link TeraBox yang dibagikan publik.', path: '/terabox', icon: 'terabox', color: '#2563eb' },
  { id: 'threads', group: 'downloader', title: 'Threads', pageTitle: 'Threads Downloader',
    desc: 'Simpan video dan gambar dari postingan Threads.', path: '/threads', icon: 'threads', color: '#1f2937' },

  { id: 'history', group: 'lainnya', title: 'History', pageTitle: 'History',
    desc: 'Daftar yang pernah kamu download.', path: '/history', icon: 'clock', color: '#93c5fd' },
  { id: 'panduan', group: 'lainnya', title: 'Panduan', pageTitle: 'Panduan',
    desc: 'Cara pakai dan solusi kalau ada masalah.', path: '/panduan', icon: 'book', color: '#7dd3fc' }
]

LX.featureById = (id) => LX.features.find((f) => f.id === id)
LX.featuresIn = (group) => LX.features.filter((f) => f.group === group && !f.hidden)
