var express = require('express');
var router = express.Router();
var redis = require('redis');
var client = redis.createClient(6379, "127.0.0.1");

/* GET home page. */
router.get('/', function (req, res, next) {
  // client.hset("hash key", "hashtest 1", "some value", redis.print);
  // client.hset('hash key', 'hashtest 2', 'some Test', redis.print);
  res.render('index', {
    title: 'Express'
  });
});


router.get('/calendar', function (req, res) {
  res.render('calendar');
})

/* GET home page. */
router.post('/api/calendar', function (req, res) {
  // console.log(req.body);
  var dateStart = req.body.dateStart;
  var inputData = req.body;
  delete inputData.dateStart;

  var result = {
    resCode: "false",
  }

  client.hset("calendar", dateStart, JSON.stringify(inputData), redis.print);
  res.send(result);
});

//날짜별로 약속 조회
router.post('/api/calendar/appointment', function (req, res) {
  var _result = {
    resCode: "false",
    appointment: []
  }
  var year = req.body.year;
  var month = req.body.month;
  var searchKey = year + month;

  new Promise(function (resolve, reject) {
    client.hkeys("calendar", function (err, replies) {
      if (err) reject(err)
      replies.forEach(function (reply, i) {
        client.hget("calendar", reply, function (err, result) {
          if (err) reject(err)
          var parseResult = JSON.parse(result);
          parseResult.dateStart = reply;
          //result에 hashkey값 추가
          // parseResult.subject = reply;
          if (parseResult.dateStart.substr(0, 6) == searchKey) {
            _result.appointment.push(parseResult);
            _result.resCode = 'true';
          }
          resolve(_result);
        })
      })
    })
  }).then(function (_result) {
    console.log(_result);
    res.send(_result);
  }).catch(function(err) {
    console.log(err);
    res.send(_result);
    return;
  });
});

module.exports = router;