var http = require('http');
var pkill = require('pkill');
var schedule = require('node-schedule');
var winston = require('winston');

var options = {
    host: '127.0.0.1',
    path: '/',
    port: '1880',
    method: 'GET'
};

var logger = new (winston.Logger)({
    transports: [
        //new (winston.transports.Console)({timestamp: true}),
        new (winston.transports.DailyRotateFile)({
            name: 'file',
            datePattern: '.yyyy-MM-dd',
            timestamp: true,
            filename: '/var/log/node-red-monitoring/node-red-responding.log' })
    ]
});

logger.log("info", "Node-red responding process started.");

var j = schedule.scheduleJob('*/10 * * * *', function(){

    //logger.log("info", "Checking now.");

    var req = http.request(options, function(res) {
    });

    req.on('socket', function (socket) {
        socket.setTimeout(10000);
        socket.on('timeout', function() {
            req.abort();
        });
    });

    req.on('error', function(err) {
        if (err.code === "ECONNRESET") {
            logger.log("info", "Node-red not responding, killing process now.");
            try {
             pkill('node-red');
            } catch (ex) {
                logger.log("error", "Could not kill node-red process: " + ex);
            }

        } else {
            logger.log("error", "Cannot connect to node-red HTTP service. Maybe node-red is down.");
        }
    //other error treatment


    });

    req.end();

});