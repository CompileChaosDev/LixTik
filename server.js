const express = require('express')
const path = require('path')
const handler = require('./lib/handler')
const fileHandler = require('./lib/file')
const spotifyTrackHandler = require('./lib/spotify-track').handler
const spotifyCoverHandler = require('./lib/spotify-cover').handler

const app = express()

// extensions: /tiktok otomatis membuka public/tiktok.html
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets'), { maxAge: '1h' }))
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }))
app.get('/api/download', handler)
app.get('/api/file', fileHandler)
app.get('/api/spotify-track', spotifyTrackHandler)
app.get('/api/spotify-cover', spotifyCoverHandler)

app.listen(process.env.PORT || 3000, () => {
  console.log('Jalan di http://localhost:' + (process.env.PORT || 3000))
})
