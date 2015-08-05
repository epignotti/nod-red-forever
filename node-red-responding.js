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
        //new (winston.transports.Console)(),
        new (winston.transports.DailyRotateFile)({
            name: 'file',
            datePattern: '.yyyy-MM-dd',
            filename: '/var/log/node-red-monitoring/node-red-responding.log' })
    ]
});

logger.log("info", "Node-red responding process started.");

var j = schedule.scheduleJob('*/10 * * * *', function(){

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
            pkill('node-red');
            //specific error treatment
        }
    //other error treatment
    });

    req.end();

});