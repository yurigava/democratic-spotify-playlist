/* eslint-env jest */
const AsyncLock = require("async-lock/lib");

const globalVariables = require("../../src/globals/variables");

const playlistManagementService = require("../../src/services/playlistManagementService");

jest.mock("../../src/services/playlistOrderingService");
const mockPlaylistOrderingService = require("../../src/services/playlistOrderingService");

jest.mock("../../src/services/playlistMovementCalculator");
const mockPlaylistMovementCalculator = require("../../src/services/playlistMovementCalculator");

jest.mock("../../src/clients/SpotifyClientWrapper");
const MockSpotifyClientWrapper = require("../../src/clients/SpotifyClientWrapper");

const mockProvideAuthentication = jest
  .fn()
  .mockImplementation(() => new MockSpotifyClientWrapper());
const mockSpotifyAuthenticationService = require("../../src/services/spotifyAuthenticationService.js");

mockSpotifyAuthenticationService.provideAuthenticatedClient =
  mockProvideAuthentication;

jest.mock("../../src/repositories/managedPlaylists.js");
const mockManagedPlaylist = require("../../src/repositories/managedPlaylists.js");

const playlistItemsFixture = require("../../__fixtures__/playlistItems.fixture");
const userPlaylistsFixture = require("../../__fixtures__/userPlaylists.fixture");
const currentUserProfileFixture = require("../../__fixtures__/currentUserProfile.fixture");
const sleep = require("../../__fixtures__/utils/sleep");

const ResourceDoesNotBelongToEntityError = require("../../src/errors/ResourceDoesNotBelongToEntityError");
const ResourceNotFoundError = require("../../src/errors/ResourceNotFoundError");

beforeAll(() => {
  jest.useFakeTimers();
});

function setupSpotifyClientWrapperMock(mocks) {
  MockSpotifyClientWrapper.mockImplementation(() => ({ ...mocks }));
}

describe("Spotify Reorder Endpoint should be called once for each calculated movement", () => {
  it("Spotify Reorder Endpoint should not be called for a playlist that leads to no movement", async () => {
    // Arrange
    const playlistItems = [{ trackId: "A1" }];
    const playlistTracks =
      playlistItemsFixture.generatePlaylistItems(playlistItems);

    const mocks = {
      retrievePlaylistTracks: jest.fn().mockResolvedValue(playlistTracks),
      retrieveCurrentTrackId: jest.fn().mockResolvedValue("A1"),
      retrievePlaylistSnapshotId: jest.fn().mockResolvedValue("S1"),
      reorderTracksInPlaylist: jest.fn(),
      currentPlaylistTracks: jest.fn(),
    };
    setupSpotifyClientWrapperMock(mocks);

    jest
      .spyOn(mockPlaylistOrderingService, "reorderPlaylist")
      .mockImplementation(() => ["A1"]);
    jest
      .spyOn(mockPlaylistMovementCalculator, "getPlaylistReorderMovements")
      .mockImplementation(() => []);
    // Act
    await playlistManagementService.orderPlaylist("P1");

    // Assert
    expect(mocks.reorderTracksInPlaylist).toHaveBeenCalledTimes(0);
  });

  it("Spotify Reorder Tracks In Playlist should be called for each calculated movement - 1 movement", async () => {
    // Arrange
    const playlistItems = [
      { trackId: "A1" },
      { trackId: "A2" },
      { trackId: "B1" },
    ];
    const playlistTracks =
      playlistItemsFixture.generatePlaylistItems(playlistItems);

    const reorderedItems = [
      playlistTracks[0],
      playlistTracks[2],
      playlistTracks[1],
    ];
    const mocks = {
      retrievePlaylistTracks: jest.fn().mockResolvedValue(playlistTracks),
      retrieveCurrentTrackId: jest.fn().mockResolvedValue("A1"),
      retrievePlaylistSnapshotId: jest.fn().mockResolvedValue("S1"),
      reorderTracksInPlaylist: jest.fn(),
    };
    setupSpotifyClientWrapperMock(mocks);

    jest
      .spyOn(mockPlaylistOrderingService, "reorderPlaylist")
      .mockImplementation(() => reorderedItems);
    jest
      .spyOn(mockPlaylistMovementCalculator, "getPlaylistReorderMovements")
      .mockImplementation(() => [{ from: 2, to: 1 }]);

    // Act
    await playlistManagementService.orderPlaylist("P1");

    // Assert
    expect(mockPlaylistOrderingService.reorderPlaylist).toHaveBeenCalledWith(
      playlistTracks,
      playlistTracks[0]
    );
    expect(
      mockPlaylistMovementCalculator.getPlaylistReorderMovements
    ).toHaveBeenCalledWith(playlistTracks, reorderedItems);
    expect(mocks.reorderTracksInPlaylist).toHaveBeenCalledTimes(1);
    expect(mocks.reorderTracksInPlaylist).toHaveBeenNthCalledWith(
      1,
      "P1",
      2,
      1,
      { snapshot_id: "S1" }
    );
  });

  it("Spotify Reorder Tracks In Playlist should be called for each calculated movement - 2 movements", async () => {
    // Arrange
    const playlistItems = [
      { trackId: "A1" },
      { trackId: "A2" },
      { trackId: "B1" },
      { trackId: "A3" },
      { trackId: "B2" },
    ];
    const playlistTracks =
      playlistItemsFixture.generatePlaylistItems(playlistItems);

    const reorderedItems = [
      playlistTracks[0],
      playlistTracks[2],
      playlistTracks[1],
      playlistTracks[4],
      playlistTracks[3],
    ];
    const mocks = {
      retrievePlaylistTracks: jest.fn().mockResolvedValue(playlistTracks),
      retrieveCurrentTrackId: jest.fn().mockResolvedValue("A1"),
      retrievePlaylistSnapshotId: jest.fn().mockResolvedValue("S1"),
      reorderTracksInPlaylist: jest.fn().mockResolvedValue("S2"),
    };

    setupSpotifyClientWrapperMock(mocks);
    jest
      .spyOn(mockPlaylistOrderingService, "reorderPlaylist")
      .mockImplementation(() => reorderedItems);
    jest
      .spyOn(mockPlaylistMovementCalculator, "getPlaylistReorderMovements")
      .mockImplementation(() => [
        { from: 2, to: 1 },
        { from: 4, to: 3 },
      ]);

    // Act
    await playlistManagementService.orderPlaylist("P1");

    // Assert
    expect(mockPlaylistOrderingService.reorderPlaylist).toHaveBeenCalledWith(
      playlistTracks,
      playlistTracks[0]
    );
    expect(
      mockPlaylistMovementCalculator.getPlaylistReorderMovements
    ).toHaveBeenCalledWith(playlistTracks, reorderedItems);
    expect(mocks.reorderTracksInPlaylist).toHaveBeenCalledTimes(2);
    expect(mocks.reorderTracksInPlaylist).toHaveBeenNthCalledWith(
      1,
      "P1",
      2,
      1,
      { snapshot_id: "S1" }
    );
    expect(mocks.reorderTracksInPlaylist).toHaveBeenNthCalledWith(
      2,
      "P1",
      4,
      3,
      { snapshot_id: "S2" }
    );
  });

  // TODO implement this correctly
  it.todo(
    "Spotify Playlist Items Endpoint should be called 2 times for a playlist with 101 tracks"
  );

  it.todo(
    "An exception should be returned if there was a problem retrieving User´s Current Playback State from Spotify"
  );

  it.todo(
    "An exception should be returned if there was a problem retrieving Playlist Snapshot ID from Spotify"
  );
});

describe("Playlist management status change when the owner does not own a playlist", () => {
  it("Trying to manage a playlist that the user does not own should throw exception", async () => {
    // Arrange
    const userPlaylists = userPlaylistsFixture.generateUserPlaylistsItem([
      { userId: "U2", playlistId: "P1" },
    ]);
    const currentUserProfile =
      currentUserProfileFixture.generateCurrentUserProfile({ userId: "U1" });
    const mocks = {
      retrieveCurrentUserProfile: jest
        .fn()
        .mockResolvedValue(currentUserProfile),
      retrieveUserPlaylists: jest.fn().mockResolvedValue(userPlaylists),
    };
    setupSpotifyClientWrapperMock(mocks);

    // Act - Assert
    await expect(
      playlistManagementService.managePlaylist("P1")
    ).rejects.toThrow(ResourceDoesNotBelongToEntityError);
    expect(setInterval).toHaveBeenCalledTimes(0);
  });

  it("Trying to unmanage a playlist that the user does not own should throw exception and should not trigger a playlist reorder", async () => {
    // Arrange
    const userPlaylists = userPlaylistsFixture.generateUserPlaylistsItem([
      { userId: "U2", playlistId: "P1" },
    ]);
    const currentUserProfile =
      currentUserProfileFixture.generateCurrentUserProfile({ userId: "U1" });
    const mocks = {
      retrieveCurrentUserProfile: jest
        .fn()
        .mockResolvedValue(currentUserProfile),
      retrieveUserPlaylists: jest.fn().mockResolvedValue(userPlaylists),
    };
    setupSpotifyClientWrapperMock(mocks);

    // Act - Assert
    await expect(
      playlistManagementService.unmanagePlaylist("P1")
    ).rejects.toThrow(ResourceDoesNotBelongToEntityError);
    expect(setInterval).toHaveBeenCalledTimes(0);
  });

  it("Trying to manage a playlist that does not exist should throw exception and should not trigger a playlist reorder", async () => {
    // Arrange
    const userPlaylists = userPlaylistsFixture.generateUserPlaylistsItem([
      { userId: "U1", playlistId: "P1" },
    ]);
    const currentUserProfile =
      currentUserProfileFixture.generateCurrentUserProfile({ userId: "U1" });
    const mocks = {
      retrieveCurrentUserProfile: jest
        .fn()
        .mockResolvedValue(currentUserProfile),
      retrieveUserPlaylists: jest.fn().mockResolvedValue(userPlaylists),
    };
    setupSpotifyClientWrapperMock(mocks);

    // Act - Assert
    await expect(
      playlistManagementService.managePlaylist("NP1")
    ).rejects.toThrow(ResourceDoesNotBelongToEntityError);
    expect(setInterval).toHaveBeenCalledTimes(0);
  });

  it("Trying to unmanage a playlist that was not registred should throw exception", async () => {
    // Arrange
    jest.spyOn(mockManagedPlaylist, "get").mockReturnValue(false);
    jest.spyOn(global, "setInterval");
    // Act - Assert
    await expect(
      playlistManagementService.unmanagePlaylist("P1")
    ).rejects.toThrow(ResourceNotFoundError);
    expect(setInterval).toHaveBeenCalledTimes(0);
  });
});

describe("getManagedPlaylists method", () => {
  it("getManagedPlaylists should return all playlists that the user added to be ordered", async () => {
    // Arrange
    jest
      .spyOn(mockManagedPlaylist, "getAllPlaylistIds")
      .mockReturnValue(["P1", "P2", "P3"]);

    // Act
    const playlists = playlistManagementService.getManagedPlaylistsIds("RFT1");

    // Assert
    expect(playlists).toStrictEqual({ playlistIds: ["P1", "P2", "P3"] });
  });
});

describe("orderPlaylist triggering conditions", () => {
  beforeAll(() => {
    playlistManagementService.validatePlaylistBelongsToUser = jest.fn();
    playlistManagementService.validatePlaylistIsRegistred = jest.fn();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
    jest.restoreAllMocks();
    jest.clearAllTimers();
  });

  // TODO check that the timer object has been correctly deleted
  it("When the service is requested to unmanage the playlist, the timer for that playlist should cease running", async () => {
    // Arrange
    playlistManagementService.orderPlaylist = jest.fn();
    jest.spyOn(mockManagedPlaylist, "get").mockReturnValue(expect.anything());

    // Act
    await playlistManagementService.unmanagePlaylist("P1");

    // Assert
    expect(clearInterval).toHaveBeenCalledTimes(1);
    expect(mockManagedPlaylist.get).toHaveBeenCalledTimes(1);
    expect(mockManagedPlaylist.remove).toHaveBeenCalledTimes(1);
    expect(setInterval).toHaveBeenCalledTimes(0);
  });

  it("The function orderPlaylist should be called when no other orderPlaylist  is running for the same playlist", async () => {
    // Arrange
    // Learned the worst way: the async-lock library does not work with fake timers
    jest.useRealTimers();

    globalVariables.ORDER_PLAYLIST_INTERVAL = 100;
    const HALF_PLAYLIST_INTERVAL = globalVariables.ORDER_PLAYLIST_INTERVAL / 2;
    const ORDER_PLAYLIST_UNDER_INTERVAL = 1;
    const ORDER_PLAYLIST_OVER_INTERVAL =
      globalVariables.ORDER_PLAYLIST_INTERVAL + HALF_PLAYLIST_INTERVAL;
    const SIX_INTERVALS = globalVariables.ORDER_PLAYLIST_INTERVAL * 6;
    const FIVE_INTERVALS_AND_A_HALF = SIX_INTERVALS - HALF_PLAYLIST_INTERVAL;

    playlistManagementService.orderPlaylist = jest
      .fn()
      .mockImplementationOnce(() => sleep(ORDER_PLAYLIST_OVER_INTERVAL))
      .mockImplementation(() => sleep(ORDER_PLAYLIST_UNDER_INTERVAL));

    mockManagedPlaylist.add = jest.fn();

    const lockSpy = jest.spyOn(AsyncLock.prototype, "isBusy");

    // Act
    await playlistManagementService.managePlaylist("RFT1", "P1");
    await sleep(FIVE_INTERVALS_AND_A_HALF);

    // Assert
    expect(lockSpy).toHaveBeenCalledTimes(5);
    expect(lockSpy).nthReturnedWith(1, false);
    expect(lockSpy).nthReturnedWith(2, true);
    expect(lockSpy).nthReturnedWith(3, false);
    expect(lockSpy).nthReturnedWith(4, false);
    expect(lockSpy).nthReturnedWith(5, false);
    expect(mockManagedPlaylist.add).toHaveBeenCalledTimes(1);
    expect(playlistManagementService.orderPlaylist).toHaveBeenCalledTimes(4);

    jest.useFakeTimers();
  });
});
