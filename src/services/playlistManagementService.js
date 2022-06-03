const spotifyAuthenticationService = require("./spotifyAuthenticationService");
const playlistOrderingService = require("./playlistOrderingService");
const playlistMovementCalculator = require("./playlistMovementCalculator");

const ResourceDoesNotBelongToEntityError = require("../errors/ResourceDoesNotBelongToEntityError");
const ResourceNotFoundError = require("../errors/ResourceNotFoundError");

const managedPlaylists = require("../repositories/managedPlaylists");

async function orderPlaylist (playlistId, refreshToken) {
  const spotifyAuthenticatedClient =
    await spotifyAuthenticationService.provideAuthenticatedClient(refreshToken);
  let currentPlaylistTracks =
    spotifyAuthenticatedClient.retrievePlaylistTracks(playlistId);
  let currentTrackId = spotifyAuthenticatedClient.retrieveCurrentTrackId();
  let playlistSnapshotId =
    spotifyAuthenticatedClient.retrievePlaylistSnapshotId(playlistId);
  [currentPlaylistTracks, currentTrackId] = await Promise.all([
    currentPlaylistTracks,
    currentTrackId,
  ]).catch((err) => {
    throw err;
  });
  const currentTrack =
    currentPlaylistTracks.find(
      (trackInfo) => trackInfo.track.id === currentTrackId
    ) ?? {};

  const reorderedPlaylistTracks = playlistOrderingService.reorderPlaylist(
    currentPlaylistTracks,
    currentTrack
  );
  const movements = playlistMovementCalculator.getPlaylistReorderMovements(
    currentPlaylistTracks,
    reorderedPlaylistTracks
  );

  for (const movement of movements) {
    playlistSnapshotId = spotifyAuthenticatedClient.reorderTracksInPlaylist(
      playlistId,
      movement.from,
      movement.to,
      { snapshot_id: await playlistSnapshotId }
    );
  }
}

function getManagedPlaylistsIds(refreshToken) {
  return { playlistIds: managedPlaylists.getAllPlaylistIds(refreshToken) };
}

async function managePlaylist(playlistId, refreshToken) {
  await validatePlaylistBelongsToUser(playlistId, refreshToken);

  const timer = setInterval(function () {
    module.exports.orderPlaylist(playlistId, refreshToken);
  }, 100 * 1000);
  managedPlaylists.add(refreshToken, { playlistId, timer });
}

async function unmanagePlaylist(playlistId, refreshToken) {
  await module.exports.validatePlaylistBelongsToUser(playlistId, refreshToken);
  await module.exports.validatePlaylistIsRegistred(playlistId);

  clearInterval(managedPlaylists.get(playlistId));
  managedPlaylists.remove(playlistId);
}

async function validatePlaylistBelongsToUser(playlistId, refreshToken) {
  const spotifyAuthenticatedClient =
    await spotifyAuthenticationService.provideAuthenticatedClient(refreshToken);
  const userPlaylists = spotifyAuthenticatedClient.retrieveUserPlaylists();
  const userId = (await spotifyAuthenticatedClient.retrieveCurrentUserProfile())
    .id;
  const playlistBelongsToUser = (await userPlaylists).some(
    (playlist) => playlist.id === playlistId && playlist.owner.id === userId
  );
  if (!playlistBelongsToUser) {
    throw new ResourceDoesNotBelongToEntityError(playlistId, userId);
  }
}

async function validatePlaylistIsRegistred(playlistId) {
  if (!managedPlaylists.get(playlistId)) {
    throw new ResourceNotFoundError(
      `The given playlist [${playlistId}] was never added`
    );
  }
}

module.exports = {
  orderPlaylist,
  managePlaylist,
  unmanagePlaylist,
  getManagedPlaylistsIds,
  validatePlaylistBelongsToUser,
  validatePlaylistIsRegistred,
};
