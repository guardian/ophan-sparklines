
/**
 * Module dependencies.
 */

var opts = {
        width:                 100,
        height:                40,
        graphHeight:           30,
        pvmHot:                50,    // pageviews-per-min to qualify as 'hot'
        pvmWarm:               25,    // pageviews-per-min to qualify as 'warm'
        pvmPeriod:             5      // num of recent datapoints over which to calc pageviews
    }
  , Canvas = require('canvas')
  , http = require('http')
  , url = require('url')
  , fs = require('fs')
  , _ = require('lodash');

function prepareSeries(data) {
    var simpleSeries,
        slots = opts.width,
        graphs = [
            {name: 'Other',    data: [], color: 'd61d00', max: 0}, // required
            {name: 'Google',   data: [], color: '89A54E', max: 0},
            {name: 'Guardian', data: [], color: '4572A7', max: 0}
        ];

    if(data.seriesData && data.seriesData.length) {
        _.each(data.seriesData, function(s){

            // Pick the relevant graph...
            var graph = _.find(graphs, function(g){
                    return g.name === s.name;
                }) || graphs[0]; // ...defaulting to the first ('Other')

            // How many 1 min points are we adding into each slot
            var minsPerSlot = Math.max(1, Math.floor(s.data.length / slots));

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
            // Round the datapoints
            graph.data = _.map(graph.data, function(d) { return Math.round(d*10)/10; });
            return graph;
        });
    }
}

function draw(series, res) {
    var maxMax = _.max(_.pluck(series, 'max')),
        scale = Math.round(Math.max(5, Math.min(opts.graphHeight, maxMax))) / maxMax,
        points = series[0].data.length,
        step = points < 50 ? points < 30 ? 3 : 2 : 1,
        canvas = new Canvas(opts.width, opts.height), 
        c = canvas.getContext('2d');

    _.each(series, function(s) {
        c.beginPath();
        _.each(s.data, function(y, x){
            if (!x && points === opts.width) { return; } 
            c.lineTo(opts.width + (x - points + 1)*step - 1, opts.graphHeight - y*scale + 2); // + 2 so thick lines don't get cropped at top
        });
        c.lineWidth = s.activity;
        c.strokeStyle = '#' + s.color;
        c.stroke();
    });

    canvas.toBuffer(function(err, buf){
        res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': buf.length,
            'Cache-Control': 'public,max-age=5'
        });
        res.end(buf);
    });
}

// e.g. http://localhost:3000/?path=/world/2013/dec/27/judge-rules-nsa-phone-data-collection-legal
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
                    _.each(rawData.seriesData, function(s){
                        s.data.pop(); // Drop the last data point
                    });
                    draw(prepareSeries(rawData), res);
                } else {
                    res.end();
                };

            });
        }
    ).end();

}).listen(3000);

console.log('Server running on port 3000');
