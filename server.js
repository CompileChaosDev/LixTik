const express = require('express')
const path = require('path')
const handler = require('./lib/handler')
const fileHandler = require('./lib/file')
const fakeLobbyHandler = require('./lib/fakelobyff').handler

const app = express()

// extensions: /tiktok otomatis membuka public/tiktok.html
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }))
app.get('/api/download', handler)
app.get('/api/file', fileHandler)
app.get('/api/fakelobyff', fakeLobbyHandler)

app.listen(process.env.PORT || 3000, () => {
  console.log('Jalan di http://localhost:' + (process.env.PORT || 3000))
})
