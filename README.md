ophan-sparks
============

Server-generated graphs of Guardian pageviews, using Ophan data.

A url like this:
```
http://localhost:3000/?page=/lifeandstyle/2013/dec/29/unreliable-statistics-of-2013&markers=1388387000:ff9900,1388400000:999999
```
...should return a 100x40 PNG like this:

![example](./example.png)

The image is always right-alinged, with the right-hand edge representing "now". 

## Query parameters:

Required:
* `page` : url of the Guardian content. Only the pathname part is used.

Optional:
* `markers` : comma-seperated list of `{timestamp seconds}:{hex colour}` vertical markers.
* `width` : in pixels. Default is 100.
* `height` : in pixels. Default is 40.
* `pvmHot`: recent pageviews-per-min to qualify as 'hot'. Graph line will be extra bold. This is also the level at which the graph starts to compress vertically. Default is 50.
* `pvmWarm` : recent pageviews-per-min to qualify as 'warm'. Graph line will be bold. Default is 25.
* `pvmPeriod` : number of recent minutes over which to infer hot/warm pageviews. Default is 5.
* `showStats` : show the total hits counter. Default is `true`.
* `showHours`:  show the elapsed hour markers. Default is `true`.


## Installation

Requires Node and Cairo. For Cairo installation, see the [Wiki](https://github.com/LearnBoost/node-canvas/wiki/_pages) from the [node-canvas](https://github.com/LearnBoost/node-canvas) project.
