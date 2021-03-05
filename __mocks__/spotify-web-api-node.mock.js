/* eslint-env jest */
const getUserPlaylists = jest.fn()

const getMe = jest.fn()

const reorderTracksInPlaylist = jest.fn()

const getPlaylistTracks = jest.fn()

module.exports = { getUserPlaylists, getMe, reorderTracksInPlaylist, getPlaylistTracks }
