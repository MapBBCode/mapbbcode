window.MapBBCode.include({strings: {
    close: 'Close', // close feature editing popup
    remove: 'Delete', // delete feature from popup
    apply: 'Apply', // button on an editing map to apply changes
    cancel: 'Cancel', // button on an editing map to discard changes
    title: 'Title', // prompt for marker title text

    // button titles
    zoomInTitle: 'Zoom in',
    zoomOutTitle: 'Zoom out',
    applyTitle: 'Apply changes',
    cancelTitle: 'Cancel changes',
    fullScreenTitle: 'Enlarge or shrink map panel',
    helpTitle: 'Open help window',
    outerTitle: 'Show this place on an external map',

    // share
    exportName: 'Export',
    exportTitle: 'Download this map',
    upload: 'Upload',
    uploadTitle: 'Upload this map to an external server',
    uploading: 'Uploading',
    uploadError: 'Error while uploading the map',
    uploadSuccess: 'Upload was successful. Bookmark this link to be able to edit the map',
    sharedFormHeader: 'There are no objects to upload. Enter a MapBBCode Share map URL',
    sharedFormError: 'This map panel has incorrect endpoint set.<br>Please contact an administrator.',
    sharedFormInvalidCode: 'Map code is invalid',
    sharedCodeError: 'Failed to download an external map<br><br><a href="{url}" target="mapbbcode_outer">Open map in a new window</a>',

    // Leaflet.draw
    polylineTitle: 'Draw a path',
    markerTitle: 'Add a marker',
    drawCancelTitle: 'Cancel drawing',
    markerTooltip: 'Click map to place marker',
    polylineStartTooltip: 'Click to start drawing a line',
    polylineContinueTooltip: 'Click to continue drawing line',
    polylineEndTooltip: 'Click the last point to finish line',
    polygonStartTooltip: 'Click to start drawing a polygon',
    polygonContinueTooltip: 'Click to continue drawing polygon',
    polygonEndTooltip: 'Click the last point to close this polygon',

    // help: array of html paragraphs, simply joined together. First line is <h1>, start with '#' for <h2>.
    helpContents: [
        'Map BBCode Editor',
        'You have opened this help window from inside the map editor. It is activated with "Map" button. When the cursor in the textarea is inside [map] sequence, the editor will edit that bbcode, otherwise it will create new bbcode and insert it at cursor position after clicking "Apply".',
        '# BBCode',
        'Map BBCode is placed inside <tt>[map]...[/map]</tt> tags. Opening tag may contain zoom with optional position in latitude,longitude format: <tt>[map=10]</tt> or <tt>[map=15,60.1,30.05]</tt>. Decimal separator is always a full stop.',
        'The tag contains a semicolon-separated list of features: markers and paths. They differ only by a number of space-separated coordinates: markers have one, and paths have more. There can be optional title in brackets after the list: <tt>12.3,-5.1(Popup)</tt> (only for markers in the editor). Title is HTML and can contain any characters, but "(" should be replaced with "\\(", and only a limited set of HTML tags is allowed.',
        'Paths can have different colours, which are stated in <i>parameters</i>: part of a title followed by "|" character. For example, <tt>12.3,-5.1 12.5,-5 12,0 (red|)</tt> will produce a red path.',
        '# Map Viewer',
        'Plus and minus buttons on the map change its zoom. Other buttons are optional. A button with four arrows ("fullscreen") expands map view to maximum width and around twice the height. If a map has many layers, there is a layer switcher in the top right corner. There also might be a button with a curved arrow, that opens an external site (usually www.openstreetmap.org) at a position shown on the map.',
        'You can drag the map to pan around, press zoom buttons while holding Shift key to change zoom quickly, or drag the map with Shift pressed to zoom to an area. Scroll-wheel zoom is disabled in viewer to not interfere with page scrolling, but in works in map editor.',
        '# Editor Buttons',
        '"Apply" saves map features (or map state if there are none) to a post body, "Cancel" just closes the editor panel. And you have already figured out what the button with a question mark does. Two buttons underneath zoom controls add features on the map.',
        'To draw a path, press the button with a diagonal line and click somewhere on the map. Then click again, and again, until you\'ve got a nice polyline. Do not worry if you got some points wrong: you can fix it later. Click on the final point to finish drawing. Then you may fix points and add intermediate nodes by dragging small square or circular handlers. To delete a path (or a marker), click on it, and in the popup window press "Delete" button.',
        'Markers are easier to place: click on the marker button, then click on the map. In a popup window for a marker you can type a title: if it is 1 or 2 characters long, the text would appear right on the marker. Otherwise map viewers would have to click on a marker to read the title. A title may contain URLs and line feeds.',
        '# Plugin',
        'Map BBCode Editor is an open source product, available at <a href="https://github.com/MapBBCode/mapbbcode">github</a>. You will also find there plugins for some of popular forum engines. All issues and suggestions can be placed in the github issue tracker.'
    ]
}});
