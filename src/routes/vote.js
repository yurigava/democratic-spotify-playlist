const express = require('express');

const voteController = require('../controllers/vote');

const router = express.Router();

router.post('/register', (req, res) => {

  deviceId = req.header('deviceId');
  if (deviceId === undefined) {
    res.status(400).json({ message: 'No deviceId header provided' });
  } else if (voteController.registerVote(req.header('deviceId'))) {
    res.status(200).json({ message: 'Vote skip succesfuly registered' });
  } else {
    res.status(401).json({ message: 'Device not registered' })
  }
})

router.get('/status', (req, res) => {

  const votesInFavour = voteController.votesInFavour();
  const totalVotes = voteController.totalVotes();

  res.status(200).json({ votesInFavour, totalVotes })
})

module.exports = router;
