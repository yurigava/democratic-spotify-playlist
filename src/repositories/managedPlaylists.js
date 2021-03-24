
const managedPlaylists = {}
const PersistenceError = require('../errors/PersistenceError')

function add (playlistId, timer) {
  if (typeof playlistId !== 'string') {
    throw new PersistenceError(`Unable to persist a playlist timer with playlistId different than a string. Instead it was [${typeof playlistId}]`)
  }
  managedPlaylists[playlistId] = timer
}

function get (playlistId) {
  return managedPlaylists[playlistId]
}

function remove (playlistId) {
  delete managedPlaylists[playlistId]
}

module.exports = {
  add,
  get,
  remove
}
