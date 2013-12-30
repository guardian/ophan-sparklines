ophan-sparks
============

Server-generated graphs for Guardian pageview data from Ophan.

A url like this:
```
http://localhost:3000/?page=/lifeandstyle/2013/dec/29/unreliable-statistics-of-2013&markers=1388387000:ff9900,1388400000:999999
```
...should return a 100x40 PNG like this:

![example](./example.png)

Grey vertical lines represent hours elapsed. The image is always right-alinged, with the right-hand edge representing "now". 

Query parameters:

* `page` : th eurl of the Guardian content. Can be absolute.
* `markers` : an optional comma-seperated list of `{timestamp seconds}:{hex colour}` vertical marks.

## Installation

Requires Node and Cairo. For Cairo installation, see the [Wiki](https://github.com/LearnBoost/node-canvas/wiki/_pages) from the [node-canvas](https://github.com/LearnBoost/node-canvas) project.
