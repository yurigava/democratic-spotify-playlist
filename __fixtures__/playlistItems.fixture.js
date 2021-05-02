function generatePlaylistItems (usersAndTracks = []) {
  let addedAtCounter = 0
  return usersAndTracks.map(userAndTrack => ({
    added_at: userAndTrack.added_at ? userAndTrack.added_at : `2019-12-27T01:30:${addedAtCounter++}Z`,
    added_by: {
      id: userAndTrack.added_byId ? userAndTrack.added_byId : userAndTrack.trackId[0]
    },
    track: {
      id: userAndTrack.trackId
    }
  })
  )
}

function generatePlaylistWithNItems (numberOfItems) {
  const usersAndTracks = Array(numberOfItems)
  const users = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

  for (let i = 0; i < numberOfItems; i++) {
    const user = Math.floor(Math.random() * users.length)
    const trackId = `${users[user]}${i}`
    usersAndTracks[i] = { trackId: trackId, added_byId: trackId[0] }
  }
  generatePlaylistItems(usersAndTracks)
}

module.exports.generatePlaylistItems = generatePlaylistItems
module.exports.generatePlaylistWithNItems = generatePlaylistWithNItems
