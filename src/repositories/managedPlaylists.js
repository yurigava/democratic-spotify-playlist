
const managedPlaylists = {}

function add (playlistId, timer) {
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
