const express = require('express')

const deviceController = require('../controllers/device')

const router = express.Router();

router.post('/register', (req, res) => {
  const deviceId = req.header('deviceId');

  if (!deviceId) {
    res.statusCode = 400;
  }
  else if (deviceController.registerDevice(req.header("deviceId"))) {
    res.statusCode = 200;
  } else {
    res.statusCode = 201;
  }

  res.send();
})

module.exports = router
