/*
 * Map panel that displays BBCode. See show() method and options.
 * Localization is in 'strings/*.js' files.
 */
window.MapBBCode = L.Class.extend({
	options: {
		createLayers: null, // function(L) { return [L.tileLayer(...), ...]; },
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
		windowPath: 'lib/mapbbcode-window.html',
		editorCloseButtons: true,
		confirmFormSubmit: true,
		outerLinkTemplate: false, // 'http://openstreetmap.org/#map={zoom}/{lat}/{lon}',
		helpButton: true,
		allowedHTML: '[auib]|span|br|em|strong|tt',
		letterIconLength: 2,
		popupIconLength: 30,
		enablePolygons: true,
		preferStandardLayerSwitcher: true,
		hideInsideClasses: [],
		watchResize: false,
		panelHook: null, // function({map, getBBCode(), ...})

		externalEndpoint: 'http://share.mapbbcode.org/',
		exportTypes: 'csv,geojson,gpx,plt,wpt,kml',
		uploadButton: false
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

	_eachHandler: function( callback, context, layer ) {
		var handlers = window.mapBBCodeHandlers;
		if( handlers ) {
			for( var i = 0; i < handlers.length; i++ ) {
				if( !layer || ('applicableTo' in handlers[i] && handlers[i].applicableTo(layer)) ) {
					callback.call(context || this, handlers[i]);
				}
			}
		}
	},

	objectToLayer: function( obj ) {
		var m;
			
		if( obj.coords.length == 1 ) {
			m = L.marker(obj.coords[0]);
		} else if( obj.coords.length > 2 && obj.coords[0].equals(obj.coords[obj.coords.length-1]) ) {
			obj.coords.splice(obj.coords.length - 1, 1);
			m = L.polygon(obj.coords, { weight: 3, opacity: 0.7, fill: true, fillOpacity: this.options.polygonOpacity });
		} else {
			m = L.polyline(obj.coords, { weight: 5, opacity: 0.7 });
		}
		
		this._eachHandler(function(handler) {
			if( 'objectToLayer' in handler ) {
				var p = [];
				if( 'reKeys' in handler )
					for( var j = 0; j < obj.params.length; j++ )
						if( handler.reKeys.test(obj.params[j]) )
							p.push(obj.params[j]);
				handler.objectToLayer(m, handler.text ? obj.text : p, this);
			}
		}, this, m);
			
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
				var maxZoom = Math.max(this.options.maxInitialZoom, initial ? 0 : map.getZoom());
				map.fitBounds(bounds, { animate: false, paddingTopLeft: [30, 30], paddingBottomRight: [30, 5] });
				if( stored && stored.zoom )
					map.setZoom(stored.zoom, { animate: false });
				else if( map.getZoom() > maxZoom )
					map.setZoom(maxZoom, { animate: false });
			}
		};

		var boundsZoom = map.getBoundsZoom(bounds, false);
		if( boundsZoom )
			applyZoom.call(this);
		else
			map.on('load', applyZoom, this);
	},

	createOpenStreetMapLayer: function(L1) {
		var LL = L1 || L;
		return LL.tileLayer('http://tile.openstreetmap.org/{z}/{x}/{y}.png', {
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
			layers = [this.createOpenStreetMapLayer(L)];
		map.addLayer(layers[0]);
		
		if( layers.length > 1 ) {
			var control, i;
			if( !this.options.preferStandardLayerSwitcher && L.StaticLayerSwitcher ) {
				control = L.staticLayerSwitcher(null, { enforceOSM: true });
				for( i = 0; i < layers.length; i++ )
					if( layers[i] && 'options' in layers[i] )
						control.addLayer(layers[i].options.name, layers[i]);
			} else {
				control = L.control.layers();
				for( i = 0; i < layers.length; i++ )
					if( layers[i] && 'options' in layers[i] )
						control.addBaseLayer(layers[i], layers[i].options.name);
			}
			map.addControl(control);
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

	_checkResize: function( map, drawn ) {
		var size = new L.Point(map.getContainer().clientWidth, map.getContainer().clientHeight);
		if( !('_oldSize' in map) )
			map._oldSize = size;
		if( size.x && size.y ) {
			var diff = size.subtract(map._oldSize);
			if( diff.x || diff.y ) {
				map._oldSize = size;
				map._sizeChanged = true; // fix my own leaflet bug, to remove for leaflet 0.7.2
				this._zoomToLayer(map, drawn);
			}
			if( !this.options.watchResize && map._bbSizePinger )
				window.clearInterval(map._bbSizePinger);
		}
	},

	_createControlAndCallHooks: function( mapDiv, map, drawn, extra ) {
		var control = {
			_ui: this,
			map: map,
			close: function() {
				this.map = this._ui = null;
				mapDiv.close();
			},
			eachLayer: function(callback, context) {
				drawn.eachLayer(function(layer) {
					callback.call(context || this, layer);
				}, this);
			},
			zoomToData: function() {
				this._ui._zoomToLayer(map, drawn);
			}
		};

		control = L.extend(control, extra);

		this._eachHandler(function(handler) {
			if( 'panelHook' in handler )
				handler.panelHook(control, this);
		});

		if( this.options.panelHook )
			this.options.panelHook.call(this, control);

		return control;
	},
	
	_px: function( size ) {
		return size ? size + 'px' : '100%';
	},

	_createMapPanel: function( element, iseditor ) {
		var el = typeof element === 'string' ? document.getElementById(element) : element;
		if( !el ) return;
		var bbcode = el.getAttribute('bbcode') || el.getAttribute('value') || el.innerHTML.replace(/^\s+|\s+$/g, '');
		var closeTag = window.MapBBCodeProcessor.getCloseTag();
		if( (bbcode && bbcode.toLowerCase().indexOf(closeTag) < 0) || (!bbcode && el.getAttribute('map')) ) {
			var pos = el.getAttribute('map'),
				openTag = window.MapBBCodeProcessor.getOpenTagWithPart(pos);
			bbcode = openTag + bbcode + closeTag;
		}
		while( el.firstChild )
			el.removeChild(el.firstChild);
		if( !iseditor && this._hideClassPresent(el) )
			return;
		var mapDiv = document.createElement('div');
		mapDiv.style.width = iseditor ? '100%' : this.options.fullFromStart ? '100%' : this._px(this.options.viewWidth);
		mapDiv.style.height = iseditor ? this._px(this.options.editorHeight) : this.options.fullFromStart ? this._px(this.options.fullViewHeight) : this._px(this.options.viewHeight);
		el.appendChild(mapDiv);
		mapDiv.storedBBCode = bbcode;
		mapDiv.close = function() {
			el.removeChild(mapDiv);
		};
		return mapDiv;
	},

	// Create map panel, parse and display bbcode (it can be skipped: so it's an attribute or contents of element)
	show: function( element, bbcode ) {
		var mapDiv = this._createMapPanel(element);
		if( !mapDiv ) return;
		if( !bbcode ) bbcode = mapDiv.storedBBCode;
		if( !bbcode || typeof bbcode !== 'string' )
			bbcode = '';

		var map = L.map(mapDiv, L.extend({}, { scrollWheelZoom: false, zoomControl: false, attributionEditLink: true }, this.options.leafletOptions));
		map.once('focus', function() { map.scrollWheelZoom.enable(); });
		map.addControl(new L.Control.Zoom({ zoomInTitle: this.strings.zoomInTitle, zoomOutTitle: this.strings.zoomOutTitle }));
		if( map.attributionControl )
			map.attributionControl.setPrefix('<a href="http://mapbbcode.org" title="' + this.strings.mapbbcodeTitle + '">MapBBCode</a>');
		this._addLayers(map);

		var drawn = new L.FeatureGroup();
		drawn.addTo(map);
		var data = window.MapBBCodeProcessor.stringToObjects(bbcode), objs = data.objs;
		for( var i = 0; i < objs.length; i++ )
			this.objectToLayer(objs[i]).addTo(drawn);
		this._zoomToLayer(map, drawn, { zoom: data.zoom, pos: data.pos }, true);

		if( !mapDiv.offsetHeight || this.options.watchResize )
			map._bbSizePinger = window.setInterval(L.bind(this._checkResize, this, map, drawn), 500);

		if( this.options.fullScreenButton && !this.options.fullFromStart ) {
			var fs = L.functionButtons([{ content: window.MapBBCode.buttonsImage, bgPos: [0, 0], alt: '&#x2198;', title: this.strings.fullScreenTitle }], { position: 'topright' }),
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
				var dZoom = isFull ? 1 : -1;
				map.setZoom(map.getZoom() + dZoom, { animate: false });
			}, this);
		}

		if( this.options.outerLinkTemplate && this.options.outerLinkTemplate.substring(0, 4) == 'http' ) {
			var outer = L.functionButtons([{ content: window.MapBBCode.buttonsImage, bgPos: [52, 0], alt: '&#x21B7;', title: this.strings.outerTitle, href: 'about:blank' }], { position: 'topright' });
			var template = this.options.outerLinkTemplate;
			var updateOuterLink = function() {
				outer.setHref(template
					.replace('{zoom}', map.getZoom())
					.replace('{lat}', L.Util.formatNum(map.getCenter().lat, 4))
					.replace('{lon}', L.Util.formatNum(map.getCenter().lng, 4))
				);
			};
			updateOuterLink();
			map.on('move', updateOuterLink);
			map.addControl(outer);
		}

		return this._createControlAndCallHooks(mapDiv, map, drawn, {
			editor: false,
			getBBCode: function() {
				return bbcode;
			},
			updateBBCode: function( bbcode1, noZoom ) {
				bbcode = bbcode1;
				var data = window.MapBBCodeProcessor.stringToObjects(bbcode), objs = data.objs;
				drawn.clearLayers();
				for( var i = 0; i < objs.length; i++ )
					this._ui.objectToLayer(objs[i]).addTo(drawn);
				if( !noZoom )
					this._ui._zoomToLayer(map, drawn, { zoom: data.zoom, pos: data.pos }, true);
			},
			toggleObjects: function( newState ) {
				if( newState === undefined )
					newState = !map.hasLayer(drawn);
				if( newState )
					map.addLayer(drawn);
				else
					map.removeLayer(drawn);
				return newState;
			}
		});
	}
});
