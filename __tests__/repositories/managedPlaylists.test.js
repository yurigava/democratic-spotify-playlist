/* eslint-env jest */
const PersistenceError = require('../../src/errors/PersistenceError')

const managedPlaylists = require('../../src/repositories/managedPlaylists')

it('Geting a playlist timer whose refresh token was added previously should return the timer', async () => {
  // Arrange
  managedPlaylists.add('P1', expect.anything())

  // Act
  const authenticationData = managedPlaylists.get('P1')

  // Assert
  expect(authenticationData).toStrictEqual(expect.anything())
})

it('Geting a playlist timer whose playlistId was not added previously should return a falsy value', async () => {
  // Act
  const authenticationData = managedPlaylists.get('NP1')

  // Assert
  expect(authenticationData).toBeFalsy()
})

it('Geting a playlist timer whose playlistId is not a string should return a falsy value', async () => {
  // Act
  const authenticationData = managedPlaylists.get(undefined)

  // Assert
  expect(authenticationData).toBeFalsy()
})

it('Adding a playlist whose playlistId is different than a string should throw PersistenceError error', async () => {
  // Act - Assert
  expect(() => managedPlaylists.add(undefined, expect.anything())).toThrow(PersistenceError)
  expect(() => managedPlaylists.add(undefined, expect.anything())).toThrow('Unable to persist a playlist timer with playlistId different than a string. Instead it was [undefined]')
})

it('Geting playlist timer that was removed should return undefined', async () => {
  // Arrange
  managedPlaylists.add('P2', expect.anything())

  // Act
  managedPlaylists.remove('P2')
  const playlistTimer = managedPlaylists.get('P2')

  // Assert
  expect(playlistTimer).toBeFalsy()
})
