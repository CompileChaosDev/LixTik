// Sumber scraper dari library scrapr (MIT, lihat LICENSE di folder ini).
// Hanya modul yang bisa jalan di Vercel (tanpa browser). Modul browser
// (fdown, snapinsta, savetik) sengaja tidak dimuat.
const bandcampDirect = require('./bandcamp/direct').scrape
const bandcampAlbum = require('./bandcamp/bandcampdownloader').scrape
const pixiv = require('./pixiv/ajax').scrape
const spotify = require('./spotify')
const threads = require('./threads/threadster').scrape
const twitter = require('./twitter')
const twitterSyndication = require('./twitter/syndication').scrape
const youtube = require('./youtube')
const youtubeInnertube = require('./youtube/innertube').scrape
const facebookFdown = require('./facebook/fdown').scrape
const facebookSnapsave = require('./facebook/snapsave').scrape

// Urutan = prioritas. Kalau satu gagal, otomatis pindah ke berikutnya.
const SCRAPR_PROVIDERS = {
  youtube: [youtubeInnertube, youtube.ytmp3gg, (u) => youtube.ytmp3.scrape(u, 'mp4'), (u) => youtube.ytmp3.scrape(u, 'mp3')],
  twitter: [twitterSyndication, twitter.direct, twitter.tvd, twitter.savetwt, twitter.tweeload],
  facebook: [facebookFdown, facebookSnapsave],
  spotify: [spotify.spotmate, spotify.spotidown, spotify.soundloaders, spotify.spotisaver],
  bandcamp: [bandcampDirect, bandcampAlbum],
  pixiv: [pixiv],
  threads: [threads]
}

module.exports = { SCRAPR_PROVIDERS }
