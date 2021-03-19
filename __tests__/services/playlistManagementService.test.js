/* eslint-env jest */
jest.mock('spotify-web-api-node')

const spotifyMockedFns = require('../../__mocks__/spotify-web-api-node.mock')

const playlistManagementService = require('../../src/services/playlistManagementService')

jest.mock('../../src/services/playlistOrderingService')
const mockPlaylistOrderingService = require('../../src/services/playlistOrderingService')

const playlistItemsFixture = require('../../__fixtures__/playListItems.fixture')
const playlistFixture = require('../../__fixtures__/playlist.fixture')
const playlistMetadataFixture = require('../../__fixtures__/playlistMetadata.fixture')
const playbackStateFixture = require('../../__fixtures__/playbackState.fixture')
const userPlaylistsFixture = require('../../__fixtures__/userPlaylists.fixture')
const currentUserProfileFixture = require('../../__fixtures__/currentUserProfile.fixture')

const PlaylistDoesNotBelongToUserError = require('../../src/errors/PlaylistDoesNotBelongToUserError')

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.clearAllTimers()
  jest.clearAllMocks()
})

describe('Spotify Reorder Endpoint should be called once for each unplayed track whose position in the reordered playlist differs from the current playlist', () => {
  it('Spotify Reorder Endpoint should not be called for an empty playlist', async () => {
    // Arrange
    const playlistItems = []
    const playlistTracks = playlistFixture.generatePlaylist(playlistItemsFixture.generatePlaylistItems(playlistItems))
    const playlist = playlistMetadataFixture.generatePlaylistSnapshotId('S1')
    const playbackState = playbackStateFixture.generatePlaybackState('A2')
    spotifyMockedFns.getPlaylistTracks = jest.fn().mockResolvedValue(playlistTracks)
    spotifyMockedFns.getPlaylist = jest.fn().mockResolvedValue(playlist)
    spotifyMockedFns.getMyCurrentPlaybackState = jest.fn().mockResolvedValue(playbackState)
    jest.spyOn(mockPlaylistOrderingService, 'reorder').mockImplementation(() => [])
    // Act
    await playlistManagementService.orderPlaylist('P1')

    // Assert
    expect(spotifyMockedFns.reorderTracksInPlaylist).toHaveBeenCalledTimes(0)
  })

  it('Spotify Reorder Endpoint should not be called for a playlist with single item', async () => {
    // Arrange
    const playlistItems = [{ trackId: 'A1' }]
    const playlistTracks = playlistFixture.generatePlaylist(playlistItemsFixture.generatePlaylistItems(playlistItems))
    const playlist = playlistMetadataFixture.generatePlaylistSnapshotId('S1')
    const playbackState = playbackStateFixture.generatePlaybackState('A1')
    spotifyMockedFns.getPlaylistTracks = jest.fn().mockResolvedValue(playlistTracks)
    spotifyMockedFns.getPlaylist = jest.fn().mockResolvedValue(playlist)
    spotifyMockedFns.getMyCurrentPlaybackState = jest.fn().mockResolvedValue(playbackState)
    jest.spyOn(mockPlaylistOrderingService, 'reorder').mockImplementation(() => ['A1'])
    // Act
    await playlistManagementService.orderPlaylist('P1')

    // Assert
    expect(spotifyMockedFns.reorderTracksInPlaylist).toHaveBeenCalledTimes(0)
  })

  it('Spotify Reorder Tracks In Playlist should be called 2 times for a playlist [A1*, A2, B1]', async () => {
    // Arrange
    const playlistItems = [{ trackId: 'A1' }, { trackId: 'A2' }, { trackId: 'B1' }]
    const playlistTracks = playlistFixture.generatePlaylist(playlistItemsFixture.generatePlaylistItems(playlistItems))
    const playlist = playlistMetadataFixture.generatePlaylistSnapshotId('S1')
    const playbackState = playbackStateFixture.generatePlaybackState('A1')
    spotifyMockedFns.getPlaylistTracks = jest.fn().mockResolvedValue(playlistTracks)
    spotifyMockedFns.getPlaylist = jest.fn().mockResolvedValue(playlist)
    spotifyMockedFns.getMyCurrentPlaybackState = jest.fn().mockResolvedValue(playbackState)
    jest.spyOn(mockPlaylistOrderingService, 'reorder').mockImplementation(() => [playlistTracks.body.items[0], playlistTracks.body.items[2], playlistTracks.body.items[1]])

    // Act
    await playlistManagementService.orderPlaylist('P1')

    // Assert
    expect(spotifyMockedFns.reorderTracksInPlaylist).toHaveBeenCalledTimes(2)
    expect(spotifyMockedFns.reorderTracksInPlaylist).toHaveBeenNthCalledWith(1, 'P1', 1, 2, { snapshot_id: 'S1' })
    expect(spotifyMockedFns.reorderTracksInPlaylist).toHaveBeenNthCalledWith(2, 'P1', 2, 1, { snapshot_id: 'S1' })
  })

  it('Spotify Reorder Tracks In Playlist should be called 2 times for a playlist [A1, *A2, B1, C1, A3]', async () => {
    // Arrange
    const playlistItems = [{ trackId: 'A1' }, { trackId: 'A2' }, { trackId: 'B1' }, { trackId: 'C1' }, { trackId: 'A3' }]
    const playlistTracks = playlistFixture.generatePlaylist(playlistItemsFixture.generatePlaylistItems(playlistItems))
    const playlist = playlistMetadataFixture.generatePlaylistSnapshotId('S1')
    const playbackState = playbackStateFixture.generatePlaybackState('A2')

    spotifyMockedFns.getPlaylistTracks = jest.fn().mockResolvedValue(playlistTracks)
    spotifyMockedFns.getPlaylist = jest.fn().mockResolvedValue(playlist)
    spotifyMockedFns.getMyCurrentPlaybackState = jest.fn().mockResolvedValue(playbackState)
    jest.spyOn(mockPlaylistOrderingService, 'reorder').mockImplementation(() => [playlistTracks.body.items[0], playlistTracks.body.items[1], playlistTracks.body.items[4], playlistTracks.body.items[3], playlistTracks.body.items[2]])

    // Act
    await playlistManagementService.orderPlaylist('P1')

    // Assert
    expect(spotifyMockedFns.reorderTracksInPlaylist).toHaveBeenCalledTimes(2)
    expect(spotifyMockedFns.reorderTracksInPlaylist).toHaveBeenNthCalledWith(1, 'P1', 2, 4, { snapshot_id: 'S1' })
    expect(spotifyMockedFns.reorderTracksInPlaylist).toHaveBeenNthCalledWith(2, 'P1', 4, 2, { snapshot_id: 'S1' })
  })

  it('Spotify Reorder Endpoint should not be called for any playlist if the currently playing song of the user is not in the playlist', async () => {
    // Arrange
    const playlistItems = [{ trackId: 'A1' }, { trackId: 'A2' }, { trackId: 'B1' }, { trackId: 'C1' }, { trackId: 'A3' }]
    const playlistTracks = playlistFixture.generatePlaylist(playlistItemsFixture.generatePlaylistItems(playlistItems))
    const playlist = playlistMetadataFixture.generatePlaylistSnapshotId('S1')
    const playbackState = playbackStateFixture.generatePlaybackState('N1')

    spotifyMockedFns.getPlaylistTracks = jest.fn().mockResolvedValue(playlistTracks)
    spotifyMockedFns.getPlaylist = jest.fn().mockResolvedValue(playlist)
    spotifyMockedFns.getMyCurrentPlaybackState = jest.fn().mockResolvedValue(playbackState)
    jest.spyOn(mockPlaylistOrderingService, 'reorder').mockImplementation(() => playlistTracks.body.items)

    // Act
    await playlistManagementService.orderPlaylist('P1')

    // Assert
    expect(spotifyMockedFns.reorderTracksInPlaylist).toHaveBeenCalledTimes(0)
  })

  // TODO implement this correctly
  it.skip('Spotify Playlist Items Endpoint should be called 2 times for a playlist with 101 tracks', async () => {
    const playlistTracks = playlistFixture.generatePlaylist(playlistItemsFixture.generatePlaylistWithNItems(101))
    spotifyMockedFns.getPlaylistTracks = jest.fn().mockResolvedValue(playlistTracks)

    await playlistManagementService.orderPlaylist('P1')

    // Assert
    expect(spotifyMockedFns.getPlaylistTracks).toHaveBeenCalledTimes(2)
  })

  it.todo('An exception should be returned if there was a problem retrieving User´s Current Playback State from Spotify')

  it.todo('An exception should be returned if there was a problem retrieving Playlist Snapshot ID from Spotify')
})

describe('Unsucessuful playlist management', () => {
  it('Trying to manage a playlist that the user does not own should throw exception and should not trigger a playlist reorder', async () => {
    // Arrange
    const userPlaylists = userPlaylistsFixture.generateUserPlaylistsResponse([{ userId: 'U2', playlistId: 'P1' }])
    const currentUserProfile = currentUserProfileFixture.generateCurrentUserProfileResponse({ userId: 'U1' })
    spotifyMockedFns.getUserPlaylists = jest.fn().mockResolvedValue(userPlaylists)
    spotifyMockedFns.getMe = jest.fn().mockResolvedValue(currentUserProfile)

    // Act - Assert
    await expect(playlistManagementService.managePlaylist('P1'))
      .rejects
      .toThrow(PlaylistDoesNotBelongToUserError)
    expect(setInterval).toHaveBeenCalledTimes(0)
  })

  it('Trying to manage a playlist that does not exist should throw exception and should not trigger a plyalist reorder', async () => {
    // Arrange
    const userPlaylists = userPlaylistsFixture.generateUserPlaylistsResponse([{ userId: 'U1', playlistId: 'P1' }])
    const currentUserProfile = currentUserProfileFixture.generateCurrentUserProfileResponse({ userId: 'U1' })
    spotifyMockedFns.getUserPlaylists = jest.fn().mockResolvedValue(userPlaylists)
    spotifyMockedFns.getMe = jest.fn().mockResolvedValue(currentUserProfile)

    // Act
    // Assert
    await expect(playlistManagementService.managePlaylist('NP1'))
      .rejects
      .toThrow(PlaylistDoesNotBelongToUserError)
    expect(setInterval).toHaveBeenCalledTimes(0)
  })
})

describe('Sucessful playlist management', () => {
  beforeAll(() => {
    const userPlaylists = userPlaylistsFixture.generateUserPlaylistsResponse([{ userId: 'U1', playlistId: 'P1' }])
    const currentUserProfile = currentUserProfileFixture.generateCurrentUserProfileResponse({ userId: 'U1' })
    spotifyMockedFns.getUserPlaylists = jest.fn().mockResolvedValue(userPlaylists)
    spotifyMockedFns.getMe = jest.fn().mockResolvedValue(currentUserProfile)
  })

  it('The method to order a playlist should be called indefenitly after a playlist is given to be managed by the service', async () => {
    // Arrange
    playlistManagementService.orderPlaylist = jest.fn()

    // Act
    await playlistManagementService.managePlaylist('P1')
    jest.runOnlyPendingTimers()
    jest.runOnlyPendingTimers()

    // Assert
    expect(setInterval).toHaveBeenCalledTimes(1)
    expect(playlistManagementService.orderPlaylist).toHaveBeenCalledTimes(2)
  })

  // TODO check that the timer object has been correctly deleted
  it('When the service is requested to unmanage the playist, the timer for that playlist should cease running', async () => {
    // Arrange
    playlistManagementService.orderPlaylist = jest.fn()

    // Act
    await playlistManagementService.managePlaylist('P1')
    playlistManagementService.unmanagePlaylist('P1')

    // Assert
    expect(clearInterval).toHaveBeenCalledTimes(1)
  })
})
