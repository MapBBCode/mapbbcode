/*
 JavaScript library for [map] BBCode parsing, displaying and editing.
 Version 1.0.0
 https://github.com/MapBBCode/mapbbcode
 (c) 2013, Ilya Zverev
 Licensed WTFPL.
*/
(function (window, document, undefined) {
L = window.L;
/*
 * Layer switcher control that isn't a popup button.
 * Does not support overlay layers.
 */
L.StaticLayerSwitcher = L.Control.extend({
    includes: L.Mixin.Events,

    options: {
        position: 'topright',
        editable: false,
        bgColor: 'white',
        selectedColor: '#ddd',
        maxLayers: 7
    },

    initialize: function( layers, options ) {
        L.setOptions(this, options);
        this._layers = [];
        this._selected = 0;
        if( layers ) {
            if( 'push' in layers && 'splice' in layers ) { // in IE arrays can be [object Object]
                for( var i = 0; i < layers.length; i++ )
                    this.addLayer(layers[i]);
            } else {
                for( var id in layers )
                    this.addLayer(id, layers[id]);
            }
        }
    },

    getLayers: function() {
        var result = [];
        for( var i = 0; i < this._layers.length; i++ )
            result.push(this._layers[i].layer);
        return result;
    },

    getLayerIds: function() {
        var result = [];
        for( var i = 0; i < this._layers.length; i++ )
            result.push(this._layers[i].id);
        return result;
    },

    getSelectedLayer: function() {
        return this._layers.length > 0 && this._selected < this._layers.length ? this._layers[this._selected].layer : null;
    },

    getSelectedLayerId: function() {
        return this._layers.length > 0 && this._selected < this._layers.length ? this._layers[this._selected].id : '';
    },

    updateId: function( layer, id ) {
        var i = this._findLayer(layer),
            l = i >= 0 && this._layers[i];
        if( l && l.id !== id ) {
            l.id = id;
            if( l.fromList ) {
                var onMap = this._map && this._map.hasLayer(layer),
                    newLayer = window.layerList.getLeafletLayers([id])[0];
                if( onMap )
                    this._map.removeLayer(layer);
                if( newLayer ) {
                    l.layer = newLayer;
                    if( onMap )
                        this._map.addLayer(newLayer);
                } else {
                    this._layers.splice(i, 1);
                }
            }
            this._update();
            return layer;
        }
        return null;
    },

    addLayer: function( id, layer ) {
        if( this._layers.length >= this.options.maxLayers )
            return;
        var l = layer || (window.layerList && window.layerList.getLeafletLayers([id])[0]);
        if( l ) {
            this._layers.push({ id: id, layer: l, fromList: !layer });
            this._update();
            this.fire('layerschanged', { layers: this.getLayerIds() });
            if( this._layers.length == 1 )
                this.fire('selectionchanged', { selected: this.getSelectedLayer(), selectedId: this.getSelectedLayerId() });
            return layer;
        }
        return null;
    },

    removeLayer: function( layer ) {
        var i = this._findLayer(layer);
        if( i >= 0 ) {
            var removingSelected = this._selected == i;
            if( removingSelected )
                this._map.removeLayer(layer);
            this._layers.splice(i, 1);
            if( this._selected >= this._layers.length )
                this._selected = this._layers.length - 1;
            this._update();
            this.fire('layerschanged', { layers: this.getLayerIds() });
            if( removingSelected )
                this.fire('selectionchanged', { selected: this.getSelectedLayer(), selectedId: this.getSelectedLayerId() });
            return layer;
        }
        return null;
    },

    moveLayer: function( layer, moveDown ) {
        var pos = this._findLayer(layer),
            newPos = moveDown ? pos + 1 : pos - 1;
        if( pos >= 0 && newPos >= 0 && newPos < this._layers.length ) {
            var tmp = this._layers[pos];
            this._layers[pos] = this._layers[newPos];
            this._layers[newPos] = tmp;
            if( pos == this._selected )
                this._selected = newPos;
            else if( newPos == this._selected )
                this._selected = pos;
            this._update();
            this.fire('layerschanged', { layers: this.getLayerIds() });
        }
    },

    _findLayer: function( layer ) {
        for( var i = 0; i < this._layers.length; i++ )
            if( this._layers[i].layer === layer )
                return i;
        return -1;
    },

    onAdd: function( map ) {
        var container = L.DomUtil.create('div', 'leaflet-bar');
        if (!L.Browser.touch) {
            L.DomEvent.disableClickPropagation(container);
            L.DomEvent.on(container, 'mousewheel', L.DomEvent.stopPropagation);
        } else {
            L.DomEvent.on(container, 'click', L.DomEvent.stopPropagation);
        }
        this._map = map;
        this._container = container;
        this._update();
        return container;
    },

    // accepts value at index in this._layers array
    _createItem: function( layerMeta ) {
        var div = document.createElement('div');
        div.style.backgroundColor = this.options.bgColor;
        this._addHoverStyle(div, 'backgroundColor', this.options.selectedColor);
        div.style.padding = '4px 10px';
        div.style.color = 'black';
        div.style.cursor = 'default';
        var label = layerMeta.id.indexOf(':') < 0 || !layerMeta.fromList ? layerMeta.id : layerMeta.id.substring(0, layerMeta.id.indexOf(':'));
        div.appendChild(document.createTextNode(label));
        if( this.options.editable )
            div.appendChild(this._createLayerControls(layerMeta.layer));
        L.DomEvent.on(div, 'click', function() {
            var index = this._findLayer(layerMeta.layer);
            if( this._selected != index ) {
                this._selected = index;
                this._update();
                this.fire('selectionchanged', { selected: this.getSelectedLayer(), selectedId: this.getSelectedLayerId() });
            }
        }, this);
        return div;
    },

    _createLayerControls: function( layer ) {
        var upClick = document.createElement('span');
        upClick.innerHTML ='&utrif;';
        upClick.style.cursor = 'pointer';
        this._addHoverStyle(upClick, 'color', '#aaa');
        L.DomEvent.on(upClick, 'click', function() {
            this.moveLayer(layer, false);
        }, this);

        var downClick = document.createElement('span');
        downClick.innerHTML ='&dtrif;';
        downClick.style.cursor = 'pointer';
        downClick.style.marginLeft = '6px';
        this._addHoverStyle(downClick, 'color', '#aaa');
        L.DomEvent.on(downClick, 'click', function() {
            this.moveLayer(layer, true);
        }, this);

        var xClick = document.createElement('span');
        xClick.innerHTML ='&Cross;';
        xClick.style.cursor = 'pointer';
        xClick.style.marginLeft = '6px';
        this._addHoverStyle(xClick, 'color', '#aaa');
        L.DomEvent.on(xClick, 'click', function() {
            this.removeLayer(layer);
        }, this);

        var span = document.createElement('span');
        span.style.fontSize = '12pt';
        span.style.marginLeft = '12px';
        span.appendChild(upClick);
        span.appendChild(downClick);
        span.appendChild(xClick);
        L.DomEvent.on(span, 'click', L.DomEvent.stopPropagation);
        return span;
    },

    _addHoverStyle: function( element, name, value ) {
        var defaultValue = element.style[name];
        L.DomEvent.on(element, 'mouseover', function() {
            if( element.style[name] !== value ) {
                defaultValue = element.style[name];
                element.style[name] = value;
            }
        });
        element.resetHoverStyle = function() {
            element.style[name] = defaultValue;
        };
        element.updateHoverDefault = function() {
            defaultValue = element.style[name];
        };
        L.DomEvent.on(element, 'mouseout', element.resetHoverStyle);
    },

    _recursiveCall: function( element, functionName ) {
        if( element && element[functionName] ) {
            element[functionName].call(element);
            var children = element.getElementsByTagName('*');
            for( var j = 0; j < children.length; j++ )
                if( children[j][functionName] )
                    children[j][functionName].call(children[j]);
        }
    },

    _update: function() {
        if( !this._container )
            return;
        var presentDivs = [];
        for( var i = 0; i < this._layers.length; i++ ) {
            var l = this._layers[i];
            if( !l.div )
                l.div = this._createItem(l);
            else
                this._recursiveCall(l.div, 'resetHoverStyle');
            l.div.style.background = this._selected == i ? this.options.selectedColor : this.options.bgColor;
            l.div.style.borderTop = i ? '1px solid ' + this.options.selectedColor : '0';
            this._recursiveCall(l.div, 'updateHoverDefault');
            this._container.appendChild(l.div);
            presentDivs.push(l.div);
            if( this._map.hasLayer(l.layer) && this._selected != i )
                this._map.removeLayer(l.layer);
            else if( !this._map.hasLayer(l.layer) && this._selected == i )
                this._map.addLayer(l.layer);
        }
        
        var alldivs = this._container.childNodes, found;
        for( var j = 0; j < alldivs.length; j++ ) {
            found = false;
            for( var k = 0; k < presentDivs.length; k++ )
                if( presentDivs[k] === alldivs[j] )
                    found = true;
            if( !found )
                this._container.removeChild(alldivs[j]);
        }
    }
});

L.staticLayerSwitcher = function( layers, options ) {
    return new L.StaticLayerSwitcher(layers, options);
};


/*
 * List of public-use layers.
 */
window.layerList = {
    // some entries in this list were adapted from the https://github.com/leaflet-extras/leaflet-providers list (it has BSD 2-clause license)
    list: {
        "OpenStreetMap": "L.tileLayer('http://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: 'Map &copy; <a href=\"http://openstreetmap.org\">OpenStreetMap</a>', minZoom: 0, maxZoom: 19 })",
        "OpenStreetMap DE": "L.tileLayer('http://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png', { attribution: 'Map &copy; <a href=\"http://openstreetmap.org\">OpenStreetMap</a>', minZoom: 0, maxZoom: 18 })",
        "CycleMap": "L.tileLayer('http://{s}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png', { attribution: 'Map &copy; <a href=\"http://openstreetmap.org\">OSM</a> | Tiles &copy; <a href=\"http://www.opencyclemap.org\">Andy Allan</a>', minZoom: 0, maxZoom: 18 })",
        "OpenMapSurfer": "L.tileLayer('http://129.206.74.245:8001/tms_r.ashx?x={x}&y={y}&z={z}', { name: 'MapSurfer', attribution: 'Map &copy; <a href=\"http://openstreetmap.org\">OSM</a> | Tiles &copy; <a href=\"http://giscience.uni-hd.de/\">GIScience Heidelberg</a>', minZoom: 0, maxZoom: 19 })",
        "OpenMapSurfer Grayscale": "L.tileLayer('http://129.206.74.245:8008/tms_rg.ashx?x={x}&y={y}&z={z}', { name: 'MapSurfer', attribution: 'Map &copy; <a href=\"http://openstreetmap.org\">OSM</a> | Tiles &copy; <a href=\"http://giscience.uni-hd.de/\">GIScience Heidelberg</a>', minZoom: 0, maxZoom: 19 })",
        "Humanitarian": "L.tileLayer('http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', { attribution: 'Map &copy; <a href=\"http://openstreetmap.org\">OpenStreetMap</a> | Tiles &copy; <a href=\"http://hot.openstreetmap.org\">Humanitarian OSM Team</a>', minZoom: 0, maxZoom: 19 })",
        "Transport": "L.tileLayer('http://{s}.tile2.opencyclemap.org/transport/{z}/{x}/{y}.png', { attribution: 'Map &copy; <a href=\"http://openstreetmap.org\">OSM</a> | Tiles &copy; <a href=\"http://www.opencyclemap.org\">Andy Allan</a>', minZoom: 0, maxZoom: 18 })",
        "Landscape": "L.tileLayer('http://{s}.tile3.opencyclemap.org/landscape/{z}/{x}/{y}.png', { attribution: 'Map &copy; <a href=\"http://openstreetmap.org\">OSM</a> | Tiles &copy; <a href=\"http://www.opencyclemap.org\">Andy Allan</a>', minZoom: 0, maxZoom: 18 })",
        "Outdoors": "L.tileLayer('http://{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png', { attribution: 'Map &copy; <a href=\"http://openstreetmap.org\">OSM</a> | Tiles &copy; <a href=\"http://www.opencyclemap.org\">Andy Allan</a>', minZoom: 0, maxZoom: 18 })",
        "MapQuest Open": "L.tileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpeg', { attribution: 'Map &copy; <a href=\"http://openstreetmap.org\">OSM</a> | Tiles &copy; <a href=\"http://www.mapquest.com/\">MapQuest</a>', subdomains: '1234', minZoom: 0, maxZoom: 18 })",
        "Stamen Toner": "L.tileLayer('http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png', { attribution: 'Map &copy; <a href=\"http://openstreetmap.org\">OSM</a> | Tiles &copy; <a href=\"http://stamen.com\">Stamen Design</a>', minZoom: 0, maxZoom: 20 })",
        "Stamen Toner Lite": "L.tileLayer('http://{s}.tile.stamen.com/toner-lite/{z}/{x}/{y}.png', { attribution: 'Map &copy; <a href=\"http://openstreetmap.org\">OSM</a> | Tiles &copy; <a href=\"http://stamen.com\">Stamen Design</a>', minZoom: 0, maxZoom: 20 })",
        "Stamen Watercolor": "L.tileLayer('http://{s}.tile.stamen.com/watercolor/{z}/{x}/{y}.png', { attribution: 'Map &copy; <a href=\"http://openstreetmap.org\">OSM</a> | Tiles &copy; <a href=\"http://stamen.com\">Stamen Design</a>', minZoom: 3, maxZoom: 16 })",
        "Esri Street Map": "L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', { attribution: 'Tiles &copy; <a href=\"http://www.esri.com/software/arcgis/arcgisonline/maps/maps-and-map-layers\">Esri</a> | Sources: Sources: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom', minZoom: 0, maxZoom: 18 })",
        "Esri Topographic": "L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', { attribution: 'Tiles &copy; <a href=\"http://www.esri.com/software/arcgis/arcgisonline/maps/maps-and-map-layers\">Esri</a> | Sources: Sources: Esri, DeLorme, NAVTEQ, TomTom, Intermap, increment P Corp., GEBCO, USGS, FAO, NPS, NRCAN, GeoBase, IGN, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), swisstopo, and the GIS User Community', minZoom: 0, maxZoom: 18 })",
        "National Geographic": "L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}', { attribution: 'Tiles &copy; <a href=\"http://www.esri.com/software/arcgis/arcgisonline/maps/maps-and-map-layers\">Esri</a> | Sources: Sources: National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC', minZoom: 0, maxZoom: 16 })",
        "Esri Light Gray": "L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', { attribution: 'Tiles &copy; <a href=\"http://www.esri.com/software/arcgis/arcgisonline/maps/maps-and-map-layers\">Esri</a> | Sources: Sources: Esri, DeLorme, NAVTEQ', minZoom: 0, maxZoom: 16 })",
        "Esri Imagery": "L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'Tiles &copy; <a href=\"http://www.esri.com/software/arcgis/arcgisonline/maps/maps-and-map-layers\">Esri</a> | Sources: Sources: Esri, DigitalGlobe, GeoEye, i-cubed, USDA FSA, USGS, AEX, Getmapping, Aerogrid, IGN, IGP, swisstopo, and the GIS User Community', minZoom: 0, maxZoom: 18 })",
        "Bing Satellite": "new L.BingLayer('{key:http://msdn.microsoft.com/en-us/library/ff428642.aspx}')"
    },

    getSortedKeys: function() {
        var result = [], k;
        for( k in this.list )
            if( this.list.hasOwnProperty(k) )
                result.push(k);
        result.sort();
        return result;
    },

    requiresKey: function( layer ) {
        var reKeyC = /{key(?::[^}]+)?}/,
            l = this.list[layer];
        return l && reKeyC.test(l);
    },

    getKeyLink: function( layer ) {
        var reKeyC = /{key(?::([^}]+))?}/,
            l = this.list[layer],
            m = l && l.match(reKeyC);
        return m && m[1] && m[1].length > 0 ? m[1] : '';
    },

    getLeafletLayers: function( layers, LL ) {
        /* jshint unused: false */
        var L = LL || window.L,
            l = typeof layers === 'string' ? layers.split(',') : layers,
            layerList = this.list,
            reKeyC = /{key(?::[^}]+)?}/,
            result = [];
        for( var i = 0; i < l.length; i++ ) {
            var m = l[i].match(/^(.+?)(?::([^'"]+))?$/);
            if( m && m[1] && layerList[m[1]] ) {
                var layer = layerList[m[1]];
                if( m[2] && m[2].length > 0 )
                    layer = layer.replace(reKeyC, m[2]);
                if( !reKeyC.test(layer) ) {
                    try {
                        var done = eval(layer);
                        if( done ) {
                            if( done.options )
                                done.options.name = m[1];
                            result.push(done);
                        }
                    } catch(e) {}
                }
            }
        }
        return result;
    }
};


/*
 * Configuration panel for some of MapBBCodeUI properties
 * Callback is invoked every time any of the options is changed
 */
window.MapBBCodeConfig = L.Class.extend({
    includes: L.Mixin.Events,

    options: {
        layers: [],
        defaultZoom: 2,
        defaultPosition: [22, 11],
        viewWidth: 600,
        viewHeight: 300,
        fullViewHeight: 600,
        editorHeight: 400,
        windowWidth: 800,
        windowHeight: 500,
        fullFromStart: false,
        editorInWindow: true,
        editorTypeFixed: false,
        maxLayers: 5
    },

    strings: {},

    initialize: function( options ) {
        L.setOptions(this, options);
    },

    setStrings: function( strings ) {
        this.strings = L.extend({}, this.strings, strings);
    },

    addLayer: function( id ) {
        this._layerSwitcher.addLayer(id);
    },

    _updateDivSize:function (el) {
        var width, height, mode = this._mode;
        if( mode === 'view' && this.options.fullFromStart )
            mode = 'full';
        if( mode === 'edit' && this.options.editorInWindow )
            mode = 'window';
        if( mode === 'view' ) {
            width = '' + this.options.viewWidth + 'px';
            height = '' + this.options.viewHeight + 'px';
        } else if( mode === 'full' ) {
            width = '100%';
            height = '' + this.options.fullViewHeight + 'px';
        } else if( mode === 'edit' ) {
            width = '100%';
            height = '' + this.options.editorHeight + 'px';
        } else if( mode === 'window' ) {
            width = this.options.windowWidth || this.options.viewWidth;
            height = this.options.windowHeight || this.options.editorHeight;
        }
        el.style.width = width;
        el.style.height = height;
    },

    _latLngToArray: function( latlng ) {
        return [
            L.Util.formatNum(latlng.lat, 5),
            L.Util.formatNum(latlng.lng, 5)
        ];
    },

    _updateFullTitle: function( mode, fs ) {
        if( this._mode === 'view' ) {
            mode.setContent(this.strings.view);
            mode.setTitle(this.strings.viewTitle);
            fs.setContent(this.options.fullFromStart ? this.strings.viewFull : this.strings.viewNormal);
            fs.setTitle(this.options.fullFromStart ? this.strings.viewFullTitle : this.strings.viewNormalTitle);
        } else if( this._mode === 'edit' ) {
            mode.setContent(this.strings.editor);
            mode.setTitle(this.strings.editorTitle);
            fs.setContent(this.options.editorInWindow ? this.strings.editInWindow : this.strings.editInPanel);
            fs.setTitle(this.options.editorInWindow ? this.strings.editInWindowTitle : this.strings.editInPanelTitle);
        }
    },
    
    // options is an object with a lot of properties
    bindLayerAdder: function( options ) {
        function getElement(id) {
            return typeof id === 'string' ? document.getElementById(id) : id;
        }
        
        var select = getElement(options.select),
            addButton = getElement(options.button),
            keyBlock = getElement(options.keyBlock),
            keyTitle = getElement(options.keyTitle),
            keyValue = getElement(options.keyValue);
            
        keyBlock.style.display = 'none';
        keyValue.value = '';
        if( !addButton.value )
            addButton.value = this.strings.addLayer;
            
        var onSelectChange = function(e) {
            var layer = e.target.value;
            var link = layer ? window.layerList.getKeyLink(layer) : '';
            if( link ) {
                keyTitle.innerHTML = this.strings.keyNeeded.replace('%s', link);
                keyValue.value = '';
                keyBlock.style.display = options.keyBlockDisplay || 'inline';
            } else {
                keyBlock.style.display = 'none';
            }
            addButton.disabled = layer ? false : true;
        };
        
        L.DomEvent.on(select, 'change', onSelectChange, this);

        var populateSelect = function() {
            var i, layerKeys = window.layerList.getSortedKeys(),
                layers = this.options.layers, layers0 = [];
            for( i = 0; i < layers.length; i++ ) {
                layers0.push(layers[i].indexOf(':') < 0 ? layers[i] :
                    layers[i].substring(0, layers[i].indexOf(':')));
            }
            while( select.firstChild ) {
                select.removeChild(select.firstChild);
            }
            var opt = document.createElement('option');
            opt.value = '';
            opt.selected = true;
            opt.innerHTML = this.strings.selectLayer + '...';
            select.appendChild(opt);
            for( i = 0; i < layerKeys.length; i++ ) {
                if( layers0.indexOf(layerKeys[i]) >= 0 ) {
                    continue;
                }
                opt = document.createElement('option');
                opt.innerHTML = layerKeys[i];
                opt.value = layerKeys[i];
                select.appendChild(opt);
            }
            onSelectChange.call(this, {target: select});
        };

        L.DomEvent.on(addButton, 'click', function() {
            var layer = select.value;
            if( !layer )
                return;
            var needKey = window.layerList.requiresKey(layer),
                key = keyValue.value.trim();
            if( needKey && !key.length ) {
                window.alert(this.strings.keyNeededAlert);
            } else {
                this.addLayer(needKey ? layer + ':' + key : layer);
            }
        }, this);
        
        this.on('show change', function() {
            populateSelect.call(this);
        }, this);
    },

    show: function( element ) {
        var el = typeof element === 'string' ? document.getElementById(element) : element;
        if( !el )
            return;
        this._mode = 'view';
        var mapDiv = document.createElement('div');
        el.appendChild(mapDiv);

        this._updateDivSize(mapDiv);

        var map = L.map(mapDiv, { zoomControl: false }).setView(this.options.defaultPosition && this.options.defaultPosition.length == 2 ? this.options.defaultPosition : [22, 11], this.options.defaultZoom);
        map.addControl(new L.Control.Zoom({ zoomInTitle: this.strings.zoomInTitle, zoomOutTitle: this.strings.zoomOutTitle }));
        var layerSwitcher = L.staticLayerSwitcher(this.options.layers, { editable: true, maxLayers: this.options.maxLayers });
        map.addControl(layerSwitcher);
        layerSwitcher.on('layerschanged', function(e) {
            this.options.layers = e.layers;
            this.fire('change', this.options);
        }, this);
        layerSwitcher.on('selectionchanged', function(e) {
            this.fire('layerselected', { id: e.selectedId });
        }, this);
        this.options.layers = layerSwitcher.getLayerIds();
        this._layerSwitcher = layerSwitcher;

        map.on('moveend zoomend', function() {
            this.options.defaultPosition = this._latLngToArray(map.getCenter());
            this.options.defaultZoom = map.getZoom();
            this.fire('change', this.options);
        }, this);

        var fs = new L.FunctionButton('full', { position: 'topright' });
        var modeButton = new L.FunctionButton('mode', { position: 'topright' });
        var widthButton = new L.FunctionButtons(['&ltrif;', '&rtrif;'], { position: 'bottomright', titles: [this.strings.shrinkTitle, this.strings.growTitle] });
        var heightButton = new L.FunctionButtons(['&utrif;', '&dtrif;'], { position: 'bottomleft', titles: [this.strings.shrinkTitle, this.strings.growTitle] });

        var toggleWidthButton = function() {
            var isFull = this._mode === 'view' ? this.options.fullFromStart : !this.options.editorInWindow;
            if( isFull )
                map.removeControl(widthButton);
            else
                map.addControl(widthButton);
        };

        fs.on('clicked', function() {
            var isFull = this._mode === 'view' ? this.options.fullFromStart : !this.options.editorInWindow;
            if( this._mode === 'view' )
                this.options.fullFromStart = !isFull;
            else
                this.options.editorInWindow = isFull;
            toggleWidthButton.call(this);
            this._updateFullTitle(modeButton, fs);
            this._updateDivSize(mapDiv);
            map.invalidateSize();
            this.fire('change', this.options);
        }, this);

        modeButton.on('clicked', function() {
            this._mode = this._mode === 'view' ? 'edit' : 'view';
            if( this.options.fullFromStart == this.options.editorInWindow )
                toggleWidthButton.call(this);
            if( this.options.editorTypeFixed ) {
                if( this._mode === 'view' )
                    map.addControl(fs);
                else
                    map.removeControl(fs);
            }
            this._updateFullTitle(modeButton, fs);
            this._updateDivSize(mapDiv);
            map.invalidateSize();
        }, this);

        widthButton.on('clicked', function(e) {
            var delta = e.idx * 100 - 50,
                value = this._mode === 'view' ? this.options.viewWidth : this.options.windowWidth;
            if( value + delta >= 400 && value + delta <= 1000 ) {
                // more strict checks
                if( this._mode === 'view' ) {
                    if( !this.options.fullFromStart ) {
                        this.options.viewWidth += delta;
                        this._updateDivSize(mapDiv);
                        map.invalidateSize();
                        this.fire('change', this.options);
                    }
                } else if( this._mode === 'edit' ) {
                    if( this.options.editorInWindow ) {
                        this.options.windowWidth += delta;
                        this._updateDivSize(mapDiv);
                        map.invalidateSize();
                        this.fire('change', this.options);
                    }
                }
            }
        }, this);

        heightButton.on('clicked', function(e) {
            var delta = e.idx * 100 - 50, value;
            if( this._mode === 'view' )
                value = this.options.fullFromStart ? this.options.fullViewHeight : this.options.viewHeight;
            else if( this._mode === 'edit' )
                value = this.options.editorInWindow ? this.options.windowHeight : this.options.editorHeight;

            if( value + delta >= 200 && value + delta <= 800 ) {
                if( this._mode === 'view' ) {
                    if( this.options.fullFromStart )
                        this.options.fullViewHeight += delta;
                    else
                        this.options.viewHeight += delta;
                } else if( this._mode === 'edit' ) {
                    if( this.options.editorInWindow )
                        this.options.windowHeight += delta;
                    else
                        this.options.editorHeight += delta;
                }
                this._updateDivSize(mapDiv);
                map.invalidateSize();
                this.fire('change', this.options);
            }
        }, this);

        map.addControl(modeButton);
        map.addControl(fs);
        map.addControl(widthButton);
        map.addControl(heightButton);
        this._updateFullTitle(modeButton, fs);
        this.fire('show', this.options);
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
        var link = (window.event && window.event.srcElement) || e.target || e.srcElement,
            idx = this._links.length;
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


window.MapBBCodeConfig.include({strings: {
    view: 'View',
    editor: 'Editor',
    editInWindow: 'Window',
    editInPanel: 'Panel',
    viewNormal: 'Normal',
    viewFull: 'Full width only',
    viewTitle: 'Adjusting browsing panel',
    editorTitle: 'Adjusting editor panel or window',
    editInWindowTitle: 'Editor will be opened in a popup window',
    editInPanelTitle: 'Editor will appear inside a page',
    viewNormalTitle: 'Map panel will have "fullscreen" button',
    viewFullTitle: 'Map panel will always have maximum size',
    growTitle: 'Click to grow the panel',
    shrinkTitle: 'Click to shrink the panel',
    zoomInTitle: 'Zoom in',
    zoomOutTitle: 'Zoom out',
    selectLayer: 'Select layer',
    addLayer: 'Add layer',
    keyNeeded: 'This layer needs a developer key (<a href="%s" target="devkey">how to get it</a>)',
    keyNeededAlert: 'This layer needs a developer key'
}});


}(window, document));