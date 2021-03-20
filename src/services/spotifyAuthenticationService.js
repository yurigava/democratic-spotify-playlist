const SpotifyClientWrapper = require('./spotifyClientWrapper')

const credentials = {
  redirectUri: process.env.SPOTIFY_CALLBACK,
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET
}

const scopes = [
  'user-read-private',
  'user-read-playback-state',
  'playlist-modify-public',
  'playlist-modify-private'
]

const state = null

const authenticated = {}

async function authenticate (code) {
  const spotifyApi = new SpotifyClientWrapper(credentials)
  const accessData = await spotifyApi.authenticate(code)

  const expirationTime = Date.now() + accessData.expires_in * 1000
  const expirationDate = new Date()
  expirationDate.setTime(expirationTime)

  authenticated[accessData.refresh_token] = {
    access_token: accessData.access_token,
    refresh_token: accessData.refresh_token,
    expirationDate: expirationDate
  }
}

function createAuthorizeURL () {
  const spotifyApi = new SpotifyClientWrapper(credentials)
  return spotifyApi.createAuthorizeURL(scopes, state)
}

function provideAuthenticatedClient (refreshToken) {
  // TODO verify token validity and if it is not valid refresh it
  return new SpotifyClientWrapper(authenticated[refreshToken])
}

module.exports = {
  authenticate,
  createAuthorizeURL,
  provideAuthenticatedClient
}
