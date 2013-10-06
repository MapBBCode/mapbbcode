/*
 * Map BBCode Editor, extends bbcode display module.
 * See editor() and editorWindow() methods.
 */
window.MapBBCode.include({
    _layerToObject: function( layer ) {
        var obj = {};
        if( layer instanceof L.Marker ) {
            obj.coords = [layer.getLatLng()];
        } else {
            obj.coords = layer.getLatLngs();
            if( layer instanceof L.Polygon )
                obj.coords.push(obj.coords[0]);
        }
        if( layer.inputField )
            obj.text = layer.inputField.value.replace(/\\n/g, '\n').replace(/\\\n/g, '\\n');
        obj.params = layer._objParams || [];
        if( layer._colorName ) {
            // todo: remove all colors from params instead of resetting the array
            obj.params = this.options.lineColors[layer._colorName] !== this.options.lineColors.def ? [layer._colorName] : [];
        }
        return obj;
    },

    _makeEditable: function( layer, drawn ) {
        var buttonDiv = document.createElement('div');
        buttonDiv.style.textAlign = 'center';
        buttonDiv.style.clear = 'both';
        var closeButton = document.createElement('input');
        closeButton.type = 'button';
        closeButton.value = this.strings.close;
        closeButton.onclick = function() {
            layer.closePopup();
        };
        buttonDiv.appendChild(closeButton);
        if( drawn ) {
            var deleteButton = document.createElement('input');
            deleteButton.type = 'button';
            deleteButton.value = this.strings.remove;
            deleteButton.onclick = function() {
                layer.closePopup();
                drawn.removeLayer(layer);
            };
            buttonDiv.appendChild(deleteButton);
        }
        var parentDiv = document.createElement('div');
        layer.options.clickable = true;
        if( layer instanceof L.Marker ) {
            var commentDiv = document.createElement('div');
            var commentSpan = document.createTextNode(this.strings.title + ': ');
            var inputField = document.createElement('input');
            inputField.type = 'text';
            inputField.size = 20;
            if( layer._text )
                inputField.value = layer._text.replace(/\\n/g, '\\\\n').replace(/[\r\n]+/g, '\\n');
            commentDiv.appendChild(commentSpan);
            commentDiv.appendChild(inputField);
            commentDiv.style.marginBottom = '8px';
            parentDiv.appendChild(commentDiv);

            layer.inputField = inputField;
            layer.options.draggable = true;
            layer.defaultIcon = new L.Icon.Default();
            inputField.onkeypress = function(e) {
                var keyCode = (window.event) ? (e || window.event).which : e.keyCode;
                if( keyCode == 27 || keyCode == 13 ) { // escape actually does not work
                    layer.closePopup();
                    e.preventDefault();
                    return false;
                }
            };
            layer.on('popupopen', function() {
                inputField.focus();
            });
            layer.on('popupclose', function() {
                var title = layer.inputField.value;
                if( L.LetterIcon && this.options.letterIcons && title.length > 0 && title.length <= 2 )
                    layer.setIcon(new L.LetterIcon(title));
                else
                    layer.setIcon(layer.defaultIcon);
            }, this);
        } else { // polyline or polygon
            var colorDiv = document.createElement('div');
            var colors = Object.getOwnPropertyNames(this.options.lineColors).sort();
            var colOnclick = function(e) {
                var targetStyle = e.target.style;
                if( targetStyle.borderColor == 'white' ) {
                    layer.setStyle({ color: targetStyle.backgroundColor, fillColor: targetStyle.backgroundColor });
                    layer._colorName = e.target._colorName;
                    var nodes = colorDiv.childNodes;
                    for( var j = 0; j < nodes.length; j++ )
                        nodes[j].style.borderColor = 'white';
                    targetStyle.borderColor = '#aaa';
                }
            };
            for( var i = 0; i < colors.length; i++ ) {
                if( colors[i] === 'def' )
                    continue;
                var col = document.createElement('div');
                col._colorName = colors[i];
                col.style.width = '16px';
                col.style.height = '16px';
                col.style.cssFloat = 'left';
                col.style.styleFloat = 'left';
                col.style.marginRight = '3px';
                col.style.marginBottom = '5px';
                col.style.cursor = 'pointer';
                var color = this.options.lineColors[colors[i]];
                col.style.backgroundColor = color;
                col.style.borderWidth = '3px';
                col.style.borderStyle = 'solid';
                col.style.borderColor = color == layer.options.color ? '#aaa' : 'white';
                col.onclick = colOnclick;
                colorDiv.appendChild(col);
            }
            parentDiv.appendChild(colorDiv);
            layer.editing.enable();
        }
        parentDiv.appendChild(buttonDiv);
        layer.bindPopup(parentDiv);
        return layer;
    },

    _findMapInTextArea: function( textarea ) {
        var pos = textarea.selectionStart,
            value = textarea.value;
        if( pos >= value.length || value.length < 10 || value.indexOf('[/map]') < 0 )
            return '';
        // check if cursor is inside a map
        var start = value.lastIndexOf('[map', pos);
        if( start >= 0 ) {
            var end = value.indexOf('[/map]', start);
            if( end + 5 >= pos ) {
                var mapPart = value.substring(start, end + 6);
                if( window.MapBBCodeProcessor.isValid(mapPart) )
                    return mapPart;
            }
        }
        return '';
    },

    _updateMapInTextArea: function( textarea, oldCode, newCode ) {
        var pos = textarea.selectionStart,
            value = textarea.value;
        if( oldCode.length && value.indexOf(oldCode) >= 0 )
            textarea.value = value.replace(oldCode, newCode);
        else if( pos >= value.length )
            textarea.value = value + newCode;
        else {
            textarea.value = value.substring(0, pos) + newCode + value.substring(pos);
        }
    },

    // Show editor in element. BBcode can be textarea element. Callback is always called, null parameter means cancel
    editor: function( element, bbcode, callback, context ) {
        var el = typeof element === 'string' ? document.getElementById(element) : element;
        if( !el ) return;
        while( el.firstChild )
            el.removeChild(el.firstChild);
        var mapDiv = el.ownerDocument.createElement('div');
        mapDiv.style.height = this.options.editorHeight;
        el.appendChild(mapDiv);

        var map = L.map(mapDiv, { zoomControl: false });
        map.addControl(new L.Control.Zoom({ zoomInTitle: this.strings.zoomInTitle, zoomOutTitle: this.strings.zoomOutTitle }));
        this._addLayers(map);

        var drawn = new L.FeatureGroup();
        drawn.addTo(map);

        var textArea;
        if( typeof bbcode !== 'string' ) {
            textArea = bbcode;
            bbcode = this._findMapInTextArea(textArea);
        }
        var data = window.MapBBCodeProcessor.stringToObjects(bbcode), objs = data.objs;
        for( var i = 0; i < objs.length; i++ )
            this._makeEditable(this._objectToLayer(objs[i]).addTo(drawn), drawn);
        this._zoomToLayer(map, drawn, { zoom: data.zoom, pos: data.pos }, true);

        // now is the time to update leaflet.draw strings
        L.drawLocal.draw.toolbar.actions.text = this.strings.cancel;
        L.drawLocal.draw.toolbar.actions.title = this.strings.drawCancelTitle;
        L.drawLocal.draw.toolbar.buttons.polyline = this.strings.polylineTitle;
        L.drawLocal.draw.toolbar.buttons.marker = this.strings.markerTitle;
        L.drawLocal.draw.handlers.marker.tooltip.start = this.strings.markerTooltip;
        L.drawLocal.draw.handlers.polyline.tooltip.start = this.strings.polylineStartTooltip;
        L.drawLocal.draw.handlers.polyline.tooltip.cont = this.strings.polylineContinueTooltip;
        L.drawLocal.draw.handlers.polyline.tooltip.end = this.strings.polylineEndTooltip;
        L.drawLocal.draw.handlers.polygon.tooltip.start = this.strings.polygonStartTooltip;
        L.drawLocal.draw.handlers.polygon.tooltip.cont = this.strings.polygonContinueTooltip;
        L.drawLocal.draw.handlers.polygon.tooltip.end = this.strings.polygonEndTooltip;

        var drawControl = new L.Control.Draw({
            position: 'topleft',
            draw: {
                marker: true,
                polyline: {
                    showLength: false,
                    guidelineDistance: 10,
                    shapeOptions: {
                        color: this.options.lineColors.def,
                        weight: 5,
                        opacity: 0.7
                    }
                },
                polygon: this.options.enablePolygons ? {
                    showArea: false,
                    guidelineDistance: 10,
                    shapeOptions: {
                        color: this.options.lineColors.def,
                        weight: 3,
                        opacity: 0.7,
                        fillOpacity: this.options.polygonOpacity
                    }
                } : false,
                rectangle: false,
                circle: false
            },
            edit: {
                featureGroup: drawn,
                edit: false,
                remove: false
            }
        });
        map.addControl(drawControl);
        map.on('draw:created', function(e) {
            var layer = e.layer;
            this._makeEditable(layer, drawn);
            drawn.addLayer(layer);
            if( e.layerType === 'marker' )
                layer.openPopup();
        }, this);

        var apply = L.functionButton('<b>'+this.strings.apply+'</b>', { position: 'topleft', title: this.strings.applyTitle });
        apply.on('clicked', function() {
            var objs = [];
            drawn.eachLayer(function(layer) {
                objs.push(this._layerToObject(layer));
            }, this);
            el.removeChild(el.firstChild);
            var newCode = window.MapBBCodeProcessor.objectsToString({ objs: objs, zoom: objs.length ? 0 : map.getZoom(), pos: objs.length ? 0 : map.getCenter() });
            if( textArea )
                this._updateMapInTextArea(textArea, bbcode, newCode);
            if( callback )
                callback.call(context, newCode);
        }, this);
        map.addControl(apply);

        var cancel = L.functionButton(this.strings.cancel, { position: 'topright', title: this.strings.cancelTitle });
        cancel.on('clicked', function() {
            el.removeChild(el.firstChild);
            if( callback )
                callback.call(context, null);
        }, this);
        map.addControl(cancel);

        if( this.options.showHelp ) {
            var help = L.functionButton('<span style="font-size: 18px; font-weight: bold;">?</span>', { position: 'topright', title: this.strings.helpTitle });
            help.on('clicked', function() {
                var str = '',
                    help = this.strings.helpContents,
                    features = 'resizable,status,dialog,scrollbars,height=' + (this.options.windowHeight || this.options.fullViewHeight) + ',width=' + (this.options.windowWidht || this.options.viewWidth);
                var win = window.open('', 'mapbbcode_help', features);
                for( var i = 0; i < help.length; i++ ) {
                    str += !i ? '<h1>'+help[0]+'</h1>' : help[i].substr(0, 1) === '#' ? '<h2>'+help[i].replace(/^#\s*/, '')+'</h2>' : '<p>'+help[i]+'</p>';
                }
                str += '<div id="close"><input type="button" value="' + this.strings.close + '" onclick="javascript:window.close();"></div>';
                var css = '<style>body { font-family: sans-serif; font-size: 12pt; } p { line-height: 1.5; } h1 { text-align: center; font-size: 18pt; } h2 { font-size: 14pt; } #close { text-align: center; margin-top: 1em; }</style>';
                win.document.open();
                win.document.write(css);
                win.document.write(str);
                win.document.close();
            }, this);
            map.addControl(help);
        }
    },

    // Opens editor window. Requires options.labPath to be correct
    editorWindow: function( bbcode, callback, context ) {
        var features = this.options.windowFeatures,
            featSize = 'height=' + (this.options.windowHeight || this.options.editorHeight) + ',width=' + (this.options.windowWidth || this.options.viewWidth),
            win = window.open('', 'mapbbcode_editor', features + ',' + featSize),
            basePath = location.href.match(/^(.+\/)([^\/]+)?$/)[1],
            libUrl = basePath + this.options.libPath;

        window.storedMapBB = {
            bbcode: bbcode,
            callback: callback,
            context: context,
            caller: this
        };

        var content = '<script src="' + libUrl + 'leaflet.js"></script>';
        content += '<script src="' + libUrl + 'leaflet.draw.js"></script>';
        content += '<script src="' + libUrl + 'mapbbcode.js"></script>';
        content += '<script src="' + libUrl + 'mapbbcode-config.js"></script>'; // yes, this is a stretch
        content += '<link rel="stylesheet" href="' + libUrl + 'leaflet.css" />';
        content += '<link rel="stylesheet" href="' + libUrl + 'leaflet.draw.css" />';
        content += '<div id="edit"></div>';
        content += '<script>opener.storedMapBB.caller.editorWindowCallback.call(opener.storedMapBB.caller, window, opener.storedMapBB);</script>';
        win.document.open();
        win.document.write(content);
        win.document.close();
    },

    editorWindowCallback: function( w, ctx ) {
        w.document.body.style.margin = 0;
        var anotherMapBB = new w.MapBBCode(this.options);
        anotherMapBB.setStrings(this.strings);
        anotherMapBB.options.editorHeight = '100%';
        anotherMapBB.editor('edit', ctx.bbcode, function(res) {
            w.close();
            if( ctx.callback )
                ctx.callback.call(ctx.context, res);
            this.storedContext = null;
        }, this);
    }
});
