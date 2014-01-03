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
    var ophanReq,
        params = url.parse(req.url, true).query;

    if (!params.page) { res.end(); return; }

    ophanReq = http.request(
        {
          host: config.ophanHost,
          path: '/api/breakdown?path=' + url.parse(params.page).pathname + '&key=' + config.ophanKey
        },
        function(proxied) {
            var str = '';

            proxied.on('data', function (chunk) { str += chunk; });
            proxied.on('end', function () {
                var ophanData,
                    spark;

                var start = new Date().getTime();

                try { ophanData = JSON.parse(str); } catch(e) { ophanData = {}; }


                spark = new Spark(params).draw(ophanData);
                
                if (spark) {
                    spark.toBuffer(function(err, buf){
                        console.log(new Date().getTime() - start);
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

