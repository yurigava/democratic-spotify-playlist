const spotifyAuthenticationService = require("./spotifyAuthenticationService");

async function getPlaylists(options, refreshToken) {
  const spotifyApi =
    await spotifyAuthenticationService.provideAuthenticatedClient(refreshToken);
  let userPlaylists = spotifyApi.retrieveUserPlaylists();

  if (options.mine) {
    const userId = (await spotifyApi.retrieveCurrentUserProfile()).id;
    userPlaylists = (await userPlaylists).filter(
      (playlist) => playlist.owner.id === userId
    );
  }

  if (options.collaborative) {
    userPlaylists = (await userPlaylists).filter(
      (playlist) => playlist.collaborative
    );
  }

  return { playlists: await userPlaylists };
}

module.exports = {
  getPlaylists,
};
