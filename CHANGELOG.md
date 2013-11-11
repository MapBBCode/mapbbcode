# MapBBCode Library Changelog

Versions are numbered "major.minor.patch", with the `master` branch being "major.minor-dev", a permanent RC for the next version. Bug fixes are backported to the `stable` branch; `patch+1` version is tagged no earlier that a week from a previous release, but no later than a week after a last commit to its branch. This way you can safely updgrade to the latest patch version, though usually upgrading to the latest minor version should not be a big trouble.

All changes without author are by [Ilya Zverev](https://github.com/Zverik).

## 1.0.1-dev (master)

* Moved all documentation to [mapbbcode.org](http://mapbbcode.org/toc.html). [#19](https://github.com/MapBBCode/mapbbcode/issues/19)
* Semicolons in object titles are now parsed correctly. [#10](https://github.com/MapBBCode/mapbbcode/issues/10)
* New `L.PermalinkAttribution` Leaflet plugin that makes permalinks out of OSM attribution links (enabled by default).
* `panelHook` for altering viewer and editor panels. Also `editor` property in control objects.
* Esri and Bing layers were moved to separate scripts for proprietary layers.
* Added proprietary layers: Google, Yandex. To include a proprietary layer into layerList, just include a script file. [#16](https://github.com/MapBBCode/mapbbcode/issues/16)
* Markers are now fit inside a map panel. [#14](https://github.com/MapBBCode/mapbbcode/issues/14)
* All options in MapBBCodeProcessor are now in `options` property.
* Brackets and opening tag style can be configured: `<map z="12" ll="60.1,30.2"></map>` is possible. [#9](https://github.com/MapBBCode/mapbbcode/issues/9)
* Removed `decimalDigits` option from UI, configure MapBBCodeProcessor directly. [#11](https://github.com/MapBBCode/mapbbcode/issues/11)
* Added OpenMapSurfer Contour layer (also as an example of adding an overlay layer).
* Polygon button missed a tooltip, and search tooltip was too technical.
* Replaced Leaflet with MapBBCode in attribution.
* Updated Leaflet.draw: tooltip doesn't hang in top left corner anymore.
* BBCode for `show()` can be split: `<div id="id" map="=10,11,22">10.01,10.99(M)</div>` (`=` is optional). For those engines that do not tolerate unprocessed bbcode.

## 1.0.0 (2013-10-31)

Initial release
