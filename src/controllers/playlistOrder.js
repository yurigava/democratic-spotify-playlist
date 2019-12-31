var previousSongIndex = 0;
var usersTracksMap;
var trackLimit = 100;

function collectTracksByUsers(tracksInfo, startIndex) {
  tracksInfo.forEach((trackInfo, index) => {
    var addedBy = trackInfo.added_by.id;
    if (!usersTracksMap.get(addedBy)) {
      usersTracksMap.set(addedBy, [])
    }
    usersTracksMap.set(addedBy, usersTracksMap.get(addedBy).concat([{
      "index": index + startIndex + 1,
      "added_by": { "id": trackInfo.added_by.id },
      "track": { "id": trackInfo.track.id }
    }]))
  })
}

function createListWithNewOrder(playedTracks) {
  var usersTracks = Array.from(usersTracksMap.values());
  var newList = []
  while (usersTracks.length > 0) {
    usersTracks = usersTracks.filter((userTracks) => {
      newList.push(userTracks.shift())
      return userTracks.length > 0
    })
  }
  return playedTracks.concat(newList);
}

async function getCurrentlyPlayingIndex(spotifyApi, tracksInfo) {
  var currentSong = await spotifyApi.getMyCurrentPlaybackState({})
    .catch((err) => { console.log(err) });
  if (!currentSong.body.item) {
    return previousSongIndex;
  }
  var currentIndex = findIndexOfSongInList(tracksInfo, currentSong);
  previousSongIndex = currentIndex;
  return currentIndex;
}

function findIndexOfSongInList(tracksInfo, currentSong) {
  var indexOfSong = tracksInfo.findIndex((trackInfo, index) => {
    return index >= previousSongIndex &&
      trackInfo.track.id === currentSong.body.item.id
  })
  if (indexOfSong < 0) {
    indexOfSong = tracksInfo.findIndex((trackInfo, index) => {
      return trackInfo.track.id === currentSong.body.item.id
    })
  }
  return indexOfSong;
}

async function getTracks(spotifyApi, playlistId) {
  var offset = 0;
  var tracksInfo = [];
  do {
    var tracksPage = await spotifyApi.getPlaylistTracks(playlistId, {
      offset: offset,
      limit: trackLimit,
      fields: 'items(added_by.id,track.id),total'
    }).catch((err) => { console.log("Failed to get Tracks") });
    tracksInfo = tracksInfo.concat(tracksPage.body.items);
    offset += trackLimit;
  } while (tracksPage.body.total > offset);

  return tracksInfo;
}

function getChanges(oldList, newList) {
  const changes = []
  for (let i = 0; i < oldList.length; i++) {
    if (oldList[i].index === newList[i].index)
      continue;
    changes.push([newList[i].index, i])
    fixOldArray(oldList, newList, i, newList[i].index);
  }
  return changes;
}

function fixOldArray(oldList, newList, startIndex, endIndex) {
  oldList.splice(startIndex, 0, oldList.splice(endIndex, 1)[0]);
  newList[startIndex].index = oldList[startIndex].index;
  for (i = endIndex; i >= startIndex + 1; i--) {
    var newListIndex = newList.findIndex((item, nli) => {
      return nli > startIndex && item.index === oldList[i].index
    });
    oldList[i].index++;
    newList[newListIndex].index++;
  }
}

function createListWithOldOrder(trackList) {
  return trackList.map((item, i) => {
    return {
      'index': i,
      'added_by': { 'id': item.added_by.id },
      'track': { 'id': item.track.id }
    }
  });
}

async function performChanges(spotifyApi, playlistId, changes) {
  for (let i = 0; i < changes.length; i++) {
    await spotifyApi.reorderTracksInPlaylist(playlistId, changes[i][0], changes[i][1])
      .catch((err) => { console.log(err) })
  }
}

const orderPlaylist = async (spotifyApi, playlistId) => {
  console.log('Reordering Playlists')
  usersTracksMap = new Map()
  let tracksInfo = await getTracks(spotifyApi, playlistId)
    .catch((err) => { console.log(err) });
  const currentIndex = await getCurrentlyPlayingIndex(spotifyApi, tracksInfo);
  console.log(currentIndex);
  const notPlayedTracks = tracksInfo.slice(currentIndex + 1);
  collectTracksByUsers(notPlayedTracks, currentIndex);
  tracksInfo = createListWithOldOrder(tracksInfo);
  const newList = createListWithNewOrder(tracksInfo.slice(0, currentIndex + 1));
  const changes = getChanges(tracksInfo, newList);
  await performChanges(spotifyApi, playlistId, changes);
}

exports.orderPlaylist = orderPlaylist;
