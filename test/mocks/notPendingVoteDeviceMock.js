const deviceMock = (deviceId) => {
  const mockTimeout = setTimeout(() => {

  }, 1000);

  return { pendingVote: false, deviceRefreshTimeout: mockTimeout }
}

module.exports = deviceMock;
