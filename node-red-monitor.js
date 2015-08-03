var forever = require('forever-monitor');
var winston = require('winston');

var node_red_process = new (forever.Monitor)(['/usr/local/lib/node_modules/node-red/bin/node-red-pi',
    '--max-old-space-size=128',
    '-u', '~/.node-red'], {
    silent: false,
    killTree: true
});

var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.DailyRotateFile)({
            name: 'file',
            datePattern: '.yyyy-MM-dd',
            filename: '/var/log/node-red-monitoring/node-red-monitor.log' })
    ]
});

node_red_process.on('exit', function () {
        logger.log("error", "Exited permanently");
    }.bind(node_red_process)
).on('restart', function () {
        logger.log("error", "Restarting node-red restart count=", this.times);
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

process.on('SIGTERM', function () {
    logger.log("info", "received SIGTERM, shutting down node-red.");
    node_red_process.stop();

});

process.on('SIGHUP', function () {
    logger.log("info", "received SIGHUP, restarting node-red.");
        node_red_process.restart();
});