
const managedPlaylists = {}
const PersistenceError = require('../errors/PersistenceError')

function add (refreshToken, item) {
  if (typeof refreshToken !== 'string') {
    throw new PersistenceError(`Unable to persist a playlist timer with playlistId different than a string. Instead it was [${typeof playlistId}]`)
  }

  if (!managedPlaylists[refreshToken]) {
    managedPlaylists[refreshToken] = new Map()
  }

  managedPlaylists[refreshToken].set(item.playlistId, item.timer)
}

function get (refreshToken, playlistId) {
  return managedPlaylists[refreshToken]?.get(playlistId) ?? undefined
}

function getAllPlaylistIds (refreshToken) {
  return Array.from(managedPlaylists[refreshToken]?.keys() ?? [])
}

function remove (refreshToken, playlistId) {
  managedPlaylists[refreshToken]?.delete(playlistId)
}

module.exports = {
  add,
  get,
  remove,
  getAllPlaylistIds
}
