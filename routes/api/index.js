var express = require('express');
var router = express.Router();

var redis = require('redis');
var client = redis.createClient(6379, "127.0.0.1");



module.exports = router;
