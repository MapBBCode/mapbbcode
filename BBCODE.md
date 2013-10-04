# Map BBCode Syntax

The author expects this format of [map] bbcode to become a universal standard
across forums and other collaboration tools, like mediawiki. This is a description
of the bbcode itself.

## Description

Map BBCode is usually enclosed in `[map]...[/map]` tags. Of course, it is not a requirement:
for example, in wiki those might be converted to HTML tags: `<map>...</map>`. Opening tag
may contain zoom level and optional coordinate (latitude, longitude): `[map=10]` or `[map=12,59.9,30.5]`.
In this case automatically determined zoom level and bounds for features are overridden.

A map tag contains an unordered list of features, separated by semicolons. There might be
zero features, in which case a map displays a location stated in its opening tag, or
a default location if there isn't any.

A feature can be either a marker, a polyline or a polygon. All those are defined by
a space-separated list of coordinates (also latitude,longitude). Markers have a single
coordinate, polylines have several, polygons have their first coordinate equal to the last.

Usually coordinates are in WGS-84 projection, though for some instances it may be different.
For example, for drawing on a fantasy map (e.g. videogame world) pixel coordinates may be used.

Features have optional parameters, a string in brackets after the coordinate list.
It looks like `(option,option|title)`: several comma-separated options (that may contain
only letters and digits), then a vertical bar and a title. Both parts — options and a title —
can be omitted. If there are no options, the vertical bar can be omitted also, but in this
case the first vertical bat in the title should be screened: `\|`. Closing brackets
in the title should also be screened: `\)`. Apart from that, any characters are allowed
in the title: usually it is an HTML or BBCode string.

The implementation in `MapBBCodeUI.js` assumes the title is HTML, but screens all special
characters except a number of tags (`<a>`, `<br>`, `<span>` and some others). It also
knows of colour options: `red` will make a polyline or a polygon red, and so on.

## Examples

    [map][/map]

Displays a map in a default location with no features.

    [map=10,59.95,30.27][/map]

Displays a map of Saint-Petersburg with no features.

    [map]59.939,30.3159(Dvortsovaya)[/map]

A map zoomed onto a Dvortsovaya Square with a marker in the center.
The marker has a title (usually appears in a popup panel), "Dvortsovaya".

    [map]59.939,30.3159; 59.93709,30.31265 59.93115,30.3602 (black|);
    59.94577,30.33244 59.93904,30.3369 59.93408,30.33497 59.92257,30.30776[/map]

A marker is still on Dvortsovaya Square, Nevsky Prospect is a black line,
and a part of Sadovaya Street is a line of a default colour (usually blue).

    [map]55.7547,37.6181 55.7553,37.6191 55.7531,37.6232 55.7528,37.622
         55.7547,37.6181(red|Square)[/map]

Red Square in Moscow is covered with a red polygon, which shows a popup panel
when clicked with "Square" word in it.

## BNF

To reduce clutter, we'll define some base nonterminals with regular expressions.

    <empty>   ::= ""
    <zoom>    ::= [12]?[0-9]
    <number>  ::= -?[0-9]+(\.[0-9]+)?
    <word>    ::= [a-z0-9]+
    <noslash> ::= .*?[^\\]
    
    <coordinate>  ::= <number> "," <number>
    <coordinates> ::= <coordinate> | <coordinate> " " <coordinate>
    <title>       ::= <empty> | <noslash>
    <words>       ::= <empty> | <word> | <word> "," <word>
    <parameters>  ::= "(" <words> "|" <title> ")" | "(" <title> ")"
    <element>     ::= <coordinates> | <coordinates> <parameters>
    <elements>    ::= <empty> | <element> | <element> ";" <element>
    <position>    ::= <zoom> | <zoom> "," <coordinate>
    <openingtag>  ::= "[map]" | "[map=" <position> "]"
    <map>         ::= <openingtag> <elements> "[/map]"

## Library

[MapBBCode.js](https://github.com/MapBBCode/mapbbcode/blob/master/src/MapBBCode.js)
is a reference implementation of parsing and generating map bbcode. It contains
complete regular expressions for the code and three methods you can use in your
projects.

* `isValid(string)` tests that the string is a valid map bbcode.
* `stringToObjects(string)` parses a bbcode string into an object:

        {
          objs: [{
            coords: [],
            text: <string>,
            params: [<string>, ...]
          }, ...],
          zoom: <number>,
          pos: <coordinate>
        }

    Format of `<coordinate>` depends of whether you have [Leaflet](http://leafletjs.com)
    library included: it will be either `L.LatLng` object or an array of two numbers: `[lat, lng]`.
* `objectsToString(object)` converts an object in the same format as `stringToObjects`
  produces and returns a bbcode string.

## Improvements

The format of map bbcode is set in stone. But element parameters, `<words>` nonterminal in BNF,
may be whatever you want. For now only one parameter type is defined: colour.
One can implement, for example, line width with "w<number>" parameter, or marker type.
Implementations of map bbcode are not required to support any of parameters, thus parameters
should not alter behaviour or presentation of features much.
