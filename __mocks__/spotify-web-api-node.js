/* eslint-env jest */
const mockFns = require('./spotify-web-api-node.mock')

const mock = jest.fn().mockImplementation(() => {
  return {
    getPlaylistTracks: (...args) => mockFns.getPlaylistTracks(...args),
    getUserPlaylists: (...args) => mockFns.getUserPlaylists(...args),
    getPlaylist: (...args) => mockFns.getPlaylist(...args),
    getMe: (...args) => mockFns.getMe(...args),
    getMyCurrentPlaybackState: (...args) => mockFns.getMyCurrentPlaybackState(...args),
    reorderTracksInPlaylist: (...args) => mockFns.reorderTracksInPlaylist(...args)
  }
})

module.exports = mock
