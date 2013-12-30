"use strict";

var defaults = {
        width:       100,
        height:      40,

        hotLevel:      50,
        hotPeriod:   3,

        showStats:   true,
        showHours:   true,
        
        statsHeight: 11
    },

    Canvas = require('canvas'),
    http = require('http'),
    url = require('url'),
    _ = require('lodash');

function resample(input, newLen) {
    var inputLen = input.length,
        span;
       
    if (inputLen <= newLen) { return input; }
   
    span = inputLen / newLen;

    return _.map(_.range(0, inputLen - 1, span), function(left){
        var right = left + span,
            lf = Math.floor(left),
            lc = Math.ceil(left),
            rf = Math.floor(right),
            rc = Math.min(Math.ceil(right), inputLen - 1);

        return (
            _.reduce(_.range(lc, rf), function(sum, i) { return sum + input[i]; }, 0) +
            input[lf] * (lc - left) +
            input[rc] * (right - rf)
        ) / span;
    });
}

function collateOphanData(data, opts) {
    var graphs = opts.graphs ? 
        _.map(opts.graphs.split(','), function(graph) {
            var p = graph.split(':');
            return { name: p[0], color: (p[1] || '666666') };
        }) :
        [
            {name: 'other',    color: 'd61d00'},
            {name: 'google',   color: '89A54E'},
            {name: 'guardian', color: '4572A7'}
        ];

    if(graphs.length && data.seriesData && data.seriesData.length) {
        var graphTotal = _.find(graphs, function(g){ return eqNoCase(g.name, 'total'); }), 
            graphOther = _.find(graphs, function(g){ return eqNoCase(g.name, 'other'); }); 
        
        _.each(data.seriesData, function(s){
            var graphThis = _.find(graphs, function(g){ return eqNoCase(g.name, s.name); }) || graphOther;

            // Drop the last data point
            s.data.pop();

            _.each(_.filter([graphThis, graphTotal], function(g) { return g; }), function(graph) {
                if (graph.data) {
                    // ...sum additinal data into the graph
                    _.each(s.data, function(d, i) {
                        graph.data[i] = graph.data[i] + d.count;
                    });
                } else {
                    graph.data = _.pluck(s.data, 'count');
                }
            });
        });

        graphs = _.filter(graphs, function(graph) { return graph.data; });

        if (!graphs.length) { return; }

        graphs = _.map(graphs, function(graph){
            var pvm;

            graph.data = resample(graph.data, opts.width);
            // recent pageviews per minute average
            pvm = _.reduce(_.last(graph.data, opts.hotPeriod), function(m, n){ return m + n; }, 0) / opts.hotPeriod;
            // classify activity on scale of 1,2,3
            graph.activity = pvm < opts.hotLevel ? pvm < opts.hotLevel/2 ? 1 : 2 : 3;
            return graph;
        });

        return {
            seriesData: graphs,
            max: _.max(_.map(graphs, function(graph) { return _.max(graph.data); })),
            totalHits: data.totalHits,
            points: graphs[0].data.length,
            startSec: _.first(data.seriesData[0].data).dateTime/1000,
            endSec: _.last(data.seriesData[0].data).dateTime/1000
        };
    }
}

function numWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function eqNoCase(a, b) {
    return a.toLowerCase() === b.toLowerCase();
}

function draw(data, opts) {
    var graphHeight = opts.height - (opts.showStats ? opts.statsHeight : 2),
        xStep = data.points < opts.width/2 ? data.points < opts.width/3 ? 3 : 2 : 1,
        yStep = graphHeight/opts.hotLevel,
        yCompress = data.max > opts.hotLevel ? opts.hotLevel/data.max : 1,
        seconds = data.endSec - data.startSec,
        canvas = new Canvas(opts.width, opts.height),
        c = canvas.getContext('2d'),
        drawMark = function (second, hexColor, withFlag) {
            var x = Math.floor(opts.width + ((second - data.startSec)/seconds - 1)*data.points*xStep);
            
            c.beginPath();
            c.lineTo(x, 0);
            c.lineTo(x, graphHeight + 2);
            c.lineWidth = 1;
            c.strokeStyle = '#' + (hexColor || '666666');
            c.stroke();

            if (withFlag) {
                c.fillStyle = '#' + (hexColor || '666666');
                c.fillRect(x - 2, 0, 4, 2);
                c.fillRect(x - 1, 2, 2, 1);
            }
        };

    if (opts.showStats) {
        c.font = 'bold 9px Arial';
        c.textAlign = 'right';
        c.fillStyle = '#999999';
        c.fillText(numWithCommas(data.totalHits), opts.width - 1, opts.height - 1);
    }

    c.translate(-0.5, -0.5); // reduce antialiasing

    if (opts.showHours) {
        _.each(_.range(data.endSec, data.startSec, -3600), function(hour) {
            drawMark(hour, 'f0f0f0');
        });
    }

    _.each(data.seriesData, function(s) {
        c.beginPath();
        _.each(s.data, function(y, x){
            if (!x && data.points === opts.width) { return; }
            c.lineTo(opts.width + (x - data.points + 1)*xStep - 1, graphHeight - yStep*yCompress*y + 2); // + 2 so thick lines don't get cropped at top
        });
        c.lineWidth = s.activity;
        c.strokeStyle = '#' + s.color;
        c.stroke();
    });

    if (opts.markers) {
        _.each(opts.markers.split(','), function(m) {
            m = m.split(':');
            drawMark(_.parseInt(m[0]), m[1], true);
        });
    }

    return canvas;
}

http.createServer(function (req, res) {
    var defaulter = _.partialRight(_.assign, function(a, b) {
            return a ? _.parseInt(a) : b;
        }),
        opts = defaulter(url.parse(req.url, true).query, defaults);

    if (!opts.page) {
        res.end();
        return;
    }

    http.request(
        {
          host: 'api.ophan.co.uk',
          path: '/api/breakdown?path=' + url.parse(opts.page).pathname
        },
        function(proxied) {
            var str = '';

            proxied.on('data', function (chunk) { str += chunk; });

            proxied.on('end', function () {
                var ophanData;

                try { ophanData = JSON.parse(str); } catch(e) { ophanData = {}; }

                if (ophanData.totalHits > 0 && _.isArray(ophanData.seriesData)) {
                    ophanData = collateOphanData(ophanData, opts);
                    ophanData ? draw(ophanData, opts).toBuffer(function(err, buf){
                        res.writeHead(200, {
                            'Content-Type': 'image/png',
                            'Content-Length': buf.length,
                            'Cache-Control': 'public,max-age=30'
                        });
                        res.end(buf, 'binary');
                    }) : res.end();
                } else {
                    res.end();
                }
            });
        }
    ).end();

}).listen(3000);
