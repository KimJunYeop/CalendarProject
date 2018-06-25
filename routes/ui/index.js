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

	var _result = {
		resCode: "false",
	}
	inputData.id = 1;

	console.log(req.body);

	var multiInputData = new Array();
	new Promise(function (resolve, reject) {
		client.hexists("calendar", dateStart, function (err, reply) {
			if (err) reject(err);
			if (reply) {
				//이미 data가있다면 풀어헤쳐서 array에 집어넣는다.
				client.hget("calendar", dateStart, function (err, result) {
					if (err) reject(err);
					var resultArray = JSON.parse(result);
					for (var i = 0; i < resultArray.length; i++) {
						multiInputData.push(resultArray[i]);
					}
					inputData.id = resultArray.length + 1;
					multiInputData.push(inputData);
					client.hset('calendar', dateStart, JSON.stringify(multiInputData), function (err, reply) {
						if (err) reject(err);
						_result.resCode = 'true'
						resolve();
					});
				});
			} else {
				//data가 없다면 그냥 하나만 저장한다.
				multiInputData.push(inputData);
				client.hset("calendar", dateStart, JSON.stringify(multiInputData), function (err, reply) {
					if (err) reject(err);
					_result.resCode = 'true'
					resolve();
				});
			}
		})
	}).then(function () {
		res.send(_result);
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

	// var _promise = function (param) {
	// 	return new Promise(function (resolve, reject) {
	// 		// 비동기를 표현하기 위해 setTimeout 함수를 사용 
	// 		client.hkeys("calendar", function (err, replies) {

	// 		}
	// 	});
	// };

	new Promise(function (resolve, reject) {
		client.hkeys("calendar", function (err, replies) {
			if (err) reject(err)
			resolve(replies);
		})
	}).then(function (replies) {
		replies.forEach(function (reply, i) {
			client.hget("calendar", reply, function (err, result) {
				if (err) reject(err)
				var parseResult = JSON.parse(result);
				parseResult.dateStart = reply;
				// result에 hashkey값 추가
				if (parseResult.dateStart.substr(0, 6) == searchKey) {
					_result.appointment.push(parseResult);
					_result.resCode = 'true';
				}
				if ((i + 1) == replies.length) {
					res.send(_result);
				}
			})
		})
	}).catch(function (err) {
		console.log(err);
		return;
	});
});

//특정날짜 data조회
router.post('/api/calendar/specificDate', function (req, res) {
	console.log('/api/calendar/specificDate');
	var dateValue = req.body.startDate;
	var _result = {
		resCode: "false",
		resId: 0,
		resDate : []
	}

	var resultArray = new Array();

	var resultJSON = {};

	new Promise(function (resolve, reject) {
		client.hgetall('calendar', function(err, reply) {
			var a = Object.keys(reply);
			a.forEach(function(inner,i) {
				// i :index  reply : 값 
				var innerResult = JSON.parse(reply[inner]);
				var arr = new Array();
				innerResult.forEach(function(inner2,j){
					var inner2Json = {
						days : "" , 
						id : 0
					};
					getMiddleDays2(inner2.dateStart,inner2.dateEnd,dateValue,inner2.id,function(resultDay,resultId){
						var resultValue = {
							"resultDay" : resultDay,
							"resultId" : resultId
						}
						resultArray.push(resultValue); 
					});

					inner2Json.days =  getMiddleDays(inner2.dateStart,inner2.dateEnd);
					inner2Json.id = inner2.id;
					arr.push(inner2Json);
					// resultArray.push(inner2JSON);
					resultJSON[inner] = arr;
				});
				// console.log('=== result aRray  ====');
				// console.log(resultArray);
			})
			console.log('Result!!!!!#####');
			console.log(resultArray);
			resolve(resultJSON);
		})
		// client.hget('calendar',  function (err, reply) {
		// 	console.log('###');
		// 	console.log(reply);
		// 	if (err) reject(err);
		// 	if (reply == null) {
		// 		_result.resCode = "empty";
		// 	} else {
		// 		_result.resCode = "success";
		// 		_result.replyData = reply;
		// 	}
		// 	resolve();
		// });
	}).then(function (resultJSON) {
		console.log('####');
		console.log(resultJSON);
		// res.send(_result);
	}).catch(function (err) {
		console.log(err);
		return;
	})

	console.log(req.body);
});

function getMiddleDays(dateStart, dateEnd){
	console.log(dateStart, dateEnd);
	var result = new Array();
	for(var i = dateStart ; i <= dateEnd ; i++) {
		result.push(i);
	}
	return result;
}

function getMiddleDays2(dateStart,dateEnd,dateValue,dateId,getresult) {
	for(var i = dateStart; i <= dateEnd ; i++) {
		if(i == dateValue) {
			getresult(dateStart,dateId);
		}
	}
}

//id를 이용한 특정 data 도출
router.post('/api/calendar/getValueById', function (req, res) {
	console.log('/api/calendar/getValueById');
	console.log(req.body);
	var date = req.body.date;
	var id = req.body.id;

	var _result = {
		resCode: "false"
	};

	new Promise(function (resolve, reject) {
		client.hget('calendar', date, function (err, reply) {
			if (err) reject(err);
			var parseReply = JSON.parse(reply);
			for (var i = 0; i < parseReply.length; i++) {
				if (parseReply[i].id == id) {
					_result.reply = parseReply[i];
					_result.resCode = "success";
					resolve();
				}
			}
		})
	}).then(function () {
		res.send(_result);
	}).catch(function (err) {
		console.log(err);
		return;
	})
});

// id를 이용한 delete
router.post('/api/calendar/delete', function (req, res) {
	console.log('/api/calendar/delete');

	var date = req.body.startDate;
	var id = req.body.id;

	client.hget('calendar', date, function (err, reply) {
		var replyRedis = JSON.parse(reply);
		for (var i = 0; i < replyRedis.length; i++) {
			if (id == replyRedis[i].id) {
				replyRedis.splice(i, 1);
			}
		}
		client.hset('calendar', date, JSON.stringify(replyRedis));
	})
})

// id를 이용한 update
router.post('/api/calendar/update', function (req, res) {
	console.log('/api/calendar/update');
	console.log('###');
	console.log(req.body);
	var date = req.body.dateStart;
	var id = parseInt(req.body.id);
	req.body.id = parseInt(req.body.id);
	var inputData = req.body;

	client.hget('calendar', date, function (err, reply) {
		var replyRedis = JSON.parse(reply);
		for (var i = 0; i < replyRedis.length; i++) {
			console.log('$$$');
			console.log(typeof replyRedis[i].id);
			if (id == replyRedis[i].id) {
				replyRedis.splice(i, 1);
			}
		}
		replyRedis.push(inputData);
		client.hset('calendar', date, JSON.stringify(replyRedis));
	})
})

module.exports = router;