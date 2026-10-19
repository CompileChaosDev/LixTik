// Sumber scraper dari library scrapr (MIT, lihat LICENSE di folder ini).
// Hanya modul yang bisa jalan di Vercel (tanpa browser). Modul browser
// (fdown, snapinsta, savetik) sengaja tidak dimuat.
const applemusic = require('./applemusic/aplmate').scrape
const bandcampDirect = require('./bandcamp/direct').scrape
const bandcampAlbum = require('./bandcamp/bandcampdownloader').scrape
const bilibili = require('./bilibili/direct').scrape
const douyin = require('./douyin/direct').scrape
const pixiv = require('./pixiv/ajax').scrape
const reddit = require('./reddit/rapidsave').scrape
const rednote = require('./rednote/direct').scrape
const soundcloud = require('./soundcloud/klickaud').scrape
const spotify = require('./spotify')
const terabox = require('./terabox/sechno').scrape
const threads = require('./threads/threadster').scrape
const twitter = require('./twitter')
const twitterSyndication = require('./twitter/syndication').scrape
const youtube = require('./youtube')
const youtubeInnertube = require('./youtube/innertube').scrape
const facebookFdown = require('./facebook/fdown').scrape
const facebookSnapsave = require('./facebook/snapsave').scrape

// Urutan = prioritas. Kalau satu gagal, otomatis pindah ke berikutnya.
const SCRAPR_PROVIDERS = {
  youtube: [youtubeInnertube, youtube.ytmp3gg, youtube.ytmp3],
  twitter: [twitterSyndication, twitter.direct, twitter.tvd, twitter.savetwt, twitter.tweeload],
  facebook: [facebookFdown, facebookSnapsave],
  spotify: [spotify.spotmate, spotify.spotidown, spotify.soundloaders, spotify.spotisaver],
  soundcloud: [soundcloud],
  applemusic: [applemusic],
  bilibili: [bilibili],
  douyin: [douyin],
  bandcamp: [bandcampDirect, bandcampAlbum],
  pixiv: [pixiv],
  reddit: [reddit],
  rednote: [rednote],
  terabox: [terabox],
  threads: [threads]
}

module.exports = { SCRAPR_PROVIDERS }
