var express = require('express');
var router = express.Router();

var redis = require('redis');
var client = redis.createClient(6379,"127.0.0.1");

/* GET home page. */
router.get('/', function(req, res, next) {
  client.hset("hash key", "hashtest 1", "some value", redis.print);
  client.hset('hash key', 'hashtest 2', 'some Test', redis.print);
  client.hkeys("hash key", function (err, replies) {
  replies.forEach(function (reply, i) {
      console.log("    " + i + ": " + reply);
  });
  client.quit();
});

  res.render('index', { title: 'Express' });
});

module.exports = router;
