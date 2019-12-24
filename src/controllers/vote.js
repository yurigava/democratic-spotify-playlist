const deviceService = require('../services/device')
const spotifyApi = require('../services/spotify')

const HALF = 0.50;

const registerVote = (deviceId) => {
  device = deviceService.getDevice(deviceId)
  if (device && device.pendingVote) {
    device.pendingVote = false;

    if (module.exports.didSkipWin()) {
      spotifyApi.skipToNext(() => deviceService.resetVotingStatus());
    }

    return true;
  } else {
    return false;
  }
};

const didSkipWin = () => {
  const totalVotes = module.exports.totalVotes();

  if (totalVotes > 0) {
    const numberOfSkipVotes = module.exports.votesInFavour();
    return (numberOfSkipVotes / totalVotes) > HALF;
  }

  return false;
}

const votesInFavour = () => {
  const voteStatuses = [...deviceService.getDevices().values()].map(device => device.pendingVote);
  return voteStatuses.filter(status => !status).length
}

const totalVotes = () => {
  return deviceService.getDevices().size;
}

module.exports.registerVote = registerVote;
module.exports.didSkipWin = didSkipWin;
module.exports.votesInFavour = votesInFavour;
module.exports.totalVotes = totalVotes;
