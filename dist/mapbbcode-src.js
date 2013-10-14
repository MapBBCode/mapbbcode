/*
 A JavaScript library for [map] BBCode parsing, displaying and editing.
 https://github.com/MapBBCode/mapbbcode
 (c) 2013, Ilya Zverev
 Licensed WTFPL.
*/
(function (window, document, undefined) {
L = window.L;
/*
 * Map BBCode parser and producer. See BBCODE.md for description.
 */
window.MapBBCodeProcessor = {
    _getRegExp: function() {
        var reCoord = '\\s*(-?\\d+(?:\\.\\d+)?)\\s*,\\s*(-?\\d+(?:\\.\\d+)?)',
            reParams = '\\((?:([a-zA-Z0-9,]*)\\|)?(|[\\s\\S]*?[^\\\\])\\)',
            reMapElement = reCoord + '(?:' + reCoord + ')*(?:\\s*' + reParams + ')?',
            reMapOpeningTag = '\\[map(?:=([12]?\\d)(?:,' + reCoord + ')?)?\\]',
            reMap = reMapOpeningTag + '(' + reMapElement + '(?:\\s*;' + reMapElement + ')*)?\\s*\\[/map\\]',
            reMapC = new RegExp(reMap, 'i');
        return {
            coord: reCoord,
            params: reParams,
            map: reMap,
            mapCompiled: reMapC
        };
    },

    // Checks that bbcode string is a valid map bbcode
    isValid: function( bbcode ) {
        return this._getRegExp().mapCompiled.test(bbcode);
    },

    // Converts bbcode string to an array of features and metadata
    stringToObjects: function( bbcode ) {
        var regExp = this._getRegExp(),
            matches = bbcode.match(regExp.mapCompiled),
            result = { objs: [] };

        if( matches && matches[1] && matches[1].length && (+matches[1]) > 0 ) {
            result.zoom = +matches[1];
            if( matches[3] && matches[3].length > 0 ) {
                try {
                    result.pos = L.LatLng ? new L.LatLng(matches[2], matches[3]) : [+matches[2], +matches[3]];
                } catch(e) {}
            }
        }

        if( matches && matches[4] ) {
            // todo: parse element by element instead of splitting at semicolons
            var items = matches[4].replace(/;;/g, '##%##').split(';'),
                reCoordC = new RegExp('^' + regExp.coord),
                reParamsC = new RegExp(regExp.params);
            for( var i = 0; i < items.length; i++ ) {
                var s = items[i].replace(/##%##/g, ';'),
                    coords = [], m, text = '', params = [];
                m = s.match(reCoordC);
                while( m ) {
                    coords.push(L.LatLng ? new L.LatLng(m[1], m[2]) : [+m[1], +m[2]]);
                    s = s.substr(m[0].length);
                    m = s.match(reCoordC);
                }
                m = s.match(reParamsC);
                if( m ) {
                    if( m[1] )
                        params = m[1].split(',');
                    text = m[2].replace(/\\\)/g, ')').replace(/^\s+|\s+$/g, '');
                }
                result.objs.push({ coords: coords, text: text, params: params });
            }
        }

        return result;
    },

    // Takes an object like stringToObjects() produces and returns map bbcode
    objectsToString: function( data ) {
        var mapData = '';
        if( data.zoom > 0 ) {
            mapData = '=' + data.zoom;
            if( data.pos )
                mapData += ',' + this._latLngToString(data.pos);
        }

        var markers = [], paths = [], objs = data.objs || [];
        for( var i = 0; i < objs.length; i++ ) {
            var coords = objs[i].coords, str = '';
            for( var j = 0; j < coords.length; j++ ) {
                if( j > 0 )
                    str = str + ' ';
                str = str + this._latLngToString(coords[j]);
            }
            var text = objs[i].text || '', params = objs[i].params || [];
            if( text.indexOf('|') >= 0 && params.length === 0 )
                text = '|' + text;
            if( text.length > 0 || params.length > 0 )
                str = str + '(' + (params.length > 0 ? params.join(',') + '|' : '') + text.replace(/\)/g, '\\)').replace(/;/g, ';;') + ')';
            if( coords.length ) {
                if( coords.length == 1 )
                    markers.push(str);
                else
                    paths.push(str);
            }
        }

        return markers.length || paths.length || mapData.length ? '[map' + mapData + ']' + markers.concat(paths).join('; ') + '[/map]' : '';
    },

    _latLngToString: function( latlng ) {
        var mult = Math.pow(10, 5);
        return '' + (Math.round((latlng.lat || latlng[0]) * mult) / mult) + ',' + (Math.round((latlng.lng || latlng[1]) * mult) / mult);
    }
};


/*
 * Map panel that displays BBCode. See show() method and options.
 * Localization is in 'strings/*.js' files.
 */
window.MapBBCode = L.Class.extend({
    options: {
        createLayers: null, // function(L) { return ['OSM']; },
        layers: null, // array of strings, if LayerList.js included
        maxInitialZoom: 15,
        defaultPosition: [22, 11],
        defaultZoom: 2,
        leafletOptions: {},
        polygonOpacity: 0.1,

        editorHeight: 400, // here and below 0 for 100%
        viewWidth: 600,
        viewHeight: 300,
        fullViewHeight: 600,
        fullScreenButton: true,
        fullFromStart: false,
        windowWidth: 800,
        windowHeight: 500,

        windowFeatures: 'resizable,status,dialog',
        usePreparedWindow: true,
        editorCloseButtons: true,
        libPath: 'lib/',
        outerLinkTemplate: false, // 'http://openstreetmap.org/#map={zoom}/{lat}/{lon}',
        showHelp: true,
        allowedHTML: '[auib]|span|br|em|strong|tt',
        letterIcons: true,
        enablePolygons: true,
        preferStandardLayerSwitcher: true,
        hideInsideClasses: []
    },

    strings: {},
    
    initialize: function( options ) {
        L.setOptions(this, options);
        if( L.Browser.ie && options && options.defaultPosition && 'splice' in options.defaultPosition && options.defaultPosition.length == 2 )
            this.options.defaultPosition = [options.defaultPosition[0], options.defaultPosition[1]]; // in IE arrays can be [object Object] and break L.latLon()
    },

    setStrings: function( strings ) {
        this.strings = L.extend({}, this.strings, strings);
    },

    _eachParamHandler: function( callback, context, layer ) {
        var paramHandlers = window.MapBBCode.objectParams;
        if( paramHandlers ) {
            for( var i = 0; i < paramHandlers.length; i++ ) {
                if( !layer || paramHandlers[i].applicableTo(layer) ) {
                    callback.call(context || this, paramHandlers[i]);
                }
            }
        }
    },

    _objectToLayer: function( obj ) {
        var m;
            
        if( obj.coords.length == 1 ) {
            m = L.marker(obj.coords[0]);
        } else if( obj.coords.length > 2 && obj.coords[0].equals(obj.coords[obj.coords.length-1]) ) {
            obj.coords.splice(obj.coords.length - 1, 1);
            m = L.polygon(obj.coords, { weight: 3, opacity: 0.7, fill: true, fillOpacity: this.options.polygonOpacity });
        } else {
            m = L.polyline(obj.coords, { weight: 5, opacity: 0.7 });
        }
        
        this._eachParamHandler(function(handler) {
            var p = [];
            for( var j = 0; j < obj.params.length; j++ )
                if( handler.reKeys.test(obj.params[j]) )
                    p.push(obj.params[j]);
            handler.objectToLayer(m, handler.text ? obj.text : p, this);
        }, this);
            
        m._objParams = obj.params;
        return m;
    },

    _zoomToLayer: function( map, layer, stored, initial ) {
        var bounds = layer.getBounds();
        if( !bounds || !bounds.isValid() ) {
            if( stored && stored.zoom )
                map.setView(stored.pos || this.options.defaultPosition, stored.zoom);
            else if( initial )
                map.setView(this.options.defaultPosition, this.options.defaultZoom);
            return;
        }

        var applyZoom = function() {
            if( stored && stored.pos ) {
                map.setView(stored.pos, stored.zoom || this.options.maxInitialZoom);
            } else {
                var maxZoom = this.options.maxInitialZoom;
                map.fitBounds(bounds, { animate: false });
                if( stored && stored.zoom )
                    map.setZoom(stored.zoom, { animate: false });
                else if( initial && map.getZoom() > maxZoom )
                    map.setZoom(maxZoom, { animate: false });
            }
        };

        var boundsZoom = map.getBoundsZoom(bounds, false);
        if( boundsZoom )
            applyZoom.call(this);
        else
            map.on('load', applyZoom, this);
    },

    createOpenStreetMapLayer: function() {
        return L.tileLayer('http://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            name: 'OpenStreetMap',
            attribution: 'Map &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>',
            minZoom: 2,
            maxZoom: 18
        });
    },

    _addLayers: function( map ) {
        var layers = this.options.createLayers ? this.options.createLayers.call(this, L) : null;
        if( (!layers || !layers.length) && window.layerList && this.options.layers )
            layers = window.layerList.getLeafletLayers(this.options.layers, L);
        if( !layers || !layers.length )
            layers = [this.createOpenStreetMapLayer()];
        for( var j = 0; j < layers.length; j++ )
            if( layers[j] === 'OSM' )
                layers[j] = this.createOpenStreetMapLayer();
        map.addLayer(layers[0]);
        
        if( layers.length > 1 ) {
            var control, i;
            if( !this.options.preferStandardLayerSwitcher && L.StaticLayerSwitcher ) {
                control = L.staticLayerSwitcher();
                for( i = 0; i < layers.length; i++ )
                    control.addLayer(layers[i].options.name, layers[i]);
                map.addControl(control);
            } else {
                control = L.control.layers();
                for( i = 0; i < layers.length; i++ )
                    control.addBaseLayer(layers[i], layers[i].options.name);
                map.addControl(control);
            }
        }
    },

    _hideClassPresent: function( element ) {
        if( typeof element.className !== 'string' )
            return false;
        var classNames = element.className.split(' '),
            classHide = this.options.hideInsideClasses, i, j;
        if( !classHide || !classHide.length )
            return false;
        for( i = 0; i < classNames.length; i++ )
            for( j = 0; j < classHide.length; j++ )
                if( classNames[i] === classHide[j] )
                    return true;
        return element.parentNode && this._hideClassPresent(element.parentNode);
    },
    
    _px: function( size ) {
        return size ? size + 'px' : '100%';
    },

    // Create map panel, parse and display bbcode (it can be skipped: so it's an attribute or contents of element)
    show: function( element, bbcode ) {
        var el = typeof element === 'string' ? document.getElementById(element) : element;
        if( !el ) return;
        if( !bbcode )
            bbcode = el.getAttribute('bbcode') || el.getAttribute('value') || el.innerHTML.replace(/^\s+|\s+$/g, '');
        if( !bbcode ) return;
        while( el.firstChild )
            el.removeChild(el.firstChild);
        if( this._hideClassPresent(el) )
            return;
        var mapDiv = el.ownerDocument.createElement('div');
        mapDiv.style.width = this.options.fullFromStart ? '100%' : this._px(this.options.viewWidth);
        mapDiv.style.height = this.options.fullFromStart ? this._px(this.options.fullViewHeight) : this._px(this.options.viewHeight);
        el.appendChild(mapDiv);

        var map = L.map(mapDiv, L.extend({}, { scrollWheelZoom: false, zoomControl: false }, this.options.leafletOptions));
        map.addControl(new L.Control.Zoom({ zoomInTitle: this.strings.zoomInTitle, zoomOutTitle: this.strings.zoomOutTitle }));
        this._addLayers(map);

        var drawn = new L.FeatureGroup();
        drawn.addTo(map);
        var data = window.MapBBCodeProcessor.stringToObjects(bbcode), objs = data.objs;
        for( var i = 0; i < objs.length; i++ )
            this._objectToLayer(objs[i]).addTo(drawn);
        this._zoomToLayer(map, drawn, { zoom: data.zoom, pos: data.pos }, true);

        if( this.options.fullScreenButton && !this.options.fullFromStart ) {
            var fs = new L.FunctionButton(window.MapBBCode.buttonsImage, { position: 'topright', bgPos: [0, 0], title: this.strings.fullScreenTitle }),
                isFull = false, oldSize;
            map.addControl(fs);
            fs.on('clicked', function() {
                var style = map.getContainer().style;
                if( !isFull && !oldSize )
                    oldSize = [style.width, style.height];
                isFull = !isFull;
                style.width = isFull ? '100%' : oldSize[0];
                style.height = isFull ? this._px(this.options.fullViewHeight) : oldSize[1];
                map.invalidateSize();
                fs.setBgPos([isFull ? 26 : 0, 0]);
                this._zoomToLayer(map, drawn);
            }, this);
        }

        if( this.options.outerLinkTemplate ) {
            var outer = L.functionButton(window.MapBBCode.buttonsImage, { position: 'topright', bgPos: [52, 0], title: this.strings.outerTitle });
            outer.on('clicked', function() {
                var template = this.options.outerLinkTemplate;
                template = template.replace('{zoom}', map.getZoom()).replace('{lat}', map.getCenter().lat).replace('{lon}', map.getCenter().lng);
                window.open(template, 'mapbbcode_outer');
            }, this);
            map.addControl(outer);
        }
    }
});


/*
 * A leaflet button with icon or text and click listener.
 */
L.FunctionButtons = L.Control.extend({
    includes: L.Mixin.Events,

    initialize: function( content, options ) {
        this._content = content;
        if( !options.titles )
            options.titles = [];
        if( options.titles.length < content.length )
            for( var i = options.titles.length; i < content.length; i++ )
                options.titles.push('');
        L.Control.prototype.initialize.call(this, options);
    },

    onAdd: function( map ) {
        this._map = map;
        this._links = [];

        var container = L.DomUtil.create('div', 'leaflet-bar');
        for( var i = 0; i < this._content.length; i++ ) {
            var link = L.DomUtil.create('a', '', container);
            this._links.push(link);
            link.href = '#';
            link.style.padding = '0 4px';
            link.style.width = 'auto';
            link.style.minWidth = '20px';
            if( this.options.titles && this.options.titles.length > i )
                link.title = this.options.titles[i];
            this._updateContent(i);

            var stop = L.DomEvent.stopPropagation;
            L.DomEvent
                .on(link, 'click', stop)
                .on(link, 'mousedown', stop)
                .on(link, 'dblclick', stop)
                .on(link, 'click', L.DomEvent.preventDefault)
                .on(link, 'click', this.clicked, this);
        }

        return container;
    },

    _updateContent: function( n ) {
        if( n >= this._content.length )
            return;
        var link = this._links[n],
            content = this._content[n];
        if( typeof content === 'string' ) {
            var ext = content.length < 4 ? '' : content.substring(content.length - 4),
                isData = content.substring(0, 11) === 'data:image/';
            if( ext === '.png' || ext === '.gif' || ext === '.jpg' || isData ) {
                link.style.width = '' + (this.options.imageSize || 26) + 'px';
                link.style.height = '' + (this.options.imageSize || 26) + 'px';
                link.style.padding = '0';
                link.style.backgroundImage = 'url(' + content + ')';
                link.style.backgroundRepeat = 'no-repeat';
                link.style.backgroundPosition = this.options.bgPos && this.options.bgPos.length > n && this.options.bgPos[n] ? (-this.options.bgPos[n][0]) + 'px ' + (-this.options.bgPos[n][1]) + 'px' : '0px 0px';
            } else
                link.innerHTML = content;
        } else {
            while( link.firstChild )
                link.removeChild(link.firstChild);
            link.appendChild(content);
        }
    },

    setContent: function( n, content ) {
        if( n >= this._content.length )
            return;
        this._content[n] = content;
        this._updateContent(n);
    },

    setTitle: function( n, title ) {
        this.options.titles[n] = title;
        this._links[n].title = title;
    },

    setBgPos: function( n, bgPos ) {
        this.options.bgPos[n] = bgPos;
        this._links[n].style.backgroundPosition = bgPos ? (-bgPos[0]) + 'px ' + (-bgPos[1]) + 'px' : '0px 0px';
    },

    clicked: function(e) {
        var link = e.target, idx = this._links.length;
        while( --idx >= 0 )
            if( link === this._links[idx] )
                break;
        this.fire('clicked', {idx: idx});
    }
});

L.functionButtons = function( content, options ) {
    return new L.FunctionButtons(content, options);
};

L.FunctionButton = L.FunctionButtons.extend({
    initialize: function( content, options ) {
        if( options.title )
            options.titles = [options.title];
        if( options.bgPos )
            options.bgPos = [options.bgPos];
        L.FunctionButtons.prototype.initialize.call(this, [content], options);
    },

    setContent: function( content ) {
        L.FunctionButtons.prototype.setContent.call(this, 0, content);
    },

    setTitle: function( title ) {
        L.FunctionButtons.prototype.setTitle.call(this, 0, title);
    },
    
    setBgPos: function( bgPos ) {
        L.FunctionButtons.prototype.setBgPos.call(this, 0, bgPos);
    }
});

L.functionButton = function( content, options ) {
    return new L.FunctionButton(content, options);
};


/* jshint laxbreak: true */
window.MapBBCode.buttonsImage = 'data:image/png;base64,'
+'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'
+'7QAAAABJRU5ErkJggg=='
;


/*
 * Text labels. Editing only for markers.
 */

if( !('objectParams' in window.MapBBCode) )
    window.MapBBCode.objectParams = [];

window.MapBBCode.objectParams.unshift({
    text: true,

    // this regex always fails
    reKeys: new RegExp('a^'),
    
    applicableTo: function( layer ) {
        return true;
    },

    // creates marker from text
    objectToLayer: function( layer, text, ui ) {
        if( text ) {
            layer._text = text;
            if( L.LetterIcon && layer instanceof L.Marker && ui.options.letterIcons && text.length >= 1 && text.length <= 2 ) {
                layer.setIcon(new L.LetterIcon(text));
                layer.options.clickable = false;
            } else {
                layer.bindPopup(text.replace(new RegExp('<(?!/?(' + ui.options.allowedHTML + ')[ >])', 'g'), '&lt;'));
            }
        } else
            layer.options.clickable = false;
    },
    
    // returns new text
    layerToObject: function( layer ) {
        return layer.inputField ? layer.inputField.value.replace(/\\n/g, '\n').replace(/\\\n/g, '\\n') : (layer._text || '');
    },
    
    createEditorPanel: function( layer, ui ) {
        if( !(layer instanceof L.Marker ) )
            return;
        var commentDiv = document.createElement('div');
        var commentSpan = document.createTextNode(ui.strings.title + ': ');
        var inputField = document.createElement('input');
        inputField.type = 'text';
        inputField.size = 20;
        if( layer._text )
            inputField.value = layer._text.replace(/\\n/g, '\\\\n').replace(/[\r\n]+/g, '\\n');
        commentDiv.appendChild(commentSpan);
        commentDiv.appendChild(inputField);
        commentDiv.style.marginBottom = '8px';

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
            if( L.LetterIcon && ui.options.letterIcons && title.length > 0 && title.length <= 2 )
                layer.setIcon(new L.LetterIcon(title));
            else
                layer.setIcon(layer.defaultIcon);
        }, this);
        return commentDiv;
    }
});


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

        obj.params = layer._objParams || [];
        this._eachParamHandler(function(handler) {
            if( handler.text ) {
                var text = handler.layerToObject(layer, '', this);
                if( text )
                    obj.text = text;
            } else {
                // remove relevant params
                var lastParams = [], j;
                for( j = obj.params.length - 1; j >= 0; j-- )
                    if( handler.reKeys.test(obj.params[j]) )
                        lastParams.unshift(obj.params.splice(j, 1));
                var p = handler.layerToObject(layer, lastParams, this);
                if( p && p.length > 0 ) {
                    for( j = 0; j < p.length; j++ )
                        obj.params.push(p[j]);
                }
            }
        }, this, layer);
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
        if( layer instanceof L.Polyline || layer instanceof L.Polygon )
            layer.editing.enable();

        this._eachParamHandler(function(handler) {
            var div = handler.createEditorPanel ? handler.createEditorPanel(layer, this) : null;
            if( div )
                parentDiv.appendChild(div);
        }, this, layer);

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
        mapDiv.style.height = this._px(this.options.editorHeight);
        el.appendChild(mapDiv);

        var map = L.map(mapDiv, L.extend({}, { zoomControl: false }, this.options.leafletOptions));
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
        L.drawLocal.draw.toolbar.buttons.polygon = this.strings.polygonTitle;
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
                        color: '#000000',
                        weight: 5,
                        opacity: 0.7
                    }
                },
                polygon: this.options.enablePolygons ? {
                    showArea: false,
                    guidelineDistance: 10,
                    shapeOptions: {
                        color: '#000000',
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
        this._eachParamHandler(function(handler) {
            if( handler.initDrawControl )
                handler.initDrawControl(drawControl);
        });
        map.addControl(drawControl);
        map.on('draw:created', function(e) {
            var layer = e.layer;
            this._eachParamHandler(function(handler) {
                if( handler.initLayer )
                    handler.initLayer(layer);
            }, this, layer);
            this._makeEditable(layer, drawn);
            drawn.addLayer(layer);
            if( e.layerType === 'marker' )
                layer.openPopup();
        }, this);

        if( this.options.editorCloseButtons ) {
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
        }

        if( this.options.showHelp ) {
            var help = L.functionButton('<span style="font-size: 18px; font-weight: bold;">?</span>', { position: 'topright', title: this.strings.helpTitle });
            help.on('clicked', function() {
                var str = '',
                    help = this.strings.helpContents,
                    features = 'resizable,dialog,scrollbars,height=' + this.options.windowHeight + ',width=' + this.options.windowWidth;
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
        
        return {
            _ui: this,
            map: map,
            close: function() {
                var finalCode = this.getBBCode();
                this.map = null;
                this._ui = null;
                this.getBBCode = function() { return finalCode; };
                el.removeChild(el.firstChild);
            },
            getBBCode: function() {
                var objs = [];
                drawn.eachLayer(function(layer) {
                    objs.push(this._layerToObject(layer));
                }, this._ui);
                return window.MapBBCodeProcessor.objectsToString({ objs: objs, zoom: objs.length ? 0 : map.getZoom(), pos: objs.length ? 0 : map.getCenter() });
            }
        };
    },

    // Opens editor window. Requires options.labPath to be correct
    editorWindow: function( bbcode, callback, context ) {
        window.storedMapBB = {
            bbcode: bbcode,
            callback: callback,
            context: context,
            caller: this
        };

        var features = this.options.windowFeatures,
            featSize = 'height=' + this.options.windowHeight + ',width=' + this.options.windowWidth,
            basePath = location.href.match(/^(.+\/)([^\/]+)?$/)[1],
            libUrl = basePath + this.options.libPath,
            win = window.open(this.options.usePreparedWindow ? (typeof this.options.usePreparedWindow === 'string' ? this.options.usePreparedWindow : libUrl + 'mapbbcode-window.html') : '', 'mapbbcode_editor', features + ',' + featSize);

        if( !this.options.usePreparedWindow ) {
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
        }
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
            this.storedMapBB = null;
        }, this);
    }
});


/*
 * Support for color params.
 */

if( !('objectParams' in window.MapBBCode) )
    window.MapBBCode.objectParams = [];

window.MapBBCode.objectParams.push({
    lineColors: {
        def: '#0022dd',
        blue: '#0022dd',
        red: '#bb0000',
        green: '#007700',
        brown: '#964b00',
        purple: '#800080',
        black: '#000000'
    },

    // regular expression for supported keys
    reKeys: new RegExp('^(blue|red|green|brown|purple|black)$'),
    
    applicableTo: function( layer ) {
        return layer instanceof L.Polygon || layer instanceof L.Polyline;
    },

    // applies relevant params to the layer object
    objectToLayer: function( layer, params ) {
        var colors = this.lineColors,
            color = params.length > 0 && params[0] in colors ? colors[params[0]] : colors.def;
        layer.options.color = color;
        if( layer instanceof L.Polygon )
            layer.options.fillColor = color;
    },
    
    // returns array with layer properties
    layerToObject: function( layer, lastParams ) {
        return layer._colorName ? (this.lineColors[layer._colorName] !== this.lineColors.def ? [layer._colorName] : []) : lastParams;
    },
    
    initLayer: function( layer ) {
    },
    
    initDrawControl: function(draw) {
        draw.options.draw.polyline.shapeOptions.color = this.lineColors.def;
        draw.options.draw.polygon.shapeOptions.color = this.lineColors.def;
    },
    
    createEditorPanel: function( layer ) {
        var colorDiv = document.createElement('div');
        var colors = [], c, lineColors = this.lineColors;
        for( c in lineColors )
            if( typeof lineColors[c] === 'string' && lineColors[c].substring(0, 1) === '#' )
                colors.push(c);
        colors = colors.sort();
        colorDiv.style.width = 10 + 20 * colors.length + 'px';
        colorDiv.textAlign = 'center';
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
            var color = lineColors[colors[i]];
            col.style.backgroundColor = color;
            col.style.borderWidth = '3px';
            col.style.borderStyle = 'solid';
            col.style.borderColor = color == layer.options.color ? '#aaa' : 'white';
            col.onclick = colOnclick;
            colorDiv.appendChild(col);
        }
        return colorDiv;
    }
});


/*
 * Round icon with some letters on it.
 */
L.LetterIcon = L.Icon.extend({
    options: {
        className: 'leaflet-div-icon',
        color: 'black',
        radius: 11
    },

    initialize: function(letter, options) {
        this._letter = letter;
        L.setOptions(this, options);
    },

    createIcon: function() {
        var radius = this.options.radius,
            diameter = radius * 2 + 1;
        var div = document.createElement('div');
        div.innerHTML = this._letter;
        div.className = 'leaflet-marker-icon';
        div.style.marginLeft = (-radius-2) + 'px';
        div.style.marginTop  = (-radius-2) + 'px';
        div.style.width      = diameter + 'px';
        div.style.height     = diameter + 'px';
        div.style.borderRadius = (radius + 2) + 'px';
        div.style.borderWidth = '2px';
        div.style.borderColor = 'white';
        div.style.fontSize   = '10px';
        div.style.fontFamily = 'sans-serif';
        div.style.fontWeight = 'bold';
        div.style.textAlign  = 'center';
        div.style.lineHeight = diameter + 'px';
        div.style.color      = 'white';
        div.style.backgroundColor = this.options.color;
        this._setIconStyles(div, 'icon');
        return div;
    },

    createShadow: function() { return null; }
});

L.letterIcon = function(letter, options) {
    return new L.LetterIcon(letter, options);
};


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


}(window, document));