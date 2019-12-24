const deviceMock = (deviceId) => {
  const mockTimeout = setTimeout(() => {

  }, 1000);

  return { pendingVote: true, deviceRefreshTimeout: mockTimeout }
}

module.exports = deviceMock;
