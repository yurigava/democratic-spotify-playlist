/* eslint-env jest */
jest.mock('../../src/services/spotifyClientWrapper')
const SpotifyClientWrapper = require('../../src/services/spotifyClientWrapper')

jest.mock('../../src/data/authenticatedUsers')
const authenticatedUsers = require('../../src/data/authenticatedUsers')

const spotifyAuthenticationService = require('../../src/services/spotifyAuthenticationService')

describe('Client provision', () => {
  const EXPIRATION_TIMESTAMP = '2020-01-01T00:50:00.000Z'
  const REFRESHED_EXPIRATION_TIMESTAMP = '2020-01-01T01:50:00.000Z'
  const JUST_BEFORE_TOKEN_EXPIRATION_TIMESTAMP = '2020-01-01T00:49:59.000Z'
  const USER_AUTHENTICATION_INFO = { refreshToken: 'RFT1', accessToken: 'ACT1', expirationTime: EXPIRATION_TIMESTAMP }
  const REFRESHED_AUTHENTICATION_INFO = { refreshToken: 'RFT1', accessToken: 'ACT2', expirationTime: REFRESHED_EXPIRATION_TIMESTAMP }

  beforeEach(() => {
    authenticatedUsers.get.mockReturnValue(USER_AUTHENTICATION_INFO)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('provideAuthenticatedClient should return a client with access token and refresh token when token is not about to expire', async () => {
    // Arrange
    jest.spyOn(global.Date, 'now').mockReturnValue(new Date(JUST_BEFORE_TOKEN_EXPIRATION_TIMESTAMP).getTime())

    // Act
    spotifyAuthenticationService.provideAuthenticatedClient('RFT1')

    // Assert
    expect(SpotifyClientWrapper).toHaveBeenCalledTimes(1)
    expect(SpotifyClientWrapper).toHaveBeenCalledWith(USER_AUTHENTICATION_INFO)
    expect(SpotifyClientWrapper.mock.instances[0].refreshToken).toHaveBeenCalledTimes(0)
  })

  it('provideAuthenticatedClient should return a client with new access token and refresh token when the token is about to expire', async () => {
    // Arrange

    jest.spyOn(global.Date, 'now').mockReturnValue(new Date(EXPIRATION_TIMESTAMP).getTime())

    const mockRefreshToken = jest.fn().mockImplementation(() => {
      return { refreshToken: 'RFT1', accessToken: 'ACT2', expirationTime: REFRESHED_EXPIRATION_TIMESTAMP }
    })

    SpotifyClientWrapper.mockImplementation(() => {
      return { refreshToken: mockRefreshToken }
    })

    // Act
    spotifyAuthenticationService.provideAuthenticatedClient('RFT1')

    // Assert
    expect(SpotifyClientWrapper).toHaveBeenCalledTimes(2)
    expect(SpotifyClientWrapper).toHaveBeenNthCalledWith(1, USER_AUTHENTICATION_INFO)
    expect(SpotifyClientWrapper).toHaveBeenNthCalledWith(2, REFRESHED_AUTHENTICATION_INFO)
    expect(mockRefreshToken).toHaveBeenCalledTimes(1)
  })
})
