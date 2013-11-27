# MapBBCode Library Changelog

Versions are numbered "major.minor.patch", with the `master` branch being "major.minor-dev", a permanent RC for the next version. Bug fixes are backported to the `stable` branch; `patch+1` version is tagged no earlier that a week from a previous release, but no later than a week after a last commit to its branch. This way you can safely updgrade to the latest patch version, though usually upgrading to the latest minor version should not be a big trouble.

All changes without author are by [Ilya Zverev](https://github.com/Zverik).

## 1.1.2-dev (master)

### Improvements

* `panelHook` hook for params, refine params API (no required methods left).
* New control method: `eachLayer`, iterates over map objects.
* Length measurement plugin (not included by default). [#20](https://github.com/MapBBCode/mapbbcode/issues/20)
* Custom name for `layerList` layers and multiple keys: "Custom Name|Layer ID:key1:key2".
* Nokia and 2GIS proprietary layers, MapBox and Cloudmade layers. [#30](https://github.com/MapBBCode/mapbbcode/issues/30)
* Proprietary layers based on external API do not require adding those API explicitly. [#31](https://github.com/MapBBCode/mapbbcode/issues/31)

### Bugfixes

* Narrow popup icons don't block clicks to underlying objects (by [@tyrasd](https://github.com/tyrasd)).
* Forgot to update a proprietary layer in `mapbbcode-window.html`.
* It was possible to add a single proprietary layer in the configuration panel. [#32](https://github.com/MapBBCode/mapbbcode/issues/32)

## 1.1.1 (2013-11-16)

### Improvements

* Updated OpenMapSurfer tile URLs.
* Link to MapBBCode website in configuration panel.
* Made LayerList and StaticLayerSwitcher not allow the first layer to be non-OpenStreetMap based one. [#23](https://github.com/MapBBCode/mapbbcode/issues/23)
* Added `MapBBCodeProcessor.setOptions(options)`.
* MapBBCodeProcessor's `getCloseTagSubstring` was renamed to `getCloseTag`, added some `getOpenTag*` methods.
* For codes with objects and explicit zoom/pos, after editing zoom/pos are also explicitly specified.
* Replaced four-space indentation with tabs, thus reducing source files by 16%.

### Bugfixes

* Layers with no options property failed to be displayed.
* Invoking `show()` without bbcode now shows an empty map instead of failing. [#25](https://github.com/MapBBCode/mapbbcode/issues/25)
* Fixed `map=""` HTML attribute processing for non-standard bbcodes.

## 1.1.0 (2013-11-13)

### Notable changes

* Moved all documentation to [mapbbcode.org](http://mapbbcode.org/toc.html). [#19](https://github.com/MapBBCode/mapbbcode/issues/19)
* Replaced Leaflet with MapBBCode in attribution.
* New `L.PermalinkAttribution` Leaflet plugin that makes permalinks out of OSM attribution links (enabled by default). [#17](https://github.com/MapBBCode/mapbbcode/issues/17)
* Zooming with scroll wheel is enabled once a user clicks or pans a map. [#21](https://github.com/MapBBCode/mapbbcode/issues/21)
* Added proprietary layers: Google, Yandex. To include a proprietary layer into layerList, just include a script file. [#16](https://github.com/MapBBCode/mapbbcode/issues/16)

### Improvements

* Esri and Bing layers were moved to separate scripts for proprietary layers.
* All options in MapBBCodeProcessor are now in `options` property.
* Removed `decimalDigits` option from UI, configure MapBBCodeProcessor directly. [#11](https://github.com/MapBBCode/mapbbcode/issues/11)
* Brackets and opening tag style can be configured: `<map z="12" ll="60.1,30.2"></map>` is possible. [#9](https://github.com/MapBBCode/mapbbcode/issues/9)
* BBCode for `show()` can be split: `<div id="id" map="=10,11,22">10.01,10.99(M)</div>` (`=` is optional). For those engines that do not tolerate unprocessed bbcode.
* Added OpenMapSurfer Contour layer (also as an example of adding an overlay layer).
* `panelHook` for altering viewer and editor panels. Also `editor` property in control objects.
* Background colors for function buttons.

### Bug fixes

* Semicolons in object titles are now parsed correctly. [#10](https://github.com/MapBBCode/mapbbcode/issues/10)
* Markers are now fit inside a map panel. [#14](https://github.com/MapBBCode/mapbbcode/issues/14)
* Polygon button missed a tooltip, and search tooltip was too technical.
* Updated Leaflet.draw: tooltip doesn't hang in top left corner anymore. [#210](https://github.com/Leaflet/Leaflet.draw/pull/210)

## 1.0.0 (2013-10-31)

Initial release
