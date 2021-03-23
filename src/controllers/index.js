const voteSkipService = require('../services/voteSkipService')
const spotifyAuthenticationService = require('../services/spotifyAuthenticationService')
const spotifyPlaylistManagementService = require('../services/playlistManagementService')

function login (req, res) {
  res.redirect(spotifyAuthenticationService.createAuthorizeURL())
}

async function callback (req, res) {
  const authenticationData = await spotifyAuthenticationService.authenticate(req.query.code)
  res.cookie('DP_RFT', authenticationData.refreshToken)
  res.send({ message: 'You are successfully logged in' })
}

function register (req, res) {
  if (voteSkipService.registerDevice(req.header('deviceId'))) {
    res.statusCode = 200
  } else {
    res.statusCode = 201
  }
  res.send()
}

function voteskip (req, res) {
  if (voteSkipService.registerVote(req.header('deviceId'))) {
    res.statusCode = 200
    res.json({ message: 'Vote skip succesfuly registred' })
  } else {
    res.statusCode = 401
    res.json({ message: 'Device not registred' })
  }

  res.send()
}

async function addPlaylist (req, res) {
  await spotifyPlaylistManagementService.managePlaylist(req.body.playlistId, req.cookies.DP_RFT)
  res.statusCode = 201
  res.json({ message: 'Playlist Added' })
}

async function removePlaylist (req, res) {
  await spotifyPlaylistManagementService.unmanagePlaylist(req.body.playlistId, req.cookies.DP_RFT)
  res.statusCode = 200
  res.json({ message: 'Playlist Removed' })
}

module.exports = {
  login,
  callback,
  voteskip,
  register,
  addPlaylist,
  removePlaylist
}
