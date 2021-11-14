/* eslint-env jest */
const playlistManagementService = require('../../src/services/playlistManagementService')

jest.mock('../../src/services/playlistOrderingService')
const mockPlaylistOrderingService = require('../../src/services/playlistOrderingService')

jest.mock('../../src/services/playlistMovementCalculator')
const mockPlaylistMovementCalculator = require('../../src/services/playlistMovementCalculator')

jest.mock('../../src/clients/SpotifyClientWrapper')
const MockSpotifyClientWrapper = require('../../src/clients/SpotifyClientWrapper')

const mockProvideAuthentication = jest.fn().mockImplementation(() => new MockSpotifyClientWrapper())
const mockSpotifyAuthenticationService = require('../../src/services/spotifyAuthenticationService.js')
mockSpotifyAuthenticationService.provideAuthenticatedClient = mockProvideAuthentication

jest.mock('../../src/repositories/managedPlaylists.js')
const mockManagedPlaylist = require('../../src/repositories/managedPlaylists.js')

const playlistItemsFixture = require('../../__fixtures__/playlistItems.fixture')
const playlistFixture = require('../../__fixtures__/playlist.fixture')
const userPlaylistsFixture = require('../../__fixtures__/userPlaylists.fixture')
const currentUserProfileFixture = require('../../__fixtures__/currentUserProfile.fixture')

const ResourceDoesNotBelongToEntityError = require('../../src/errors/ResourceDoesNotBelongToEntityError')
const ResourceNotFoundError = require('../../src/errors/ResourceNotFoundError')

beforeAll(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.clearAllTimers()
  jest.clearAllMocks()
})

function setupSpotifyClientWrapperMock (mocks) {
  MockSpotifyClientWrapper.mockImplementation(() => {
    return { ...mocks }
  })
}

describe('Spotify Reorder Endpoint should be called once for each calculated movement', () => {
  it('Spotify Reorder Endpoint should not be called for a playlist that leads to no movement', async () => {
    // Arrange
    const playlistItems = [{ trackId: 'A1' }]
    const playlistTracks = playlistFixture.generatePlaylist(playlistItemsFixture.generatePlaylistItems(playlistItems))
    const mocks = {
      retrievePlaylistTracks: jest.fn().mockResolvedValue(playlistTracks),
      retrieveCurrentTrackId: jest.fn().mockResolvedValue('A1'),
      retrievePlaylistSnapshotId: jest.fn().mockResolvedValue('S1'),
      reorderTracksInPlaylist: jest.fn()
    }
    setupSpotifyClientWrapperMock(mocks)

    jest.spyOn(mockPlaylistOrderingService, 'reorderPlaylist').mockImplementation(() => ['A1'])
    jest.spyOn(mockPlaylistMovementCalculator, 'getPlaylistReorderMovements').mockImplementation(() => [])
    // Act
    await playlistManagementService.orderPlaylist('P1')

    // Assert
    expect(mocks.reorderTracksInPlaylist).toHaveBeenCalledTimes(0)
  })

  it('Spotify Reorder Tracks In Playlist should be called for each calculated movement - 1 movement', async () => {
    // Arrange
    const playlistItems = [{ trackId: 'A1' }, { trackId: 'A2' }, { trackId: 'B1' }]
    const playlistTracks = playlistFixture.generatePlaylist(playlistItemsFixture.generatePlaylistItems(playlistItems))
    const reorderedItems = [playlistTracks.items[0], playlistTracks.items[2], playlistTracks.items[1]]
    const mocks = {
      retrievePlaylistTracks: jest.fn().mockResolvedValue(playlistTracks),
      retrieveCurrentTrackId: jest.fn().mockResolvedValue('A1'),
      retrievePlaylistSnapshotId: jest.fn().mockResolvedValueOnce('S1'),
      reorderTracksInPlaylist: jest.fn()
    }
    setupSpotifyClientWrapperMock(mocks)
    jest.spyOn(mockPlaylistOrderingService, 'reorderPlaylist').mockImplementation(() => reorderedItems)
    jest.spyOn(mockPlaylistMovementCalculator, 'getPlaylistReorderMovements').mockImplementation(() => [{ from: 2, to: 1 }])

    // Act
    await playlistManagementService.orderPlaylist('P1')

    // Assert
    expect(mockPlaylistOrderingService.reorderPlaylist).toHaveBeenCalledWith(playlistTracks.items, playlistTracks.items[0])
    expect(mockPlaylistMovementCalculator.getPlaylistReorderMovements).toHaveBeenCalledWith(playlistTracks.items, reorderedItems)
    expect(mocks.reorderTracksInPlaylist).toHaveBeenCalledTimes(1)
    expect(mocks.reorderTracksInPlaylist).toHaveBeenNthCalledWith(1, 'P1', 2, 1, { snapshot_id: 'S1' })
  })

  it('Spotify Reorder Tracks In Playlist should be called for each calculated movement - 2 movements', async () => {
    // Arrange
    const playlistItems = [{ trackId: 'A1' }, { trackId: 'A2' }, { trackId: 'B1' }, { trackId: 'A3' }, { trackId: 'B2' }]
    const playlistTracks = playlistFixture.generatePlaylist(playlistItemsFixture.generatePlaylistItems(playlistItems))
    const reorderedItems = [playlistTracks.items[0], playlistTracks.items[2], playlistTracks.items[1], playlistTracks.items[4], playlistTracks.items[3]]
    const mocks = {
      retrievePlaylistTracks: jest.fn().mockResolvedValue(playlistTracks),
      retrieveCurrentTrackId: jest.fn().mockResolvedValue('A1'),
      retrievePlaylistSnapshotId: jest.fn().mockResolvedValueOnce('S1'),
      reorderTracksInPlaylist: jest.fn().mockResolvedValue('S2')
    }

    setupSpotifyClientWrapperMock(mocks)
    jest.spyOn(mockPlaylistOrderingService, 'reorderPlaylist').mockImplementation(() => reorderedItems)
    jest.spyOn(mockPlaylistMovementCalculator, 'getPlaylistReorderMovements').mockImplementation(() => [{ from: 2, to: 1 }, { from: 4, to: 3 }])

    // Act
    await playlistManagementService.orderPlaylist('P1')

    // Assert
    expect(mockPlaylistOrderingService.reorderPlaylist).toHaveBeenCalledWith(playlistTracks.items, playlistTracks.items[0])
    expect(mockPlaylistMovementCalculator.getPlaylistReorderMovements).toHaveBeenCalledWith(playlistTracks.items, reorderedItems)
    expect(mocks.reorderTracksInPlaylist).toHaveBeenCalledTimes(2)
    expect(mocks.reorderTracksInPlaylist).toHaveBeenNthCalledWith(1, 'P1', 2, 1, { snapshot_id: 'S1' })
    expect(mocks.reorderTracksInPlaylist).toHaveBeenNthCalledWith(2, 'P1', 4, 3, { snapshot_id: 'S2' })
  })

  // TODO implement this correctly
  it.todo('Spotify Playlist Items Endpoint should be called 2 times for a playlist with 101 tracks')

  it.todo('An exception should be returned if there was a problem retrieving User´s Current Playback State from Spotify')

  it.todo('An exception should be returned if there was a problem retrieving Playlist Snapshot ID from Spotify')
})

describe('Playlist that does not belong to the user', () => {
  it('Trying to manage a playlist that the user does not own should throw exception and should not trigger a playlist reorder', async () => {
    // Arrange
    const userPlaylists = userPlaylistsFixture.generateUserPlaylistsItem([{ userId: 'U2', playlistId: 'P1' }])
    const currentUserProfile = currentUserProfileFixture.generateCurrentUserProfile({ userId: 'U1' })
    const mocks = {
      retrieveCurrentUserProfile: jest.fn().mockResolvedValue(currentUserProfile),
      retrieveUserPlaylists: jest.fn().mockResolvedValue(userPlaylists)
    }
    setupSpotifyClientWrapperMock(mocks)

    // Act - Assert
    await expect(playlistManagementService.managePlaylist('P1'))
      .rejects
      .toThrow(ResourceDoesNotBelongToEntityError)
    expect(setInterval).toHaveBeenCalledTimes(0)
  })

  it('Trying to unmanage a playlist that the user does not own should throw exception and should not trigger a playlist reorder', async () => {
    // Arrange
    const userPlaylists = userPlaylistsFixture.generateUserPlaylistsItem([{ userId: 'U2', playlistId: 'P1' }])
    const currentUserProfile = currentUserProfileFixture.generateCurrentUserProfile({ userId: 'U1' })
    const mocks = {
      retrieveCurrentUserProfile: jest.fn().mockResolvedValue(currentUserProfile),
      retrieveUserPlaylists: jest.fn().mockResolvedValue(userPlaylists)
    }
    setupSpotifyClientWrapperMock(mocks)

    // Act - Assert
    await expect(playlistManagementService.unmanagePlaylist('P1'))
      .rejects
      .toThrow(ResourceDoesNotBelongToEntityError)
    expect(setInterval).toHaveBeenCalledTimes(0)
  })

  it('Trying to manage a playlist that does not exist should throw exception and should not trigger a playlist reorder', async () => {
    // Arrange
    const userPlaylists = userPlaylistsFixture.generateUserPlaylistsItem([{ userId: 'U1', playlistId: 'P1' }])
    const currentUserProfile = currentUserProfileFixture.generateCurrentUserProfile({ userId: 'U1' })
    const mocks = {
      retrieveCurrentUserProfile: jest.fn().mockResolvedValue(currentUserProfile),
      retrieveUserPlaylists: jest.fn().mockResolvedValue(userPlaylists)
    }
    setupSpotifyClientWrapperMock(mocks)

    // Act - Assert
    await expect(playlistManagementService.managePlaylist('NP1'))
      .rejects
      .toThrow(ResourceDoesNotBelongToEntityError)
    expect(setInterval).toHaveBeenCalledTimes(0)
  })
})

describe('Playlist that belongs to the user', () => {
  beforeAll(() => {
    const userPlaylists = userPlaylistsFixture.generateUserPlaylistsItem([{ userId: 'U1', playlistId: 'P1' }])
    const currentUserProfile = currentUserProfileFixture.generateCurrentUserProfile({ userId: 'U1' })
    const mocks = {
      retrieveCurrentUserProfile: jest.fn().mockResolvedValue(currentUserProfile),
      retrieveUserPlaylists: jest.fn().mockResolvedValue(userPlaylists)
    }
    setupSpotifyClientWrapperMock(mocks)
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  it('The method to order a playlist should be called indefenitly after a playlist is given to be managed by the service', async () => {
    // Arrange
    jest.spyOn(playlistManagementService, 'orderPlaylist')

    // Act
    await playlistManagementService.managePlaylist('P1')
    jest.runOnlyPendingTimers()
    jest.runOnlyPendingTimers()

    // Assert
    expect(setInterval).toHaveBeenCalledTimes(1)
    expect(mockManagedPlaylist.add).toHaveBeenCalledTimes(1)
    expect(playlistManagementService.orderPlaylist).toHaveBeenCalledTimes(2)
  })

  // TODO check that the timer object has been correctly deleted
  it('When the service is requested to unmanage the playlist, the timer for that playlist should cease running', async () => {
    // Arrange
    jest.spyOn(playlistManagementService, 'orderPlaylist')
    jest.spyOn(mockManagedPlaylist, 'get').mockReturnValue(true)

    // Act
    await playlistManagementService.unmanagePlaylist('P1')

    // Assert
    expect(clearInterval).toHaveBeenCalledTimes(1)
    expect(mockManagedPlaylist.get).toHaveBeenCalledTimes(2)
    expect(mockManagedPlaylist.remove).toHaveBeenCalledTimes(1)
  })

  it('Trying to unmanage a playlist that was not registred should throw exception and should not trigger a playlist reorder', async () => {
    // Arrange
    jest.spyOn(mockManagedPlaylist, 'get').mockReturnValue(false)

    // Act - Assert
    await expect(playlistManagementService.unmanagePlaylist('P1'))
      .rejects
      .toThrow(ResourceNotFoundError)
    expect(setInterval).toHaveBeenCalledTimes(0)
  })

  it('getManagedPlaylists should return all playlists that the user added to be ordered', async () => {
    // Arrange
    jest.spyOn(mockManagedPlaylist, 'getAllPlaylistIds').mockReturnValue(['P1', 'P2', 'P3'])

    // Act
    const playlists = await playlistManagementService.getManagedPlaylistsIds('RFT1')

    // Assert
    expect(playlists).toStrictEqual({ playlistIds: ['P1', 'P2', 'P3'] })
  })
})
