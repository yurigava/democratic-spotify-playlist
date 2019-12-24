const voteController = require('../../src/controllers/vote');
const deviceService = require('../../src/services/device');
const pendingVoteDeviceMock = require('../mocks/pendingVoteDeviceMock');
const notPendingVoteDeviceMock = require('../mocks/notPendingVoteDeviceMock');
const winningVote_3outOf4 = require('../mocks/winningVote_3outOf4');
const spotifyService = require('../../src/services/spotify');

describe('Vote registration tests', () => {

  it('A registered device should be able to vote kick', async (done) => {
    const spyGetDevice = jest.spyOn(deviceService, 'getDevice').mockImplementation((deviceId) => pendingVoteDeviceMock());

    expect(voteController.registerVote("XXXX4")).toBe(true);
    done();
  })

  it('A registered device should not be able to vote kick twice', async () => {
    const spyGetDevice = jest.spyOn(deviceService, 'getDevice').mockImplementation((deviceId) => notPendingVoteDeviceMock());

    expect(voteController.registerVote("XXXX51")).toBe(false);
  })

  it('An unregistered device should not be able to vote kick ', async () => {
    const spyGetDevice = jest.spyOn(deviceService, 'getDevice').mockImplementation((deviceId) => undefined);

    expect(voteController.registerVote("XXXX5")).toBe(false);
  })


  afterEach(() => {
    jest.clearAllMocks();
  })

  it.todo('//TODO not huge importance - The vote kick from a device that just became unregistered should be withdrawn')
})


describe('Vote evaluation', () => {

  it('Should return false when no device is registered', async () => {
    expect(voteController.didSkipWin()).toBe(false);
  })

  it('Should return true when more than half the registered devices registered vote', async () => {
    const devicesMock = require('../mocks/winningVote_3outOf4');
    const spyGetDevices = jest.spyOn(deviceService, 'getDevices').mockImplementation((deviceId) => devicesMock());

    expect(voteController.didSkipWin()).toBe(true);
  })

  it('Should return false when half the registered devices registered vote', async () => {
    const devicesMock = require('../mocks/losingVote_2outOf4');
    const spyGetDevices = jest.spyOn(deviceService, 'getDevices').mockImplementation((deviceId) => devicesMock());

    expect(voteController.didSkipWin()).toBe(false);
  })

  it('Should call the Spotify api when "skip" wins ', async () => {
    const spyGetDevice = jest.spyOn(deviceService, 'getDevice').mockImplementation((deviceId) => pendingVoteDeviceMock());
    const spyDidSkipWin = jest.spyOn(voteController, 'didSkipWin').mockImplementation(() => true);
    const spySpotifySkip = jest.spyOn(spotifyService, 'skipToNext').mockImplementation(() => undefined)

    voteController.registerVote("Device")

    expect(spySpotifySkip).toHaveBeenCalled();
  })

  it('Should return zero votes in favour when there are no votes registered ', async () => {
    const spyGetDevices = jest.spyOn(deviceService, 'getDevices').mockImplementation((deviceId) => new Map());

    const votesInFavour = voteController.votesInFavour();

    expect(votesInFavour).toBe(0);
  })

  it('Should return zero total votes when there are no votes registered ', async () => {
    const spyGetDevices = jest.spyOn(deviceService, 'getDevices').mockImplementation((deviceId) => new Map());

    const totalVotes = voteController.totalVotes();

    expect(totalVotes).toBe(0);
  })

  it('Should return the number of votes in favour when there are votes registered ', async () => {
    const spyGetDevices = jest.spyOn(deviceService, 'getDevices').mockImplementation((deviceId) => winningVote_3outOf4());

    const votesInFavour = voteController.votesInFavour();

    expect(votesInFavour).toBe(3);
  })

  it('Should return the number of total votes when there are votes registered ', async () => {
    const spyGetDevices = jest.spyOn(deviceService, 'getDevices').mockImplementation((deviceId) => winningVote_3outOf4());

    const totalVotes = voteController.totalVotes();

    expect(totalVotes).toBe(4);
  })

  afterEach(() => {
    jest.clearAllMocks();
  })
})
