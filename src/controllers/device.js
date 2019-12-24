const deviceService = require('../services/device')

const registerDevice = (deviceId) => {
  const device = deviceService.getDevice(deviceId);
  if (device !== undefined) {
    device.deviceRefreshTimeout.refresh();
    return true;
  } else {
    const deviceRefreshTimeout = module.exports.createRefresherTimeOut(deviceId);
    deviceInfo = { deviceRefreshTimeout, pendingVote: true };
    deviceService.addDevice(deviceId, deviceInfo);
    return false;
  }
};

const createRefresherTimeOut = (deviceId) => {
  return setTimeout(() => {
    deviceService.deleteDevice(deviceId)
  }, 60000);
};


module.exports.registerDevice = registerDevice;
module.exports.createRefresherTimeOut = createRefresherTimeOut;
