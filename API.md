# MapBBCode Browser & Editor

`MapBBCode.js` methods are explained in [BBCODE.md](BBCODE.md). In `MapBBCodeUI.js` and `MapBBCodeUI.Editor.js` there are only 4 public methods combined. Note that when built separately, UI scripts require `MapBBCode.js`, `EditorSprites.js` (base64 contents of a PNG image with button icons) and `FunctionButton.js` (see below). They also support all other modules described in the last chapter, but can work without them.

## Methods

All methods return nothing.

* `setStrings( <Object> strings )`: Replaces strings with provided translations. See `strings/English.js` for default values.
* `show( <HTMLElement/String> div, <String/HTMLElement> bbcode )`: Creates a map inside a given element (can be referenced by id) for given bbcode. can be extracted from an HTML element: it can be in `bbcode` or `value` attributes, or inside it.
* `editor( <HTMLElement/String> div, <String/HTMLTextArea> bbcode, <Function> callback, context )`: Creates an editor in the given panel, possibly pre-initialized with bbcode. The latter is either a string or a textarea, in latter case caret position is taken into account, and the code is replaced after applying changes.
    Returns an object `{ <L.Map> map, close(), getBBCode(), updateBBCode( <String/HTMLTextArea bbcode ) }` which can be used to control the editor when it is opened. Calls `callback` when "Apply" or "Cancel" buttons are clicked, with a single parameter of new bbcode.
* `editorWindow( <String/HTMLTextArea> bbcode, <Function> callback, context )`: Opens a new window with an editor for given bbcode (see `editor()`). Does not return anything.

## Options

Usually configurable by a forum administrator:

| Option | Type | Default | Description
|---|---|---|---
| `defaultPosition` | Number[] | `[22, 11]` | Coordinates of the center of a map when opened with empty bbcode.
| `defaultZoom` | Number | `2` | Default zoom of a map when bbcode is empty.
| `viewWidth` | Number | `600` | Width of a map panel when displaying a bbcode. Here and below `0` means `100%`.
| `viewHeight` | Number | `300` | Height of a map panel when displaying a bbcode.
| `fullViewHeight` | Number | `600` | Height of an expanded map panel. Width is always `100%`.
| `fullFromStart` | Boolean | `false` | Whether the map panel is opened already in expanded state. The button is hidden in this case.
| `fullScreenButton` | Boolean | `true` | Whether to show a button for expanding the map panel.
| `editorHeight` | Number | `400` | Height of an editor panel, if `editor()` method is used.
| `windowWidth` | Number | `800` | Width of an editor window, if `editorWindow()` method is used.
| `windowHeight` | Number | `500` | Height of an editor window, if `editorWindow()` method is used.
| `preferStandardLayerSwitcher` | Boolean | `true` | If this option is `false` and `L.StaticLayerSwitcher` class is present, it will be used instead of a standard Leaflet layers control.
| `allowedHTML` | String | `'[auib]|span|br|em|strong|tt'` | Regular expression that matches all HTML tags allowed in object titles.
| `outerLinkTemplate` | String | `''` | Template for outer link for displayed map center and zoom. Example: `'http://openstreetmap.org/#map={zoom}/{lat}/{lon}'`. If not specified, outer link button is not shown.

Map layers are specified by any of those options. If none are included, an OpenStreetMap default layer is used.

| Option | Type | Description
|---|---|---
| `layers` | String[] | Array of layer identifiers. See `window.layerList` below.
| `createLayers` | Function(L) | Function that receives Leaflet object as a parameter and returns an array of Leaflet layers.

Other options:

| Option | Type | Default |  Description
|---|---|---|---
| `maxInitialZoom` | Number | `15` | Maximum zoom level for displayed features. Prevents zooming too close for single markers.
| `letterIcons` | Boolean | `true` | Whether `L.LetterIcon` would be used for markers with short titles.
| `polygonOpacity` | Number | `0.1` | Fill opacity for polygons.
| `leafletOptions` | Object | `{}` | Additional options passed to `L.Map` constructor.
| `hideInsideClasses` | String[] | `[]` | List of classes inside which map panel will not be displayed (useful for disabling maps in signatures).
| `enablePolygons` | Boolean | `true` | Whether to show polygon drawing button in the editing toolbar.
| `showHelp` | Boolean | `true` | Whether to show help button in the editor.
| `editorCloseButtons` | Boolean | `true` | Whether to show "Apply" and "Cancel" buttons in the editor.
| `windowFeatures` | String | `'resizable,status,dialog'` | Parameters for `window.open()` used for opening an editor window.
| `usePreparedWindow` | Boolean or String | `true` | Whether to use `mapbbcode-window.html` (recommended) or create an editor window from scratch (may fail). If it is a string, it specifies an URL of opened page.
| `libPath` | String | `'lib/'` | Path to `mapbbcode-window.html`, MapBBCode and Leaflet libraries. Should end with a slash. Is used only in `editorWindow()`, if `usePreparedWindow` is not a string.

## Parameter Processors

Since the [BBCode specification](BBCODE.md) states that the only customizable part of [map] bbcode is object parameter set, parameter processing and editing panels in the editor have been made pluggable. There are two mandatory modules (text and color) and several example modules.

To create a new parameter module, you have to push to `window.MapBBCode.objectParams` array an object with the following properties and methods:

* `<RegExp>   reKeys`: regular expression that matches parameters that are processed by this module.
* `<Boolean>  applicableTo( <ILayer> layer )`: tests that given layer can contain module's properties.
* `           objectToLayer( <ILayer> layer, <String[]> params )`: modifies the layer according to the properties, which are filtered by `reKeys`, so there usually is no more than one.
* `<String[]> layerToObject( <ILayer> layer, <String[]> lastParams )`: reads properties off the layer and returns them in a string array. `lastParams` array contains properties that the object had before it was edited.
* `           initLayer( <ILayer> layer )`: initialized newly created layer with default property values.
* `           initDrawControl( <Control.Draw> draw )`: modifies [Leaflet.draw](https://github.com/leaflet/leaflet.draw) control according to default property values.
* `<HTMLElement> createEditorPanel( <ILayer>layer )`: created a panel that will be included in an object popup. It should read and allow editing the property that's processed by the module.

# Configuration Tool

To simplify configuring map panel dimensions and a list of available layers, there is a separate javascript module that can be easily integrated in an administration panel.
It requires `window.layerList` and `L.StaticLayerSwitcher` for easier editing of layers. See [EMBEDDING.md](EMBEDDING.md#administration-panel) for a guide on integration.

## Options

`MapBBCodeConfig` class includes all options listed above in "configurable by a forum administrator" table, except the last three (`preferStandardLayerSwitcher`, `allowedHTML` and `outerLinkTemplate`). Instead there are additional options for configuring the configuration panel:

| Option | Type | Default | Description
|---|---|---|---
| `editorInWindow` | Boolean | `true` | Whether the editor is opened in a window or in an inline panel.
| `editorTypeFixed` | Boolean | `false` | Whether an administrator can change the above option, or the type is hard-coded into a template.
| `maxLayers` | Number | `5` | Maximum number of layers on a map.

## Methods

* `setStrings( <Object> strings )`: Replaces strings with provided translations. See `strings/English.Config.js` for default values.
* `addLayer( <String> id )`: Add a layer to the list. See `window.layerList`.
* `show( <HTMLElement/String> div )`: Shows a map panel with all the controls inside a given element (can be specified by its id).
* `bindLayerAdder( <Object> elements )`: Add listeners and labels to several input elements for adding layers:

| bindLayerAdder option | What does it reference
|---|---
| `select` | `<select size="1">` for a layer list
| `button` | `<input type="button">` for adding a selected layer
| `keyBlock` | an initially hidden block for entering a key for layers that require it
| `keyBlockDisplay` | `display` CSS value for that block
| `keyTitle` | `<span>` where a title for key input field will be inserted
| `keyValue` | `<input type="text">` for entering a key

## Events

There are a number of [Leaflet events](http://leafletjs.com/reference.html#events) that the panel emits.

| Event | Data | When fired
|---|---|---
| `show` | options object | Configuration panel has been created.
| `change` | options object | Any of the options were changed.
| `layerselected` | `{ <String> id }` | A user selected another layer (does not affect options).

# Leaflet Plugins

## L.LetterIcon

A round icon with a white border and text inside. Can be used to display markers that don't require clicking or hovering over to see their labels.

| Option | Type | Default | Description
|---|---|---|---
| `color` | String | `'black'` | CSS color of icon background.
| `radius` | Number | `11` | Icon radius.

## L.FunctionButtons

This control simplifies creating simple Leaflet controls that invoke javascript functions when clicked. It supports multiple actions on one control: in that case they are stacked vertically, like on a standard zoom control.

Class contructor accepts two parameters: an array of labels for actions (strings, image URLs or html elements) and an options object. The latter may contain `titles` array of strings, which would be used as title attributes, and `bgPos` array of [dx, dy] arrays that define offsets for image content. Other options (one option, actually: `position`) are inherited from the [L.Control](http://leafletjs.com/reference.html#control) class.

An action inside a function button can be updated with `setContent(id, content)` and `setTitle(id, title)` methods. Image content offset can be altered with `setBgPos(id, bgPos)` method.

When clicked, the control emits a Leaflet event `clicked` with a single data property, `idx`: zero-based index of an action that was selected.

### L.FunctionButton

This is a subclass of `L.FunctionButtons` designed to work with a single action. It accepts a single object in a contructor, its `setContent()`, `setTitle()` and `setBgPos()` methods accept a single parameter.

## L.StaticLayerSwitcher

This control can replace the standard Leaflet layers control. It allows a user to switch layers and, if `editable` property is set, to remove layers and change their order. This control differs from the stanard one in two ways:

* It does not support overlay layers.
* It fully controls layers included in a map, to the point of removing any layer that it doesn't have listed.

Each layer has to have a label (id). It is either specified on adding, or included in the layer's `options` object as a `name` property. The plugin can be used together with `window.layerList` module: in this case layers can be managed as a list of ids.

The constructor accepts two parameters. The first one is a layer list, either an array of ids or an object `{ id: layer, ... }`. If a layer is not specified, it is requested from `window.layerList` for a given id. The second optional parameter is an options object with the following properties:

| Option | Type | Default | Description
|---|---|---|---
| `maxLayers` | Number | `7` | Maximum number of layers on a map.
| `bgColor` | String | `white` | Background CSS color of a layer switcher.
| `selectedColor` | String | `#ddd` | Background CSS color of a selected layer line.
| `editable` | Boolean | `false` | Whether a user can move and delete layers.

Those methods can be used to get and manipulate layers in a layer switcher:

* `<ILayer[]> getLayers()`: returns an array of layers included in a control, in their displayed order.
* `<String[]> getLayersIds()`: returns an array of layer identifiers included in a control, in their displayed order.
* `<ILayer>   getSelectedLayer()`: returns a currently selected layer.
* `<String>   getSelectedLayerId()`: returns an identifier of a currently selected layer.
* `<ILayer>   addLayer( <String> id, <ILayer> layer )`: appends a layer with given id to the end of the layer list. If `layer` is omitted, `window.layerList` is queried for a given `id`. Returns a layer that was added, or `null` if operation failed.
* `<ILayer>   updateLayer( <ILayer> layer, <String> id )`: updated an identifier for a layer. In case the layer was created by `window.layerList`, recreates it. Returns a layer, an id for which was updated, or `null` if operation failed.
* `<ILayer>   removeLayer( <ILayer> layer )`: Removes a layer from the list. Returns a layer that was removed, or `null` if operation failed.
* `           moveLayer( <ILayer> layer, <Boolean> moveDown )`: moves a layer in the list either up or down.

When active, the layer switcher emits following Leaflet events:

| Event | Data | When fired
|---|---|---
| `selectionchanged` | `{ <ILayer> selected, <String> selectedId }` | A user has changed active layer.
| `layerschanged` | `{ <String[]> layerIds }` | List of layers has been changed (only when it is editable).

## window.layerList

This object (not a class!) holds a list of layers that can be used on a leaflet map, and more specifically, as a MapBBCode base layer. It is by no means complete and includes only the most popular and distinctive layers.

The list itself is in the `list` property: it is an array of strings, which have to be passed to `eval()` to be converted into a Leaflet `ILayer` object. Some of entries contain `{key:<url>}` substring. It means that the layer requires a developer key (and the link is for its website). This substring has to be replace with an actual key.

The object has some methods to simplify working with the layer list:

* `<String[]> getSortedKeys()`: returns a sorted list of layer keys (every key is essentially a human-readable label).
* `<Boolean>  requiresKey( <String> id )`: checks if the layer for a given id requires a developer key.
* `<String>   getKeyLink( <String> id )`: returns an URL for a developer key required for a layer, or an empty string if there is no URL or the layer does not need a key.
* `<ILayer[]> getLeafletLayers( <String[]> ids, <Leaflet> L ): converts an array of ids to array of layers ready to be added to a Leaflet map.
