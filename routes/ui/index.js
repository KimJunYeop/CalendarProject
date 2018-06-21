var express = require('express');
var router = express.Router();
var redis = require('redis');
var client = redis.createClient(6379, "127.0.0.1");


router.get('/calendar', function (req, res) {
	res.render('calendar');
})

/* 
 * Data Input Post.
 */
router.post('/api/calendar', function (req, res) {
	console.log('/api/calendar');
	var dateStart = req.body.dateStart;
	var inputData = req.body;
	// delete inputData.dateStart;

	var result = {
		resCode: "false",
	}
	inputData.id = 1;

	var multiInputData = new Array();
	new Promise(function (resolve, reject) {
		client.hexists("calendar", dateStart, function (err, reply) {
			if (err) reject(err);
			if (reply) {
				//이미 data가있다면 풀어헤쳐서 array에 집어넣는다.
				client.hget("calendar", dateStart, function (err, result) {
          if(err) reject(err);
					var resultArray = JSON.parse(result);
					for(var i = 0 ; i < resultArray.length; i++) {
						multiInputData.push(resultArray[i]);
					}
					inputData.id = resultArray.length + 1;
					multiInputData.push(inputData);
					client.hset('calendar',dateStart,JSON.stringify(multiInputData),function(err,reply){
            if(err) reject(err);
            resolve();
          });
				});
			} else {
				//data가 없다면 그냥 하나만 저장한다.
				multiInputData.push(inputData);
				client.hset("calendar", dateStart, JSON.stringify(multiInputData),function(err,reply){
          if(err) reject(err);
			  	resolve();
        });
			}
		})
	}).then(function () {
		res.send(result);
	}).catch(function (err) {
		console.log(err);
		return;
	});
});

//날짜별로 약속 조회
router.post('/api/calendar/appointment', function (req, res) {
	console.log('/api/calendar/appointment');
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
					// result에 hashkey값 추가
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
		res.send(_result);
	}).catch(function (err) {
		console.log(err);
		res.send(_result);
		return;
	});
});

//특정날짜 data조회
router.post('/api/calendar/specificDate', function (req, res) {
  console.log('/api/calendar/specificDate');
  var dateValue = req.body.startDate;
  var _result = {
    resCode : "false"
  }

  new Promise(function (resolve,reject){
    client.hget('calendar',dateValue,function(err,reply){
      if(err) reject(err);
      if(reply == null) { 
        _result.resCode = "empty";
      } else {
        _result.resCode = "success";
        _result.replyData = reply;
      }
      resolve();
    });
  }).then(function(){
    res.send(_result);
  }).catch(function(err){
    console.log(err);
    return;
  })

  console.log(req.body);
});

//id를 이용한 특정 data 도출
router.post('/api/calendar/getValueById',function(req,res){ 
	console.log('/api/calendar/getValueById');
	console.log(req.body);
	var date = req.body.date;
	var id = req.body.id;

	var _result = {
		resCode : "false"
	};

	new Promise(function (resolve,reject) {
		client.hget('calendar',date,function(err,reply){
			if(err) reject(err);
			var parseReply = JSON.parse(reply);
			for(var i = 0 ; i < parseReply.length ; i ++) { 
				if(parseReply[i].id == id) {
					_result.reply = parseReply[i];
					_result.resCode = "success";
					resolve();
				}
			}			
		})
	}).then(function(){
		res.send(_result);
	}).catch(function(err){
		console.log(err);
		return;
	})
});

// id를 이용한 delete
router.post('/api/calendar/delete',function(req,res){
	console.log('/api/calendar/delete');

	var date = req.body.startDate;
	var id = req.body.id;

	client.hget('calendar',date,function(err,reply){
		var replyRedis = JSON.parse(reply);
		for(var i = 0 ; i < replyRedis.length ; i ++) {
			if(id == replyRedis[i].id){
				replyRedis.splice(i,1);
			}
		}
		client.hset('calendar',date,JSON.stringify(replyRedis));
	})
})

// id를 이용한 update
router.post('/api/calendar/update',function(req,res) {
	console.log('/api/calendar/update');
	console.log('###');
	console.log(req.body);
	var date = req.body.dateStart;
	var id = parseInt(req.body.id);
	req.body.id = parseInt(req.body.id);
	var inputData = req.body;

	client.hget('calendar',date,function(err,reply){
		var replyRedis = JSON.parse(reply);
		for(var i = 0 ; i < replyRedis.length ; i ++) {
			console.log('$$$');
			console.log(typeof replyRedis[i].id);
			if(id == replyRedis[i].id){
				replyRedis.splice(i,1);
			}
		}
		replyRedis.push(inputData);
		client.hset('calendar',date,JSON.stringify(replyRedis));
	})
})

module.exports = router;