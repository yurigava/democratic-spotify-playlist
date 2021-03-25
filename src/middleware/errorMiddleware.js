const GeneralError = require('../errors/GeneralError')
const { WebapiError } = require('spotify-web-api-node/src/response-error')

function errorHandler (err, req, res, next) {
  console.log(err.stack)
  if (err instanceof GeneralError) {
    res.status(err.code).send({ message: err.message })
  } else if (err instanceof WebapiError) {
    res.status(err.statusCode).send(err.body)
  }
}

module.exports = errorHandler
