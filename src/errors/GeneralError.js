const { nanoid } = require('nanoid')

class GeneralError extends Error {
  constructor (message, code = 500) {
    super()
    this.message = message
    this.code = code
    this.id = nanoid()
  }

  toString () {
    return `${this.id} - ${this.message} - ${this.code}`
  }
}

module.exports = GeneralError
