const SpotifyWebApi = require('spotify-web-api-node');
const args = require('yargs').argv;

const redirectUri = 'http://localhost:8080/spotify/callback';
const clientId = '15da8140bcdf44c698fa7a731f39ab44';

const spotifyApi = new SpotifyWebApi({
  redirectUri: redirectUri,
  clientId: clientId,
  clientSecret: args.clientSecret
});

module.exports = spotifyApi;
