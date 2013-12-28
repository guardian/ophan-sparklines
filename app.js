
/**
 * Module dependencies.
 */

var Canvas = require('canvas')
  , canvas = new Canvas(100, 100)
  , c = canvas.getContext('2d')
  , http = require('http')
  , fs = require('fs');

http.createServer(function (req, res) {

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

}).listen(3000);

console.log('Server running on port 3000');
