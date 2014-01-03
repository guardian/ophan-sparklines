Pageview Sparks
===============

__Small server-generated graphs of Guardian content page-views. Uses Ophan data__. 

* Default rendering:  
![](./example/example01.png)  
`?page=/lifeandstyle/2014/jan/03/12-new-years-resolutions-should-be-abandoned`  

* Seperate graphs specified, dimensions doubled:  
![](./example/example02.png)  
`...&graphs=guardian:4572A7,facebook:00b6f3&width=100&height=40`  

* With a marker point, total pageviews, and elapsed hour vertical bars:  
![](./example/example03.png)  
`...&markers=1388747300:ff9900&showStats=1&showHours=1`  

### Query string params:

Required

* __page__ : url of the Guardian content. Only the pathname part is used.

Optional

* __graphs__ : comma-separated names of dataseries from the Ophan breakdown, with optional hex colours (after a colon), e.g. `twitter:6666ff,facebook:000099`. The following are in Ophan at time of writing:
    * `guardian`,
    * `unknown - to content`
    * `unknown - to front`
    * `google`
    * `twitter`
    * `facebook`
    * `reddit`
    * `drudge report`
    * `outbrain`
    * `other`  
    Also supported is `total`, which is the default.

* __markers__ : comma-separated vertical markers, as unix timestamps, with optional hex colours (after a colon), e.g. `1388408200:ff9900,1388409900:cccccc`

* __width__ : in pixels. Default is 50.

* __height__ : in pixels. Default is 20.

* __showStats__ : show the total hits counter, when set to `1`. Default is `0`.

* __showHours__ :  show the elapsed hour markers, when set to `1`. Default is `0`.

* __hotLevel__:  pageviews-per-min level that triggers an emphasised graph line. The line will go bold at half this value, and extra-bold beyond it. This is also the level at which the graph compresses vertically. Default is 50, which seems appropriate for articles; fronts need a higher figure, e.g. 250.

* __hotPeriod__ : number of recent minutes over which to calcuate the hotLevel. Default is `5`.

* __alpha__ : opacity of the graph lines. Range from 0 - 1. Default is `0.7`.

* __smoothing__ : number of pixels over which to compute a moving average. Default is `5`.

### Installation

Requires Node and [Cairo](http://cairographics.org/).

For Cairo installation, see the dependencies part of [Wiki](https://github.com/LearnBoost/node-canvas/wiki/_pages) from the [node-canvas](https://github.com/LearnBoost/node-canvas) project.

Then:

```
$ npm install
```

Create a file called `config.json` with `ophanHost` and `ophanKey` properties (see `sample-config.json`).

Then in a browser: `http://localhost:3000/?page=/uk`
