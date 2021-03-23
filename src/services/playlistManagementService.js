const spotifyAuthenticationService = require('./spotifyAuthenticationService')
const playlistOrderingService = require('./playlistOrderingService')

const ResourceDoesNotBelongToEntityError = require('../errors/ResourceDoesNotBelongToEntityError')
const ResourceNotFoundError = require('../errors/ResourceNotFoundError')

const managedPlaylists = require('../repositories/managedPlaylists')

async function orderPlaylist (playlistId, refreshToken) {
  const spotifyAuthenticatedClient = spotifyAuthenticationService.provideAuthenticatedClient(refreshToken)
  let currenPlaylist = spotifyAuthenticatedClient.retrievePlaylistTracks(playlistId)
  let currentTrackId = spotifyAuthenticatedClient.retrieveCurrentTrackId()
  const playlistSnapshotId = spotifyAuthenticatedClient.retrievePlaylistSnapshotId(playlistId);
  [currenPlaylist, currentTrackId] = await Promise.all([currenPlaylist, currentTrackId]).catch((err) => { throw err })
  const currentPlaylistTracks = currenPlaylist.items
  const currentTrack = currentPlaylistTracks.find((trackInfo) => trackInfo.track.id === currentTrackId) ?? {}
  const nextTrackPosition = currentPlaylistTracks.indexOf(currentTrack) + 1

  const reorderedPlaylistTracks = playlistOrderingService.reorder(currentPlaylistTracks, currentTrack)

  for (const track of currentPlaylistTracks.slice(nextTrackPosition)) {
    const positionInCurentPlaylist = currentPlaylistTracks.indexOf(track)
    const positionInOrderedPlaylist = reorderedPlaylistTracks.indexOf(track)
    if (positionInCurentPlaylist !== positionInOrderedPlaylist) {
      spotifyAuthenticatedClient.reorderTracksInPlaylist(playlistId, positionInCurentPlaylist, positionInOrderedPlaylist, { snapshot_id: await playlistSnapshotId })
    }
  }
}

async function managePlaylist (playlistId, refreshToken) {
  await validatePlaylistBelongsToUser(playlistId, refreshToken)

  const timer = setInterval(function () {
    module.exports.orderPlaylist(playlistId, refreshToken)
  }, 30 * 1000)
  managedPlaylists.add(playlistId, timer)
}

async function unmanagePlaylist (playlistId, refreshToken) {
  await validatePlaylistBelongsToUser(playlistId, refreshToken)
  await validatePlaylistIsRegistred(playlistId)

  clearInterval(managedPlaylists.get(playlistId))
  managedPlaylists.remove(playlistId)
}

async function validatePlaylistBelongsToUser (playlistId, refreshToken) {
  const spotifyAuthenticatedClient = spotifyAuthenticationService.provideAuthenticatedClient(refreshToken)
  const userPlaylists = spotifyAuthenticatedClient.retrieveUserPlaylists()
  const userId = (await spotifyAuthenticatedClient.retrieveCurrentUserProfile()).id
  const playlistBelongsToUser = (await userPlaylists).some((playlist) => playlist.id === playlistId && playlist.owner.id === userId)
  if (!playlistBelongsToUser) {
    throw new ResourceDoesNotBelongToEntityError(playlistId, userId)
  }
}

async function validatePlaylistIsRegistred (playlistId) {
  if (!managedPlaylists.get(playlistId)) {
    throw new ResourceNotFoundError(`The given playlist [${playlistId}] was never added`)
  }
}

module.exports = {
  orderPlaylist,
  managePlaylist,
  unmanagePlaylist
}
