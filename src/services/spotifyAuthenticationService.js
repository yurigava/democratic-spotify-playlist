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

const spotifyApi = new SpotifyClientWrapper(credentials)

async function authenticate (code) {
  const [accessToken, refreshToken] = await spotifyApi.authenticate(code)
  authenticated[refreshToken] = accessToken
}

function createAuthorizeURL () {
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
