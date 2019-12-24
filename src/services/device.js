const deviceTracking = new Map();

const getDevice = (deviceId) => deviceTracking.get(deviceId);

const getDevices = () => deviceTracking;

const addDevice = (deviceId, deviceInfo) => deviceTracking.set(deviceId, deviceInfo);

const deleteDevice = (deviceId) => deviceTracking.delete(deviceId)

const resetVotingStatus = () => {
  for (const [deviceId, device] of deviceTracking) {
    device.pendingVote = true;
  }
}

module.exports.getDevice = getDevice;
module.exports.getDevices = getDevices;
module.exports.addDevice = addDevice;
module.exports.deleteDevice = deleteDevice;
module.exports.resetVotingStatus = resetVotingStatus;
