# MapBBCode Library Changelog

Versions are numbered "major.minor.patch", with the `master` branch being "major.minor-dev", a permanent RC for the next version. Bug fixes are backported to the `stable` branch; `patch+1` version is tagged no earlier that a week from a previous release, but no later than a week after a last commit to its branch. This way you can safely updgrade to the latest patch version, though usually upgrading to the latest minor version should not be a big trouble.

All changes without author are by [Ilya Zverev](https://github.com/Zverik).

## 1.0.1-dev (master)

* Added OpenMapSurfer Contour layer (also as an example of adding an overlay layer).
* Polygon button missed a tooltip, and search tooltip was too technical.
* Replaced Leaflet with MapBBCode in attribution.
* Updated Leaflet.draw: tooltip doesn't hang in top left corner anymore.
* BBCode for `show()` can be split: `<div id="id" map="=10,11,22">10.01,10.99(M)</div>`. For those engines that do not tolerate unprocessed bbcode.

## 1.0.0 (2013-10-31)

Initial release
