var previousSongIndex = 0;
var usersTracksMap = new Map();
var trackLimit = 100;

function collectTracksByUsers(tracksInfo, startIndex) {
    tracksInfo.forEach((trackInfo, index) => {
        var addedBy = trackInfo.added_by.id;
        if(!usersTracksMap.get(addedBy)) {
            usersTracksMap.set(addedBy, [])
        }
        usersTracksMap.set(addedBy, usersTracksMap.get(addedBy).concat([{
            "index": index + startIndex, "trackId": trackInfo.track.id
        }]))
    })
}

function createListWithNewOrder() {
    var usersTracks = Array.from(usersTracksMap.values());
    var newList = []
    while(usersTracks.length > 0) {
        usersTracks = usersTracks.filter((userTracks) => {
            newList.push(userTracks.shift())
            return userTracks.length > 0
        })
    }
    return newList;
}

async function getCurrentlyPlayingIndex(spotifyApi, tracksInfo) {
    var currentSong = await spotifyApi.getMyCurrentPlaybackState({})
        .catch((err) => {console.log(err)})
    var currentIndex = tracksInfo.findIndex((trackInfo, index) => {
        index > previousSongIndex &&
        track.trackId == currentSong.body.item.id
    })
    previousSongIndex = currentIndex;
    return currentIndex;
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
    } while(tracksPage.body.total > offset);

    return tracksInfo;
}

const orderPlaylist = async (spotifyApi, playlistId) => {
    var tracksInfo = await getTracks(spotifyApi, playlistId)
        .catch((err) => {console.log(err)});
    var currentIndex = getCurrentlyPlayingIndex(spotifyApi, tracksInfo);
    var slicedTracks = tracksInfo.slice(currentIndex);
    collectTracksByUsers(tracksInfo, currentIndex);
    var newList = createListWithNewOrder();
}

exports.orderPlaylist = orderPlaylist;