# Map BBCode

This JavaScript library allows easy integration of [map] bbcode into forums and other collaboration tools. It contains not only a bbcode parser, but also a simple API for displaying and editing code. It was written with a goal to be included into every popular forum and blog engine distribution. The author would be glad to see another plugin for maps based on this library.

## Documentation

Documentation is split into several files:

* [BBCode specification(BBCODE.md)
* [API reference](API.md)
* [Embedding hints](EMBEDDING.md)
* [Some answers](FAQ.md)

Also check out [examples](example) that demonstrate various aspects of the library.

## Supported Browsers

The library (examples, forum modules and [share.mapbbcode.org](http://share.mapbbcode.org/)) was tested and found to be working good enough in the following browsers:

* Internet Explorer 8+
* Firefox 17+
* Opera 12+
* Safari 6+
* Chromium 29+

If you have found problems in any of those browsers, or tested the library with an older version of any browser, please add an issue, submit a pull request to this file, or contact the author.

## Included Libraries

Those libraries reside in `dist/lib` directory and should (though not required to) be put together with `mapbbcode*` files in derived projects.

* [Leaflet](http://leafletjs.com/) (BSD 2-clause)
* [Leaflet.draw](https://github.com/Leaflet/Leaflet.draw) (MIT)
* [Bing.js](https://github.com/shramov/leaflet-plugins/blob/master/layer/tile/Bing.js) (BSD 2-clause)

## Authors and License

All files here except for above mentioned libraries are written [mostly](https://github.com/MapBBCode/mapbbcode/graphs/contributors) by Ilya Zverev and released under [WTFPL](http://www.wtfpl.net/).
