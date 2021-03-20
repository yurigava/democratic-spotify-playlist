const SpotifyWebApi = require('spotify-web-api-node')

class SpotifyClientWrapper {
  constructor (credentials) {
    this.spotifyApi = new SpotifyWebApi(credentials)
  }

  async authenticate (code) {
    const data = await this.spotifyApi.authorizationCodeGrant(code).catch((err) => {
      console.log('Something went wrong!', err)
    })

    if (data) {
      console.log(data.body)
      return data.body
    } else {
      console.log('Please Login')
      return ['', '']
    }
  }

  createAuthorizeURL (scopes, state) {
    return this.spotifyApi.createAuthorizeURL(scopes, state)
  }

  retrievePlaylistTracks (playlistId) {
    const offsetCounter = 0
    return this.spotifyApi
      .getPlaylistTracks(playlistId, {
        offset: offsetCounter,
        fields: 'items(added_at, added_by.id,track(id))'
      })
      .then(
        function (data) {
          return data.body
        },
        function (err) {
          console.log('Error while retrieving playlist tracks!', err)
        }
      )
  }

  retrievePlaylistSnapshotId (playlistId) {
    return this.spotifyApi.getPlaylist(playlistId, { fields: 'snapshot_id' }).then(
      function (data) {
        return data.body?.snapshot_id ?? ''
      },
      function (err) {
        console.log(
          'Error while fetching information of the playlist tracks!',
          err
        )
        // Exception here
      }
    )
  }

  retrieveCurrentTrackId () {
    return this.spotifyApi.getMyCurrentPlaybackState().then(
      function (data) {
        return data.body.item?.id ?? ''
      },
      function (err) {
        console.log('Error while getting User´s playback state!', err)
        return ''
      }
    )
  }

  retrieveCurrentUserProfile () {
    return this.spotifyApi.getMe().then(
      function (data) {
        return data.body ?? {}
      },
      function (err) {
        console.log('Error while getting User Profile!', err)
        return ''
      }
    )
  }

  retrieveUserPlaylists () {
    return this.spotifyApi.getUserPlaylists().then(
      function (data) {
        return data.body?.items ?? []
      },
      function (err) {
        console.log('Error while retriever User Playlists!', err)
        return ''
      }
    )
  }

  reorderTracksInPlaylist (playlistId, positionInCurentPlaylist, positionInOrderedPlaylist, options) {
    this.spotifyApi.reorderTracksInPlaylist(playlistId, positionInCurentPlaylist, positionInOrderedPlaylist, options)
  }
}

module.exports = SpotifyClientWrapper
