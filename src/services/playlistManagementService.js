const globalVariables = require("../globals/variables");

const spotifyAuthenticationService = require("./spotifyAuthenticationService");
const playlistOrderingService = require("./playlistOrderingService");
const playlistMovementCalculator = require("./playlistMovementCalculator");

const ResourceDoesNotBelongToEntityError = require("../errors/ResourceDoesNotBelongToEntityError");
const ResourceNotFoundError = require("../errors/ResourceNotFoundError");

const managedPlaylists = require("../repositories/managedPlaylists");

const AsyncLock = require("async-lock");
const lock = new AsyncLock();

async function orderPlaylist(playlistId, refreshToken) {
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
  await module.exports.validatePlaylistBelongsToUser(playlistId, refreshToken);
  const lockKey = playlistId;

  const timer = setInterval(() => {
    if (!lock.isBusy(lockKey)) {
      lock.acquire(lockKey, function () {
        return module.exports.orderPlaylist(playlistId, refreshToken);
      });
    }
  }, globalVariables.ORDER_PLAYLIST_INTERVAL);

  managedPlaylists.add(refreshToken, playlistId, {
    timer,
  });
}

async function unmanagePlaylist(playlistId, refreshToken) {
  await module.exports.validatePlaylistBelongsToUser(playlistId, refreshToken);
  await module.exports.validatePlaylistIsRegistred(playlistId, refreshToken);

  clearInterval(managedPlaylists.get(refreshToken, playlistId));
  managedPlaylists.remove(refreshToken, playlistId);
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

async function validatePlaylistIsRegistred(playlistId, refreshToken) {
  if (!managedPlaylists.get(refreshToken, playlistId)) {
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
