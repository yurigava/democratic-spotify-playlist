var SpotifyWebApi = require('spotify-web-api-node');
var express = require('express');
var order = require('./playlistOrder')
const args = require('yargs').argv;
var app = express();
var PORT=8080;
var scopes = ['user-read-private', 'user-read-playback-state', 'playlist-modify-public',
    'playlist-modify-private'],
  redirectUri = 'http://localhost:8080/callback',
  clientId = 'b87fd794fa18420d8a73507fd3d93989',
  clientSecret= args.secret,
  state = null;

var spotifyApi = new SpotifyWebApi({
  redirectUri: redirectUri,
  clientId: clientId,
  clientSecret: clientSecret
});

app.get('/', (req, res) => {
      var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
      res.redirect(authorizeURL);
})

app.get('/callback', async (req, res) => {
    res.send('You are successfully logged in');
    var data = await spotifyApi.authorizationCodeGrant(req.query.code)
        .catch((err) => {
            console.log('Something went wrong!', err);
        });
    if(data) {
        console.log(data.body)
        spotifyApi.setAccessToken(data.body['access_token']);
        spotifyApi.setRefreshToken(data.body['refresh_token']);
    } else {
        console.log('Please Login')
    }
})

app.get('/current', async (req,res) => {
    var current = await spotifyApi.getMyCurrentPlaybackState({
    })
        .catch((err) => {
            console.log('Something went wrong!', err);
        });
    if(current) {
        res.send(current.body);
    } else {
        res.send('You are not logged.')
    }
})

app.listen(PORT, () => {
    console.log(`app listening on port: ${PORT}`)
})

setInterval(() => { order.orderPlaylist(spotifyApi, args.playlistId) }, 2 * 60 * 1000)