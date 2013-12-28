# MapBBCode Library Changelog

Versions are numbered "major.minor.patch", with the `master` branch being "major.minor-dev", a permanent RC for the next version. Bug fixes are backported to the `stable` branch; `patch+1` version is tagged no earlier that a week from a previous release, but no later than a week after a last commit to its branch. This way you can safely updgrade to the latest patch version, though usually upgrading to the latest minor version should not be a big trouble.

All changes without author are by [Ilya Zverev](https://github.com/Zverik).

## 1.2.1-dev (master)

### Improvements

* Editor window is always reopened on subsequent `editorWindow` calls, bringing it to the foreground.

### Bugfixes

## 1.2.0 (2013-12-25)

### Notable Changes

* Translations are now managed with Transifex, files were renamed to `{en|ru|...}.js` and `{en|ru|...}.config.js`. [#22](https://github.com/MapBBCode/mapbbcode/issues/22)
* `LayerList.js` is included in the distribution, now do not include `mapbbcode-config.js` if all you need is LayerList.
* StaticLayerSwitcher plugin is now included in `mapbbcode.js`.
* Bing layer is no longer included by default in `mapbbcode-window.html`.
* L.FunctionButtons plugin has changed API, single L.FunctionButton is now obsolete.

### Improvements

* Leaflet 0.7.1, Leaflet.draw 0.2.3. [#28](https://github.com/MapBBCode/mapbbcode/issues/28)
* "Delete last point" button when drawing a polyline/polygon. [Leaflet.draw#242](https://github.com/Leaflet/Leaflet.draw/pull/242)
* Proprietary layers and `LayerList.js` were moved to `src/layers` (no changes in the distribution). [#38](https://github.com/MapBBCode/mapbbcode/issues/38)
* Leaflet controls and icons were moved to `src/controls` (no changes in distribution).
* Proprietary layers can be added before LayerList is initialized.
* `isEmpty()` and `getBBCodeRegExp()` methods in MapBBCodeProcessor.
* Allow quotes as in `[map="15,42.45,18.54"]`. [#45](https://github.com/MapBBCode/mapbbcode/issues/45)
* `shareTag` option was moved from MapBBCodeUI to MapBBCodeProcessor, allowing for non-standard brackets around `mapid`. [#42](https://github.com/MapBBCode/mapbbcode/issues/42)
* Made editor close buttons always enabled in `mapbbcode-window.html`.
* Map control creation and hooks calling were merged for `show()` and `editor()` methods.
* Buttons for outer links are now regular links, without onclick handlers.
* Added `filter` option to L.ExportButton to filter file types. [#48](https://github.com/MapBBCode/mapbbcode/issues/48)
* Added `toggleObjects` method to viewer's control object, now `Handler.Toggle.js` toggles data layer. [#40](https://github.com/MapBBCode/mapbbcode/issues/40)
* Added build date to files' header.
* PopupIcon's background color can be specified.

### Bugfixes

* Fixed loading Google scripts after window has finished loading.
* MapBBCodeProcessor.getLeafletLayers() did not move proprietary layers down. [#43](https://github.com/MapBBCode/mapbbcode/issues/43)
* Added `L` parameter for `createOpenStreetMapLayer(L)`, fixes occasional disappearance of OSM layer. [#44](https://github.com/MapBBCode/mapbbcode/issues/44)
* Style fixes and UTF-8 charset in `mapbbcode-window.html`.
* Downloading shared maps now works without warnings in IE8/9. [#8](https://github.com/MapBBCode/mapbbcode/issues/8)
* Leaflet CSS was made stronger, now it overrides some of critical properties engines impose on elements. [#52](https://github.com/MapBBCode/mapbbcode/issues/52)

## 1.1.2 (2013-11-29)

### Improvements

* All "params" were renamed to handlers (somewhat breaking change, which should not affect users at the moment).
* `panelHook` hook for handlers, refine handler API (no required methods left).
* New control method: `eachLayer`, iterates over map objects.
* Length measurement plugin (not included by default). [#20](https://github.com/MapBBCode/mapbbcode/issues/20)
* Custom name for `layerList` layers and multiple keys: "Custom Name|Layer ID:key1:key2".
* Nokia and 2GIS proprietary layers, MapBox and Cloudmade layers. [#30](https://github.com/MapBBCode/mapbbcode/issues/30)
* Proprietary layers based on external API do not require adding those API explicitly. [#31](https://github.com/MapBBCode/mapbbcode/issues/31)
* Added "Edit" link near the OpenStreetMap attribution. [#18](https://github.com/MapBBCode/mapbbcode/issues/18)
* `enforceOSM` switch in StaticLayerSwitcher for enforcing the first layer to be OSM-based.
* `watchResize` MapBBCodeUI option for tracking map container size.
* `objectToLayer` and `layerToObject` methods of MapBBCode were made public.

### Bugfixes

* Narrow popup icons don't block clicks to underlying objects (by [@tyrasd](https://github.com/tyrasd)).
* Forgot to update a proprietary layer in `mapbbcode-window.html`.
* It was possible to add a single proprietary layer in the configuration panel. [#32](https://github.com/MapBBCode/mapbbcode/issues/32)
* Expanding initially hidden map now works correctly. [#33](https://github.com/MapBBCode/mapbbcode/issues/33)
* Text on non-editable PopupIcon can be selected. [#6](https://github.com/MapBBCode/mapbbcode/issues/6)
* HTML entities in the configuration panel were replaced with hex codes for IE compatibility.
* Window width in configuration panel sometimes stuck to 100%.
* Some IE8 fixes.

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
