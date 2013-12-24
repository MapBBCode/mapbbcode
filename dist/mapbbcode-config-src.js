/*
 MapBBCode, a JavaScript library for parsing, displaying and editing [map] code.
 Version 1.2.0 built on 25.12.2013
 http://mapbbcode.org
 (c) 2013, Ilya Zverev
*/
(function (window, document, undefined) {
var L = window.L;
/*
 * List of public-use layers.
 */
window._tempLL = window.layerList;

window.layerList = {
	// some entries in this list were adapted from the https://github.com/leaflet-extras/leaflet-providers list (it has BSD 2-clause license)
	list: {
		"OpenStreetMap": "L.tileLayer('http://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: 'Map &copy; <a href=\"http://openstreetmap.org\">OpenStreetMap</a>', minZoom: 0, maxZoom: 19 })",
		"OpenStreetMap DE": "L.tileLayer('http://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png', { attribution: 'Map &copy; <a href=\"http://openstreetmap.org\">OpenStreetMap</a>', minZoom: 0, maxZoom: 18 })",
		"OpenStreetMap FR": "L.tileLayer('http://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', { subdomains: 'abc', attribution: 'Map &copy; <a href=\"http://openstreetmap.org\">OpenStreetMap</a> | Tiles &copy <a href=\"http://tile.openstreetmap.fr/\">OSM France</a>', minZoom: 0, maxZoom: 20 })",
		"Hike & Bike": "L.layerGroup([ L.tileLayer('http://toolserver.org/tiles/hikebike/{z}/{x}/{y}.png', { attribution: 'Map &copy; <a href=\"http://openstreetmap.org\">OSM</a> | Tiles &copy; <a href=\"http://hikebikemap.de/\">Colin Marquardt</a>' } ), L.tileLayer('http://toolserver.org/~cmarqu/hill/{z}/{x}/{y}.png', { minZoom: 0, maxZoom: 17 }) ])",
		"CycleMap": "L.tileLayer('http://{s}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png', { attribution: 'Map &copy; <a href=\"http://openstreetmap.org\">OSM</a> | Tiles &copy; <a href=\"http://www.opencyclemap.org\">Andy Allan</a>', minZoom: 0, maxZoom: 18 })",
		"OpenMapSurfer": "L.tileLayer('http://openmapsurfer.uni-hd.de/tiles/roads/x={x}&y={y}&z={z}', { attribution: 'Map &copy; <a href=\"http://openstreetmap.org\">OSM</a> | Tiles &copy; <a href=\"http://giscience.uni-hd.de/\">GIScience Heidelberg</a>', minZoom: 0, maxZoom: 19 })",
		"OpenMapSurfer Contour": "L.layerGroup([ L.tileLayer('http://openmapsurfer.uni-hd.de/tiles/roads/x={x}&y={y}&z={z}', { attribution: 'Map &copy; <a href=\"http://openstreetmap.org\">OSM</a> | Tiles &copy; <a href=\"http://giscience.uni-hd.de/\">GIScience Heidelberg</a>', minZoom: 0, maxZoom: 19 }), L.tileLayer('http://openmapsurfer.uni-hd.de/tiles/asterc/x={x}&y={y}&z={z}') ])",
		"OpenMapSurfer Grayscale": "L.tileLayer('http://openmapsurfer.uni-hd.de/tiles/roadsg/x={x}&y={y}&z={z}', { attribution: 'Map &copy; <a href=\"http://openstreetmap.org\">OSM</a> | Tiles &copy; <a href=\"http://giscience.uni-hd.de/\">GIScience Heidelberg</a>', minZoom: 0, maxZoom: 19 })",
		"Humanitarian": "L.tileLayer('http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', { attribution: 'Map &copy; <a href=\"http://openstreetmap.org\">OpenStreetMap</a> | Tiles &copy; <a href=\"http://hot.openstreetmap.org\">Humanitarian OSM Team</a>', minZoom: 0, maxZoom: 19 })",
		"Transport": "L.tileLayer('http://{s}.tile2.opencyclemap.org/transport/{z}/{x}/{y}.png', { attribution: 'Map &copy; <a href=\"http://openstreetmap.org\">OSM</a> | Tiles &copy; <a href=\"http://www.opencyclemap.org\">Andy Allan</a>', minZoom: 0, maxZoom: 18 })",
		"Landscape": "L.tileLayer('http://{s}.tile3.opencyclemap.org/landscape/{z}/{x}/{y}.png', { attribution: 'Map &copy; <a href=\"http://openstreetmap.org\">OSM</a> | Tiles &copy; <a href=\"http://www.opencyclemap.org\">Andy Allan</a>', minZoom: 0, maxZoom: 18 })",
		"Outdoors": "L.tileLayer('http://{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png', { attribution: 'Map &copy; <a href=\"http://openstreetmap.org\">OSM</a> | Tiles &copy; <a href=\"http://www.opencyclemap.org\">Andy Allan</a>', minZoom: 0, maxZoom: 18 })",
		"MapQuest Open": "L.tileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpeg', { attribution: 'Map &copy; <a href=\"http://openstreetmap.org\">OSM</a> | Tiles &copy; <a href=\"http://www.mapquest.com/\">MapQuest</a>', subdomains: '1234', minZoom: 0, maxZoom: 18 })",
		"Stamen Toner": "L.tileLayer('http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png', { attribution: 'Map &copy; <a href=\"http://openstreetmap.org\">OSM</a> | Tiles &copy; <a href=\"http://stamen.com\">Stamen Design</a>', minZoom: 0, maxZoom: 20 })",
		"Stamen Toner Lite": "L.tileLayer('http://{s}.tile.stamen.com/toner-lite/{z}/{x}/{y}.png', { attribution: 'Map &copy; <a href=\"http://openstreetmap.org\">OSM</a> | Tiles &copy; <a href=\"http://stamen.com\">Stamen Design</a>', minZoom: 0, maxZoom: 20 })",
		"Stamen Watercolor": "L.tileLayer('http://{s}.tile.stamen.com/watercolor/{z}/{x}/{y}.png', { attribution: 'Map &copy; <a href=\"http://openstreetmap.org\">OSM</a> | Tiles &copy; <a href=\"http://stamen.com\">Stamen Design</a>', minZoom: 3, maxZoom: 16 })",
		"Cloudmade": "L.tileLayer('http://{s}.tile.cloudmade.com/{apiKey}/{styleID}/256/{z}/{x}/{y}.png', { attribution: 'Map &copy; <a href=\"http://openstreetmap.org\">OSM</a> | Tiles &copy; <a href=\"http://cloudmade.com\">CloudMade</a>', apiKey: '{key:http://account.cloudmade.com/register}', styleID: '1', minZoom: 0, maxZoom: 18 })",
		"MapBox": "L.tileLayer('http://{s}.tiles.mapbox.com/v3/{key:https://www.mapbox.com/#signup}/{z}/{x}/{y}.png', { subdomains: 'abcd', attribution: 'Map &copy; <a href=\"http://openstreetmap.org\">OpenStreetMap</a>' })"
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
		var reKeyC = /{key:([^}]+)}/,
			l = this.list[layer],
			m = l && l.match(reKeyC);
		return m && m.length > 1 && m[1] ? m[1] : '';
	},

	getLayerName: function( layer ) {
		if( typeof layer !== 'string' )
			return '';
		var p1 = layer.indexOf(':'),
			p2 = layer.indexOf('|'),
			p = p1 > p2 && p2 > 0 ? p2 : p1;
		return p > 0 ? layer.substring(0, p) : layer;
	},

	getLeafletLayer: function( layerId, LL ) {
		/* jshint unused: false */
		var L = LL || window.L,
			reKeyC = /{key(?::[^}]+)?}/,
			m = layerId.match(/^(.+?\|)?(.+?)(?::([^'"]+))?$/);
		var idx = m && m.length > 2 && m[2] ? m[2] : '',
			title = m && m.length > 1 && m[1] && m[1].length > 0 ? m[1] : idx,
			keys = m && m.length > 3 && m[3] ? m[3].split(':') : [];
		if( this.list[idx] ) {
			var layer = this.list[idx], keyPos = 0;
			while( reKeyC.test(layer) && keyPos < keys.length ) {
				layer = layer.replace(reKeyC, keys[keyPos++]);
			}
			if( !reKeyC.test(layer) ) {
				try {
					var done = eval(layer);
					if( done ) {
						if( !done.options )
							done.options = {};
						done.options.name = title;
						return done;
					}
				} catch(e) {}
			}
		}
		return null;
	},

	getLeafletLayers: function( layers, LL ) {
		var l = typeof layers === 'string' ? layers.split(',') : layers,
			result = [], i, osmidx = -1;

		for( i = 0; i < l.length; i++ ) {
			var layer = this.getLeafletLayer(l[i], LL);
			if( layer ) {
				result.push(layer);
				if( osmidx < 0 && this.isOpenStreetMapLayer(layer) )
					osmidx = result.length - 1;
			}
		}

		if( osmidx > 0 ) {
			var tmp = result[osmidx];
			result[osmidx] = result[0];
			result[0] = tmp;
		} else if( osmidx < 0 && result.length > 0 ) {
			result.unshift(this.getLeafletLayer('OpenStreetMap', LL));
		}

		return result;
	},

	isOpenStreetMapLayer: function( layer ) {
		if( typeof layer === 'string' || layer.substring )
			return layer.indexOf('openstreetmap.org') > 0;
		var l = layer.options && layer._url ? layer : (layer.getLayers ? layer.getLayers()[0] : {});
		if( l.options && l._url )
			return (l.options.attribution && l.options.attribution.indexOf('openstreetmap.org') > 0) || l._url.indexOf('tile.openstreetmap.') > 0 || l._url.indexOf('opencyclemap.org') > 0 || l._url.indexOf('stamen.com') > 0 || l._url.indexOf('server.arcgisonline.com') > 0;
		return false;
	}
};

// merge layerList entries that were added before this script was loaded
if( window._tempLL ) {
	if( window._tempLL.list ) {
		var i;
		for( i in window._tempLL.list ) {
			if( window._tempLL.list.hasOwnProperty(i) )
				window.layerList.list[i] = window._tempLL.list[i];
		}
	}
	delete window._tempLL;
}


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
			if( width ) width += 'px';
			if( height) height += 'px';
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
			var target = (window.event && window.event.srcElement) || e.target || e.srcElement,
				layer = target.value;
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
				var j, found = false;
				for( j = 0; j < layers0.length; j++ )
					if( layers0[j] == layerKeys[i] )
						found = true;
				if( found )
					continue;
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
				key = keyValue.value.replace(/^\s+|\s+$/g, '');
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
		if( map.attributionControl )
			map.attributionControl.setPrefix('<a href="http://mapbbcode.org">MapBBCode</a>');
		var layerSwitcher = L.staticLayerSwitcher(this.options.layers, { editable: true, maxLayers: this.options.maxLayers, enforceOSM: true });
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

		var fs = L.functionButtons([{ content: 'full' }], { position: 'topright' });
		var modeButton = L.functionButtons([{ content: 'mode' }], { position: 'topright' });
		var widthButton = L.functionButtons([{ content: '<span style="font-size: 14pt;">&#x25C2;</span>', title: this.strings.shrinkTitle }, { content: '<span style="font-size: 14pt;">&#x25B8;</span>', title: this.strings.growTitle }], { position: 'bottomright' });
		var heightButton = L.functionButtons([{ content: '<span style="font-size: 14pt;">&#x25B4;</span>', title: this.strings.shrinkTitle }, { content: '<span style="font-size: 14pt;">&#x25BE;</span>', title: this.strings.growTitle }], { position: 'bottomleft' });

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
		enforceOSM: false,
		maxLayers: 7
	},

	initialize: function( layers, options ) {
		L.setOptions(this, options);
		this._layers = [];
		this._selected = 0;
		this._layerList = window.layerList && 'isOpenStreetMapLayer' in window.layerList;
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
					newLayer = this._layerList ? window.layerList.getLeafletLayer(id) : null;
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
		var l = layer || (this._layerList && window.layerList.getLeafletLayer(id));
		if( l ) {
			this._layers.push({ id: id, layer: l, fromList: !layer });
			var osmidx = this._findFirstOSMLayer();
			if( osmidx > 0 ) {
				var tmp = this._layers[osmidx];
				this._layers[osmidx] = this._layers[0];
				this._layers[0] = tmp;
			}
			if( this._map )
				this._addMandatoryOSMLayer();
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
			if( i === 0 ) {
				// if first layer is not OSM layer, swap it with first OSM layer
				var osmidx = this._findFirstOSMLayer();
				if( osmidx > 0 ) {
					var tmp = this._layers[osmidx];
					this._layers[osmidx] = this._layers[0];
					this._layers[0] = tmp;
				}
			}
			if( this._selected >= this._layers.length && this._selected > 0 )
				this._selected = this._layers.length - 1;
			this._addMandatoryOSMLayer();
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
			if( this.options.enforceOSM && pos + newPos == 1 && this._layerList &&
					!window.layerList.isOpenStreetMapLayer(this._layers[1].layer) ) {
				var nextOSM = this._findFirstOSMLayer(1);
				if( pos === 0 && nextOSM > 1 )
					newPos = nextOSM;
				else
					return;
			}
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

	_findFirstOSMLayer: function( start ) {
		if( !this._layerList || !this.options.enforceOSM )
			return start || 0;
		var i = start || 0;
		while( i < this._layers.length && !window.layerList.isOpenStreetMapLayer(this._layers[i].layer) )
			i++;
		if( i >= this._layers.length )
			i = -1;
		return i;
	},

	_addMandatoryOSMLayer: function() {
		if( this.options.enforceOSM && this._layers.length > 0 && this._findFirstOSMLayer() < 0 ) {
			var layer = L.tileLayer('http://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: 'Map &copy; <a href=\"http://openstreetmap.org\">OpenStreetMap</a>', minZoom: 0, maxZoom: 19 });
			if( this._selected < this._layers.length )
				this._selected++;
			this._layers.unshift({ id: 'OpenStreetMap', layer: layer, fromList: false });
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
		this._addMandatoryOSMLayer();
		this._update();
		return container;
	},

	// accepts value at index in this._layers array
	_createItem: function( layerMeta ) {
		var div = document.createElement('div');
		div.style.backgroundColor = this.options.bgColor;
		this._addHoverStyle(div, 'backgroundColor', this.options.selectedColor);
		div.style.padding = '4px 10px';
		div.style.margin = '0';
		div.style.color = 'black';
		div.style.cursor = 'default';
		var label = !layerMeta.fromList ? layerMeta.id : (this._layerList ? window.layerList.getLayerName(layerMeta.id) : 'Layer');
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
		upClick.innerHTML ='&#x25B4;'; // &utrif;
		upClick.style.cursor = 'pointer';
		this._addHoverStyle(upClick, 'color', '#aaa');
		L.DomEvent.on(upClick, 'click', function() {
			this.moveLayer(layer, false);
		}, this);

		var downClick = document.createElement('span');
		downClick.innerHTML ='&#x25BE;'; // &dtrif;
		downClick.style.cursor = 'pointer';
		downClick.style.marginLeft = '6px';
		this._addHoverStyle(downClick, 'color', '#aaa');
		L.DomEvent.on(downClick, 'click', function() {
			this.moveLayer(layer, true);
		}, this);

		var xClick = document.createElement('span');
		xClick.innerHTML ='&#x2A2F;'; // &Cross;
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
 * A leaflet button with icon or text and click listener.
 */
L.FunctionButtons = L.Control.extend({
	includes: L.Mixin.Events,

	initialize: function( buttons, options ) {
		if( !('push' in buttons && 'splice' in buttons) )
			buttons = [buttons];
		this._buttons = buttons;
		if( !options && buttons.length > 0 && 'position' in buttons[0] )
			options = { position: buttons[0].position };
		L.Control.prototype.initialize.call(this, options);
	},

	onAdd: function( map ) {
		this._map = map;
		this._links = [];

		var container = L.DomUtil.create('div', 'leaflet-bar');
		for( var i = 0; i < this._buttons.length; i++ ) {
			var button = this._buttons[i],
				link = L.DomUtil.create('a', '', container);
			link._buttonIndex = i; // todo: remove?
			link.href = button.href || '#';
			if( button.href )
				link.target = 'funcbtn';
			link.style.padding = '0 4px';
			link.style.width = 'auto';
			link.style.minWidth = '20px';
			if( button.bgColor )
				link.style.backgroundColor = button.bgColor;
			if( button.title )
				link.title = button.title;
			button.link = link;
			this._updateContent(i);

			var stop = L.DomEvent.stopPropagation;
			L.DomEvent
				.on(link, 'click', stop)
				.on(link, 'mousedown', stop)
				.on(link, 'dblclick', stop);
			if( !button.href )
				L.DomEvent
					.on(link, 'click', L.DomEvent.preventDefault)
					.on(link, 'click', this.clicked, this);
		}

		return container;
	},

	_updateContent: function( n ) {
		if( n >= this._buttons.length )
			return;
		var button = this._buttons[n],
			link = button.link,
			content = button.content;
		if( !link )
			return;
		if( content === undefined || content === false || content === null || content === '' )
			link.innerHTML = button.alt || '&nbsp;';
		else if( typeof content === 'string' ) {
			var ext = content.length < 4 ? '' : content.substring(content.length - 4),
				isData = content.substring(0, 11) === 'data:image/';
			if( ext === '.png' || ext === '.gif' || ext === '.jpg' || isData ) {
				link.style.width = '' + (button.imageSize || 26) + 'px';
				link.style.height = '' + (button.imageSize || 26) + 'px';
				link.style.padding = '0';
				link.style.backgroundImage = 'url(' + content + ')';
				link.style.backgroundRepeat = 'no-repeat';
				link.style.backgroundPosition = button.bgPos ? (-button.bgPos[0]) + 'px ' + (-button.bgPos[1]) + 'px' : '0px 0px';
			} else
				link.innerHTML = content;
		} else {
			while( link.firstChild )
				link.removeChild(link.firstChild);
			link.appendChild(content);
		}
	},

	setContent: function( n, content ) {
		if( content === undefined ) {
			content = n;
			n = 0;
		}
		if( n < this._buttons.length ) {
			this._buttons[n].content = content;
			this._updateContent(n);
		}
	},

	setTitle: function( n, title ) {
		if( title === undefined ) {
			title = n;
			n = 0;
		}
		if( n < this._buttons.length ) {
			var button = this._buttons[n];
			button.title = title;
			if( button.link )
				button.link.title = title;
		}
	},

	setBgPos: function( n, bgPos ) {
		if( bgPos === undefined ) {
			bgPos = n;
			n = 0;
		}
		if( n < this._buttons.length ) {
			var button = this._buttons[n];
			button.bgPos = bgPos;
			if( button.link )
				button.link.style.backgroundPosition = bgPos ? (-bgPos[0]) + 'px ' + (-bgPos[1]) + 'px' : '0px 0px';
		}
	},

	setHref: function( n, href ) {
		if( href === undefined ) {
			href = n;
			n = 0;
		}
		if( n < this._buttons.length ) {
			var button = this._buttons[n];
			button.href = href;
			if( button.link )
				button.link.href = href;
		}
	},

	clicked: function(e) {
		var link = (window.event && window.event.srcElement) || e.target || e.srcElement;
		while( link && 'tagName' in link && link.tagName !== 'A' && !('_buttonIndex' in link ) )
			link = link.parentNode;
		if( '_buttonIndex' in link ) {
			var button = this._buttons[link._buttonIndex];
			if( button ) {
				if( 'callback' in button )
					button.callback.call(button.context);
				this.fire('clicked', { idx: link._buttonIndex });
			}
		}
	}
});

L.functionButtons = function( buttons, options ) {
	return new L.FunctionButtons(buttons, options);
};

/*
 * Helper method from the old class. It is not recommended to use it, please use L.functionButtons().
 */
L.functionButton = function( content, button, options ) {
	if( button )
		button.content = content;
	else
		button = { content: content };
	return L.functionButtons([button], options);
};


window.MapBBCodeConfig.include({ strings: {
    "view": "View",
    "editor": "Editor",
    "editInWindow": "Window",
    "editInPanel": "Panel",
    "viewNormal": "Normal",
    "viewFull": "Full width only",
    "viewTitle": "Adjusting browsing panel",
    "editorTitle": "Adjusting editor panel or window",
    "editInWindowTitle": "Editor will be opened in a popup window",
    "editInPanelTitle": "Editor will appear inside a page",
    "viewNormalTitle": "Map panel will have \"fullscreen\" button",
    "viewFullTitle": "Map panel will always have maximum size",
    "growTitle": "Click to grow the panel",
    "shrinkTitle": "Click to shrink the panel",
    "zoomInTitle": "Zoom in",
    "zoomOutTitle": "Zoom out",
    "selectLayer": "Select layer",
    "addLayer": "Add layer",
    "keyNeeded": "This layer needs a developer key (<a href=\"%s\" target=\"devkey\">how to get it</a>)",
    "keyNeededAlert": "This layer needs a developer key"
}});

}(window, document));