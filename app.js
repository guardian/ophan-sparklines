
/**
 * Module dependencies.
 */

var Canvas = require('canvas')
  , canvas = new Canvas(100, 100)
  , c = canvas.getContext('2d')
  , http = require('http')
  , url = require('url')
  , fs = require('fs')
  , _ = require('lodash');

// e.g. http://localhost:3000/?path=/world/2013/dec/27/judge-rules-nsa-phone-data-collection-legal
http.createServer(function (req, res) {
    var params = url.parse(req.url, true).query,
        raw;
    
    if (!params.path) {
        res.end();
        return;
    }

    var options = {
      host: 'api.ophan.co.uk',
      path: '/api/breakdown?path=' + params.path
    };

    callback = function(response) {
        var str = '';

        response.on('data', function (chunk) {
            str += chunk;
        });

        response.on('end', function () {
            var rawData;

            try {
                rawData = JSON.parse(str);
            } catch(e) {
                rawData = {};
            }
            if (rawData.totalHits) {
                console.log(rawData.totalHits + ' HITS');
            };
            res.end();
        });
    }

    http.request(options, callback).end();

    /*
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(100, 0);
    c.lineTo(100, 100);
    c.lineTo(0, 100);
    c.moveTo(0, 0);
    c.stroke();

    canvas.toBuffer(function(err, buf){
        res.writeHead(200, { 'Content-Type': 'image/png', 'Content-Length': buf.length });
        res.end(buf);
    });
    */

}).listen(3000);

console.log('Server running on port 3000');
