const express = require('express');

const spotifyApi = require('../services/spotify')

const router = express.Router();

var scopes = ['user-read-private', 'user-read-playback-state', 'playlist-modify-public',
  'playlist-modify-private', 'user-modify-playback-state'];

var state = null;

router.get('/secret-login', (req, res) => {
  var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
  res.redirect(authorizeURL);
})

router.get('/callback', async (req, res) => {
  res.send('You are successfully logged in.');
  var data = await spotifyApi.authorizationCodeGrant(req.query.code)
    .catch((err) => {
      console.log('Something went wrong!', err);
    });
  if (data) {
    console.log(data.body)
    spotifyApi.setAccessToken(data.body['access_token']);
    spotifyApi.setRefreshToken(data.body['refresh_token']);
    setInterval(() => spotifyApi.refreshAccessToken().then(
      function (data) {
        console.log('The access token has been refreshed!');
        spotifyApi.setAccessToken(data.body['access_token']);
      },
      function (err) {
        console.log('Could not refresh access token', err);
      }
    ), data.body['expires_in'] * 500)
  } else {
    console.log('Please Login')
  }
})

router.get('/current', async (req, res) => {
  var current = await spotifyApi.getMyCurrentPlaybackState({
  })
    .catch((err) => {
      console.log('Something went wrong!', err);
    });
  if (current) {
    res.send(current.body);
  } else {
    res.send('You are not logged.')
  }
})

module.exports = router;
