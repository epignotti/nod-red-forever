var forever = require('forever-monitor');
var winston = require('winston');
var fs = require('fs');

var node_red_process = new (forever.Monitor)(['/usr/local/lib/node_modules/node-red/bin/node-red-pi',
    '--max-old-space-size=128',
    '-u', '~/.node-red'], {
    silent: false,
    killTree: true
});

var stats = {};

var statsFilename = "/var/log/node-red-monitoring/stats.json";

fs.exists(statsFilename, function (exists) {
    if(exists)
    {
        var file_content = fs.readFileSync(statsFilename);
        stats = JSON.parse(file_content);
        if (!stats) {
            stats.restartCounter = 0;
            fs.writeFileSync(statsFilename, JSON.stringify(stats));
        }
    }else
    {
            stats.restartCounter = 0;
            fs.writeFileSync(statsFilename, JSON.stringify(stats));
    }
});



var node_red_responding_process = new (forever.Monitor)('node-red-responding.js', {
    silent: false,
    killTree: true
});

var logger = new (winston.Logger)({
    transports: [
        //new (winston.transports.Console)(),
        new (winston.transports.DailyRotateFile)({
            name: 'file',
            datePattern: '.yyyy-MM-dd',
            timestamp: true,
            filename: '/var/log/node-red-monitoring/node-red-monitor.log'
        })
    ]
});

node_red_process.on('exit', function () {
        logger.log("error", "Node-red exited permanently");
    }.bind(node_red_process)
).on('restart', function () {
        logger.log("error", "Restarting node-red restart count=", this.times);
        stats.restartCounter = stats.restartCounter +1;
        fs.writeFileSync(statsFilename, JSON.stringify(stats));
    }.bind(node_red_process)
).on('stdout', function (data) {
        var buff = new Buffer(data);
        logger.log("info", buff.toString('utf8'));
    }.bind(node_red_process)
).on('stderr', function (data) {
        var buff = new Buffer(data);
        logger.log("error", buff.toString('utf8'));
    }.bind(node_red_process)
).on('watch:restart', function (info) {
        logger.log("error", 'Restarting node-red because ' + info.file + ' changed');
    }.bind(node_red_process)
).start();


node_red_responding_process.on('exit', function () {
        logger.log("error", "Node-red-responding process exited permanently");
    }.bind(node_red_process)
).on('restart', function () {
        logger.log("error", "Restarting Node-red-responding restart count=", this.times);
    }.bind(node_red_process)
).on('stdout', function (data) {
        var buff = new Buffer(data);
        logger.log("info", buff.toString('utf8'));
    }.bind(node_red_process)
).on('stderr', function (data) {
        var buff = new Buffer(data);
        logger.log("error", buff.toString('utf8'));
    }.bind(node_red_process)
).on('watch:restart', function (info) {
        logger.log("error", 'Restarting Node-red-responding because ' + info.file + ' changed');
    }.bind(node_red_process)
).start();


process.on('SIGTERM', function () {
    logger.log("info", "received SIGTERM, shutting down node-red.");
    node_red_process.stop();
    node_red_responding_proces.stop();
});

process.on('SIGHUP', function () {
    logger.log("info", "received SIGHUP, restarting node-red.");
    node_red_process.restart();
    node_red_responding_proces.restart();
});