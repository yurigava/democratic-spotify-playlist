var SpotifyWebApi = require('spotify-web-api-node');
var express = require('express');
var order = require('./playlistOrder');
var voteSkip = require('./voteSkip');
const args = require('yargs').argv;
var app = express();

var scopes = ['user-read-private', 'user-read-playback-state', 'playlist-modify-public',
  'playlist-modify-private'],
  redirectUri = 'http://localhost:8080/callback',
  clientId = 'b87fd794fa18420d8a73507fd3d93989',
  clientSecret = args.secret,
  state = null;

var spotifyApi = new SpotifyWebApi({
  redirectUri: redirectUri,
  clientId: clientId,
  clientSecret: clientSecret
});

app.get('/secret-login', (req, res) => {
  var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
  res.redirect(authorizeURL);
})

app.get('/callback', async (req, res) => {
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

app.get('/current', async (req, res) => {
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

app.get('/register', async (req, res) => {

  if (voteSkip.registerDevice(req.header("deviceId"))) {
    res.statusCode = 200;
  } else {
    res.statusCode = 201;
  }
  ''
  res.send();
})

app.get('/voteskip', async (req, res) => {

  if (voteSkip.registerVote(req.header("deviceId"))) {
    res.statusCode = 200;
    res.json({ message: 'Vote skip succesfuly registred' });
  } else {
    res.statusCode = 401;
    res.json({ message: 'Device not registred' })
  }

  res.send();
})

setInterval(() => { order.orderPlaylist(spotifyApi, args.playlistId) }, 6 * 1000)

module.exports = app;