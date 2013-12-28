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

function prepareSeries(data) {
    var slots = opts.width,
        graphs = [
            {name: 'Other',    data: [], color: 'd61d00', max: 0}, // required
            {name: 'Google',   data: [], color: '89A54E', max: 0},
            {name: 'Guardian', data: [], color: '4572A7', max: 0}
        ];

    if(data.seriesData && data.seriesData.length) {
        _.each(data.seriesData, function(s){
            var graph,
                minsPerSlot;
            
            // Pick the relevant graph...
            graph = _.find(graphs, function(g){
                    return g.name === s.name;
                }) || graphs[0]; // ...defaulting to the first ('Other')

            // Drop the last data point
            s.data.pop();
            
            // How many 1 min points are we adding into each slot
            minsPerSlot = Math.max(1, Math.floor(s.data.length / slots));

            // ...sum the data into each graph
            _.each(_.last(s.data, minsPerSlot*slots), function(d,index) {
                var i = Math.floor(index / minsPerSlot);
                graph.data[i] = (graph.data[i] || 0) + (d.count / minsPerSlot);
                graph.max = Math.max(graph.max, graph.data[i]);
            });
        });

        return _.map(graphs, function(graph){
            // recent pageviews per minute average
            var pvm = _.reduce(_.last(graph.data, opts.pvmPeriod), function(m, n){ return m + n; }, 0) / opts.pvmPeriod;
            // classify activity on scale of 1,2,3
            graph.activity = pvm < opts.pvmHot ? pvm < opts.pvmWarm ? 1 : 2 : 3;
            return graph;
        });
    }
}

function numWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function draw(series, totalHits, response) {
    var globalMax = _.max(_.pluck(series, 'max')),
        length = ((series[0] || {}).data || []).length || 0,
        xStep = length < 50 ? length < 30 ? 3 : 2 : 1,
        yScale = Math.round(Math.max(5, Math.min(opts.graphHeight, globalMax))) / globalMax,
        canvas = new Canvas(opts.width, opts.height),
        c = canvas.getContext('2d');

    _.each(series, function(s) {
        c.beginPath();
        _.each(s.data, function(y, x){
            if (!x && length === opts.width) { return; }
            c.lineTo(opts.width + (x - length + 1)*xStep - 1, opts.graphHeight - yScale*y + 2); // + 2 so thick lines don't get cropped at top
        });
        c.lineWidth = s.activity;
        c.strokeStyle = '#' + s.color;
        c.stroke();
    });

    c.font = 'bold 9px Arial';
    c.textAlign = 'right';
    c.fillStyle = '#999999';
    c.fillText(numWithCommas(totalHits), 99, 39);

    canvas.toBuffer(function(err, buf){
        response.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': buf.length,
            'Cache-Control': 'public,max-age=30'
        });
        response.end(buf);
    });
}

http.createServer(function (req, res) {
    var params = url.parse(req.url, true).query;
    
    if (!params.path) {
        res.end();
        return;
    }

    http.request(
        {
          host: 'api.ophan.co.uk',
          path: '/api/breakdown?path=' + params.path
        },
        function(proxied) {
            var str = '';

            proxied.on('data', function (chunk) { str += chunk; });

            proxied.on('end', function () {
                var rawData;

                try { rawData = JSON.parse(str); } catch(e) { rawData = {}; }

                if (rawData.totalHits > 0 && _.isArray(rawData.seriesData)) {
                    draw(prepareSeries(rawData), rawData.totalHits, res);
                } else {
                    res.end();
                }
            });
        }
    ).end();

}).listen(3000);
