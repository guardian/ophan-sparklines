"use strict";

var config = require('./config.json'),
    Spark = require('./modules/sparks'),
    http = require('http'),
    path = require('path'),
    url = require('url'),
    fs = require('fs'),
    _ = require('lodash'),
 
    statics = {
        "/": { filepath: "public/index.html", contentType: "text/html" },
        "/blank.png": { filepath: "public/blank.png", contentType: "image/png" },
        "/lodash.js": { filepath: "node_modules/lodash/dist/lodash.min.js", contentType: "application/javascript"}
    },

    cluster = require('cluster'),
    PORT = +process.env.PORT || 8080;

if(!config.ophanHost) {
    console.log('Set the "ophanHost" property in config.json');
    process.exit(1);
}

if(!config.ophanKey) {
    console.log('Set the "ophanKey" property in config.json');
    process.exit(1);
}

if (cluster.isMaster) {
    for (var i = 0; i < require('os').cpus().length; i += 1) {
        cluster.fork();
    }

    cluster.on('disconnect', function(worker) {
        console.error('disconnect!');
        cluster.fork();
    });
} else {
    var domain = require('domain');

    var server = require('http').createServer(function(req, res) {
        var d = domain.create();
        d.on('error', function(er) {
            console.error('error', er.stack);
            try {
                var killtimer = setTimeout(function() {
                    process.exit(1);
                }, 30000);
                killtimer.unref();

                server.close();

                cluster.worker.disconnect();

                res.statusCode = 500;
                res.setHeader('content-type', 'text/plain');
                res.end('Oops, there was a problem!\n');
            } catch (er2) {
                console.error('Error sending 500!', er2.stack);
            }
        });

        d.add(req);
        d.add(res);

        d.run(function() {
            handleRequest(req, res);
        });
    });
    server.listen(PORT);
}

function serveStatic(opts, res) {
    fs.readFile(path.resolve(__dirname, opts.filepath), function(err, data) {
        if (!err) {
            res.writeHead(200, {
                'Content-Type': opts.contentType,
                'Content-Length': data.length,
                'Cache-Control': 'public,max-age=3600'
            });
            res.end(data);
        }
    });
}

function handleRequest(req, res) {
    var urlParts = url.parse(req.url, true),
        staticFile = statics[urlParts.pathname],        
        query = urlParts.query,
        ophanReq;
   
    _.each(query, function(val, key, query) {
	query[key] = _.isArray(val) ? val[0] : val;
    });
 
    if (staticFile) {
        serveStatic(staticFile, res);
        return;
    };

    if (urlParts.pathname !== '/png') {
        res.writeHead(301, {
            'Location': '/'
        });
        res.end();
    }

    ophanReq = http.request(
        {
          host: config.ophanHost,
          path: '/api/breakdown/sparklines?key=' + config.ophanKey + (query.page ? '&path=' + url.parse(query.page).pathname : '')
        },
        function(proxied) {
            var ophanData = '',
                spark;

            proxied.on('data', function (chunk) { ophanData += chunk; });
            proxied.on('end', function () {
                try { ophanData = JSON.parse(ophanData); } catch(e) { ophanData = {}; }

                spark = ophanData.totalHits ? new Spark(query).draw(ophanData) : false;
                
                if (spark) {
                    spark.toBuffer(function(err, buf){
                        res.writeHead(200, {
                            'Content-Type': 'image/png',
                            'Content-Length': buf ? buf.length : 0,
                            'Cache-Control': 'public,max-age=60'
                        });
                        res.end(buf, 'binary');
                    });
                } else {
                    serveStatic(statics["/blank.png"], res);
                }
            });
        }
    );

    ophanReq.on('error', function(e) {
        console.log(e.message);
    });

    ophanReq.end();

}
