const deviceMock = (deviceId) => {
  return new Map(
    [['1', { pendingVote: false }],
    ['2', { pendingVote: false }],
    ['3', { pendingVote: true }],
    ['4', { pendingVote: true }]]
  )
}

module.exports = deviceMock;
