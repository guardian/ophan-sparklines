"use strict";

var opts = {
        width:                 100,
        height:                40,
        graphHeight:           29,
        pvmHot:                50,    // pageviews-per-min to qualify as 'hot'
        pvmWarm:               25,    // pageviews-per-min to qualify as 'warm'
        pvmPeriod:             5      // num of recent datapoints over which to calc pageviews
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

    return _.map(_.range(0, inputLen, span), function(left){
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

function collateOphanData(data) {
    var graphs = [
            {name: 'Other',    color: 'd61d00'},
            {name: 'Google',   color: '89A54E'},
            {name: 'Guardian', color: '4572A7'}
        ];

    if(data.seriesData && data.seriesData.length) {
        _.each(data.seriesData, function(s){
            var graph;
            
            // Pick the relevant graph...
            graph = _.find(graphs, function(g){
                return g.name === s.name;
            }) || graphs[0]; // ...defaulting to the first ('Other')

            // Drop the last data point
            s.data.pop();

            // ...sum the data into the graph
            graph.data = graph.data || [];
            _.each(s.data, function(d,i) {
                graph.data[i] = (graph.data[i] || 0) + d.count;
            });
        });

        graphs = _.map(graphs, function(graph){
            var pvm;

            graph.data = resample(graph.data, opts.width);
            // recent pageviews per minute average
            pvm = _.reduce(_.last(graph.data, opts.pvmPeriod), function(m, n){ return m + n; }, 0) / opts.pvmPeriod;
            // classify activity on scale of 1,2,3
            graph.activity = pvm < opts.pvmHot ? pvm < opts.pvmWarm ? 1 : 2 : 3;
            return graph;
        });

        return {
            seriesData: graphs,
            totalHits: data.totalHits,
            points: graphs[0].data.length,
            timeStart: _.first(data.seriesData[0].data).dateTime,
            timeEnd:   _.last( data.seriesData[0].data).dateTime,
            max: _.max(_.map(graphs, function(graph) { return _.max(graph.data); }))
        };
    }
}

function numWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function draw(data) {
    var xStep = data.points < 50 ? data.points < 30 ? 3 : 2 : 1,
        yScale = Math.round(Math.max(5, Math.min(opts.graphHeight, data.max))) / (data.max || 1),
        canvas = new Canvas(opts.width, opts.height),
        c = canvas.getContext('2d');

    _.each(data.seriesData, function(s) {
        c.beginPath();
        _.each(s.data, function(y, x){
            if (!x && data.points === opts.width) { return; }
            c.lineTo(opts.width + (x - data.points + 1)*xStep - 1, opts.graphHeight - yScale*y + 2); // + 2 so thick lines don't get cropped at top
        });
        c.lineWidth = s.activity;
        c.strokeStyle = '#' + s.color;
        c.stroke();
    });

    c.font = 'bold 9px Arial';
    c.textAlign = 'right';
    c.fillStyle = '#999999';
    c.fillText(numWithCommas(data.totalHits), 99, 39);

    return canvas;
}

http.createServer(function (req, res) {
    var params = url.parse(req.url, true).query;
    
    if (!params.page) {
        res.end();
        return;
    }

    http.request(
        {
          host: 'api.ophan.co.uk',
          path: '/api/breakdown?path=' + url.parse(params.page).pathname
        },
        function(proxied) {
            var str = '';

            proxied.on('data', function (chunk) { str += chunk; });

            proxied.on('end', function () {
                var ophanData;

                try { ophanData = JSON.parse(str); } catch(e) { ophanData = {}; }

                if (ophanData.totalHits > 0 && _.isArray(ophanData.seriesData)) {
                    draw(collateOphanData(ophanData)).toBuffer(function(err, buf){
                        res.writeHead(200, {
                            'Content-Type': 'image/png',
                            'Content-Length': buf.length,
                            'Cache-Control': 'public,max-age=30'
                        });
                        res.end(buf);
                    });
                } else {
                    res.end();
                }
            });
        }
    ).end();

}).listen(3000);
