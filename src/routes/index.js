const express = require('express')
const asyncHandler = require('express-async-handler')

const authenticationService = require('../services/spotifyAuthenticationService')
const UserNotAuthenticatedError = require('../errors/UserNotAuthenticatedError')

const index = require('../controllers/index')
const router = express.Router()

router.get('/secret-login', index.login)
router.get('/callback', index.callback)
router.get('/register', index.register)
router.get('/voteskip', index.voteskip)
router.post('/playlist', ensureSpotifyAuthentication, asyncHandler(index.addPlaylist))
router.delete('/playlist', ensureSpotifyAuthentication, asyncHandler(index.removePlaylist))

function ensureSpotifyAuthentication (req, res, next) {
  if (!authenticationService.isUserAuthenticated(req.cookies.DP_RFT)) {
    throw new UserNotAuthenticatedError()
  }

  return next()
}

module.exports = router
