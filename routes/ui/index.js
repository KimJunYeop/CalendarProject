var express = require('express');
var router = express.Router();

var redis = require('redis');
var client = redis.createClient(6379, "127.0.0.1");

/* GET home page. */
router.get('/', function (req, res, next) {
  // client.hset("hash key", "hashtest 1", "some value", redis.print);
  // client.hset('hash key', 'hashtest 2', 'some Test', redis.print);
  res.render('index', { title: 'Express' });
});


router.get('/calendar',function(req,res){
  res.render('calendar');
})


/* GET home page. */
router.post('/api/calendar', function (req, res) {
  console.log('post calendar!');
  // console.log(req.body);

  var subject = req.body.subject;
  var inputData = req.body;
  delete inputData.subject;

  console.log(subject);
  console.log(inputData);

  var result = {
      resCode: "false",
  }

  client.hmset("calendar", subject, JSON.stringify(inputData), redis.print);

  res.send(result);
});

router.post('/api/calendar/appointment',function(req,res) {
  var year = req.body.year;
  var month = req.body.month;

  var searchKey = year + month;
  console.log(searchKey);

  client.hkeys("calendar", function (err, replies) {
    console.log(replies.length + " replies:");
    if(err) {
      console.log(err);
      return;
    }
    replies.forEach(function (reply, i) {
        console.log("    " + i + ": " + reply);
        client.hget("calendar",reply,function(err,result) {
          var parseResult = JSON.parse(result);
          if(parseResult.dateStart.substr(0,6) == searchKey) {
            console.log('hihi');
          }
        })
    });
  });

  var result = {
    resCode: "false"
  }

  res.send(result);
});

module.exports = router;
