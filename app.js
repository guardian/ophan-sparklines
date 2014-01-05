"use strict";

var config = require('./config.json'),
    Spark = require('./modules/sparks'),
    http = require('http'),
    url = require('url');

if(!config.ophanHost) {
    console.log('Please set the "ophanHost" property in config.json');
    process.exit(1);
}

if(!config.ophanKey) {
    console.log('Please set the "ophanKey" property in config.json');
    process.exit(1);
}

http.createServer(function (req, res) {
    var params = url.parse(req.url, true).query,
        ophanReq = http.request(
            {
              host: config.ophanHost,
              path: '/api/breakdown?path=' + url.parse(params.page || '/uk').pathname + '&key=' + config.ophanKey
            },
            function(proxied) {
                var ophanData = '',
                    spark;

                proxied.on('data', function (chunk) { ophanData += chunk; });
                proxied.on('end', function () {
                    try { ophanData = JSON.parse(ophanData); } catch(e) { ophanData = {}; }

                    spark = ophanData.totalHits ? new Spark(params).draw(ophanData) : false;
                    
                    if (spark) {
                        spark.toBuffer(function(err, buf){
                            res.writeHead(200, {
                                'Content-Type': 'image/png',
                                'Content-Length': buf.length,
                                'Cache-Control': 'public,max-age=30'
                            });
                            res.end(buf, 'binary');
                        });
                    } else {
                        res.end();
                    }
                });
            }
        );

    ophanReq.on('error', function(e) {
        console.log(e.message);
    });

    ophanReq.end();

}).listen(3000);

