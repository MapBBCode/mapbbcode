# Map BBCode

This JavaScript library allows easy integration of [map] bbcode into forums and other collaboration tools. It contains not only a bbcode parser, but also a simple API for displaying and editing code. It was written with a goal to be included into every popular forum and blog engine distribution. The author would be glad to see another plugin for maps based on this library.

Documentation for this library and its use is published on [the official website](http://mapbbcode.org). Also check out [examples](examples) that demonstrate various aspects of the library.

Translations are managed with [Transifex](https://www.transifex.com/projects/p/mapbbcode/), please help us with your language.

## Supported Browsers

The library (examples, forum modules and [share.mapbbcode.org](http://share.mapbbcode.org/)) was tested and found to be working good enough in the following browsers:

* Internet Explorer 8+
* Firefox 17+
* Opera 12+
* Safari 6+
* Chromium 29+

If you have found problems in any of those browsers, or tested the library with an older version of any browser, please add an issue, submit a pull request to this file, or contact the author.

## Included Libraries

Those libraries reside in `dist/lib` and `src/layers` directories and should be put together with `mapbbcode*` files in derived projects, otherwise you would have to fix paths in `mapbbcode-window.html`.

* [Leaflet](http://leafletjs.com/) (BSD 2-clause)
* [Leaflet.draw](https://github.com/Leaflet/Leaflet.draw) (MIT)
* [Bing.js, Google.js, Yandex.js](https://github.com/shramov/leaflet-plugins/tree/master/layer/tile/) (BSD 2-clause)
* [leaflet-2gis](https://github.com/emikhalev/leaflet-2gis) (MIT)

Thanks to [Vladimir Agafonkin](https://github.com/mourner), [Dave Leaver](https://github.com/danzel), [Jacob Toye](https://github.com/jacobtoye), [Pavel Shramov](https://github.com/shramov), [Eugene Mikhalev](https://github.com/emikhalev) and other contributors to those libraries for the excellent code and functionality that allowed to create MapBBCode so fast.

## Authors and License

All files here except for above mentioned libraries are written [mostly](https://github.com/MapBBCode/mapbbcode/graphs/contributors) by Ilya Zverev and released under [WTFPL](http://www.wtfpl.net/).
