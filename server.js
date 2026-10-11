const express = require('express')
const path = require('path')
const handler = require('./lib/handler')
const fileHandler = require('./lib/file')

const app = express()

app.use(express.static(path.join(__dirname, 'public')))
app.get('/api/download', handler)
app.get('/api/file', fileHandler)

app.listen(process.env.PORT || 3000, () => {
  console.log('Jalan di http://localhost:' + (process.env.PORT || 3000))
})
