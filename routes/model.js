var express = require('express');
var router = express.Router();

var modelController = require('../controllers/modelController')

// PUT /download
router.post('/', function(req, res, next) {
  // if(!req.body.etag){
  //   res.sendStatus(400)
  // }

  req.on('data', function (chunk) {
      body += chunk;
  });

  req.on('end', function () {
    modelController.newModel(JSON.parse(body)).then((modelConfig) => {
      if (!modelConfig) {
        res.sendStatus(400);
        return;
      }
      
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(CommandObject));
    })
  });
});

// POST /model-data
router.post('/config', function(req, res, next) {
  
  request.on('data', function (chunk) {
    body += chunk;
  });

  request.on('end', () => {
    modelController.setConfig(JSON.parse(body)).then((fulfilledResult) => {
      result.status = 200;
      result.end();

    }, (rejectedResult) => {
        // TODO: error handling
        console.error(rejectedResult);

        // XXX: is this the most appropriate status code?
        result.status = 400;
        result.end();
    });
  });
});

// GET /model-data
router.get('/config', function(req, res, next) {
  modelController.getConfig();
});

// GET /connect-rtc
router.post('/config/subscription', function(req, res, next) {
  // connectSignalR
  let address = request.connection.remoteAddress;
  try {
    modelController.subscribeConfig(address)
    result.statusCode = 200;
  }
  catch (error) {
      // TODO: throw error from ModelDataClient when the url is bad and it doesn't connect,
      // or maybe just check modelDataClient.connected instead of using try/catch? 
      result.statusCode = 400;
      console.log(error);
  }

  result.setHeader('Content-Type', 'application/json');
  result.end(JSON.stringify(connectionStatus));
});




module.exports = router;
