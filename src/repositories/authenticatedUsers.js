
const authenticated = {}

function add (refreshToken, user) {
  authenticated[refreshToken] = user
}

function get (refreshToken) {
  return authenticated[refreshToken]
}

module.exports = {
  add,
  get
}
