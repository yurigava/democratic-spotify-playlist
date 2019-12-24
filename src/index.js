var express = require('express');
var order = require('./controllers/playlistOrder');
const args = require('yargs').argv;
const spotifyApi = require('./services/spotify')
var app = express();

const voteRoutes = require('./routes/vote')
const deviceRoutes = require('./routes/device')
const spotifyRoutes = require('./routes/spotify')

app.use('/vote', voteRoutes);
app.use('/device', deviceRoutes);
app.use('/spotify', spotifyRoutes)

app.start = () => {
  setInterval(() => { order.orderPlaylist(spotifyApi, args.playListId) }, 60 * 1000)
}

module.exports = app;
