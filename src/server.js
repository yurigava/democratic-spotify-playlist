const express = require('express')
const cookies = require('cookie-parser')
const app = express()
const routes = require('./routes')

app.use(express.json())
app.use(cookies())
app.use('/', routes)
app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(err.code).send({ message: err.message })
})

const PORT = 8080

module.exports = app.listen(PORT, () => {
  console.log(`app listening on port: ${PORT}`)
})
