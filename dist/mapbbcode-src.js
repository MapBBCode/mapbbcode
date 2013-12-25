/*
 MapBBCode, a JavaScript library for parsing, displaying and editing [map] code.
 Version 1.2.0 built on 25.12.2013
 http://mapbbcode.org
 (c) 2013, Ilya Zverev
*/
(function (window, document, undefined) {
var L = window.L;
/*
 * Map BBCode parser and producer. See BBCODE.md for description.
 */
window.MapBBCodeProcessor = {
	options: {
		decimalDigits: 5,
		brackets: '[]',
		tagParams: false,
		shareTag: 'mapid'
	},

	setOptions: function( options ) {
		for( var i in options ) {
			if( options.hasOwnProperty(i) )
				this.options[i] = options[i];
		}
	},

	_getRegExp: function() {
		var openBr = this.options.brackets.substring(0, 1).replace(/([\[\({])/, '\\$1'),
			closBr = this.options.brackets.substring(1, 2).replace(/([\]\)}])/, '\\$1');
		var reCoord = '\\s*(-?\\d+(?:\\.\\d+)?)\\s*,\\s*(-?\\d+(?:\\.\\d+)?)',
			reParams = '\\((?:([a-zA-Z0-9,]*)\\|)?(|[\\s\\S]*?[^\\\\])\\)',
			reMapElement = reCoord + '(?:' + reCoord + ')*(?:\\s*' + reParams + ')?',
			reMapOpeningTag = openBr + 'map(?:' + (this.options.tagParams ? '\\s+z=[\'"]([12]?\\d)[\'"](?:\\s+ll=[\'"]' + reCoord + '[\'"])?' : '=[\'"]?([12]?\\d)(?:,' + reCoord + ')?') + ')?[\'"]?' + closBr,
			reMapEmpty = openBr + 'map' + closBr + '\\s*' + openBr + '/map' + closBr,
			reMap = reMapOpeningTag + '(' + reMapElement + '(?:\\s*;' + reMapElement + ')*)?\\s*' + openBr + '/map' + closBr;
		return {
			coord: reCoord,
			params: reParams,
			mapElement: reMapElement,
			map: reMap,
			mapEmptyCompiled: new RegExp(reMapEmpty, 'i'),
			mapCompiled: new RegExp(reMap, 'i')
		};
	},

	// returns longest substring for determining a start of map bbcode, "[map" by default
	getOpenTagSubstring: function() {
		return this.options.brackets.substring(0, 1) + 'map';
	},

	// constructs opening tag, appending extra (either '=z,lat,lon' or 'z="" ll=""')
	getOpenTagWithPart: function( extra ) {
		return this.options.brackets.substring(0, 1) + 'map' + (extra && extra.length > 0 ? (this.options.tagParams ? (extra.substring(0, 1) == ' ' ? '' : ' ') : (extra.substring(0, 1) == '=' ? '' : '=')) + extra : '') + this.options.brackets.substring(1, 2);
	},

	// constructs opening tag for given zoom and coords (optional)
	getOpenTag: function( zoom, coords ) {
		return this.options.brackets.substring(0, 1) + 'map' + (zoom || zoom === '0' ? (this.options.tagParams ? ' z="' + zoom + '"' + (coords ? ' ll="' + coords + '"' : '') : '=' + zoom + (coords ? ',' + coords : '')) : '') + this.options.brackets.substring(1, 2);
	},

	// returns longest substring for determining an end of map bbcode, "[/map]" by default
	getCloseTag: function() {
		return this.options.brackets.substring(0, 1) + '/map' + this.options.brackets.substring(1, 2);
	},

	// construct mapid sequence, or get '[mapid]' substring for searching
	getShareTag: function( id ) {
		var openBr = this.options.brackets.substring(0, 1),
			closBr = this.options.brackets.substring(1, 2),
			mapid = this.options.shareTag || 'mapid';
		return id ? openBr + mapid + closBr + id + openBr + '/' + mapid + closBr : openBr + mapid + closBr;
	},

	// returns compiled regular expression for correct map code (used in isValid())
	getBBCodeRegExp: function() {
		return this._getRegExp().mapCompiled;
	},

	// Checks that bbcode string is a valid map bbcode
	isValid: function( bbcode ) {
		return this._getRegExp().mapCompiled.test(bbcode);
	},

	// Check that bbcode is either valid and empty (use isValid() for validation)
	isEmpty: function( bbcode ) {
		return this._getRegExp().mapEmptyCompiled.test(bbcode);
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
					result.pos = L && L.LatLng ? new L.LatLng(matches[2], matches[3]) : [+matches[2], +matches[3]];
				} catch(e) {}
			}
		}

		if( matches && matches[4] ) {
			var items = matches[4], itm,
				reElementC = new RegExp('^\\s*(?:;\\s*)?(' + regExp.mapElement + ')'),
				reCoordC = new RegExp('^' + regExp.coord);

			itm = items.match(reElementC);
			while( itm ) {
				var s = itm[1],
					coords = [], m, text = '', params = [];
				m = s.match(reCoordC);
				while( m ) {
					coords.push(L && L.LatLng ? new L.LatLng(m[1], m[2]) : [+m[1], +m[2]]);
					s = s.substring(m[0].length);
					m = s.match(reCoordC);
				}
				if( itm[6] )
					params = itm[6].split(',');
				if( typeof itm[7] === 'string' && itm[7].length > 0 )
					text = itm[7].replace(/\\\)/g, ')').replace(/^\s+|\s+$/g, '');
				result.objs.push({ coords: coords, text: text, params: params });

				items = items.substring(itm[0].length);
				itm = items.match(reElementC);
			}
		}

		return result;
	},

	// Takes an object like stringToObjects() produces and returns map bbcode
	objectsToString: function( data ) {
		var zoom, pos;
		if( data.zoom > 0 ) {
			zoom = data.zoom;
			if( data.pos )
				pos = this._latLngToString(data.pos);
		}

		var markers = [], paths = [], objs = data.objs || [];
		for( var i = 0; i < objs.length; i++ ) {
			if( !objs[i] || !('coords' in objs[i]) )
				continue;
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
				str = str + '(' + (params.length > 0 ? params.join(',') + '|' : '') + text.replace(/\)/g, '\\)') + ')';
			if( coords.length ) {
				if( coords.length == 1 )
					markers.push(str);
				else
					paths.push(str);
			}
		}

		return markers.length || paths.length || zoom ? this.getOpenTag(zoom, pos) + markers.concat(paths).join('; ') + this.getCloseTag() : '';
	},

	_latLngToString: function( latlng ) {
		var mult = Math.pow(10, this.options.decimalDigits);
		return '' + (Math.round((latlng.lat || latlng[0]) * mult) / mult) + ',' + (Math.round((latlng.lng || latlng[1]) * mult) / mult);
	}
};


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


/* jshint laxbreak: true */
window.MapBBCode.buttonsImage = 'data:image/png;base64,'
+'iVBORw0KGgoAAAANSUhEUgAAAE4AAAAaCAYAAAAZtWr8AAAABmJLR0QA/wD/AP+gvaeTAAAF/klE'
+'QVRYhe2ZX2xcRxWHvzPXf7Zu1o6zDiFxhasWCSIaSljxsE6BqNm9d41x1aitkFopRFRFPCBUOYKm'
+'CVYnNIB4gj4EkVQQFFALSqhqmzS71060qoRTEcVQUoGQShU1ChJkZTW1Cd6Ndw4PNrDe2LteOyFI'
+'ySfdh7nzm3Pmnjs6d85cuM1t/pdIeSOZTPZ6nrehUCi8nMvlppZrtLe3975isbjz6tWr+3O53Hsr'
+'n+b/H/MC5/v+RWADMAOMASPOucHR0dFz1YwkEok7WltbtwMpVU0BnXNd28MwfPUGzPumY8obqpoF'
+'3gfyqvou8KSIPFrLSDQaNar6Q1W9S1XfAkpzXWOLjYnH441BEOyKx+ON9U46CIL1vu9/01praqtv'
+'DA3lDWPMuKqmgcvAR4D7JiYmirWMhGH4j3g8vnbNmjVPiMiPReSIqvaEYfj3xcZ0dHR0qereWCz2'
+'CWBHT09PtFQqbWlrawuPHj1aKtf6vv8BEflUPp8POzs7I9PT078GGsfHx18AJpfz4CuloaL9JrBe'
+'RHqAYVX9ZTQafXgphtrb2x8UkUPAc6r6IRH5fTV9Npt9O51OB865U77vH1DVF4DXpqamPgb8sUL+'
+'oKoejsViHdPT08NA1PO8LUNDQ3UHzVobAfYD0SqyZ6y1VXPzvKXe0NDwFnBhrvk5EdnS1NR0mIpc'
+'WEkymdxsjDmqqgfDMNwPOOC3tR4ik8mcUdUvAE+p6iPAlZmZmfsrdSKyyRjzJ1X9CbDR87yeEydO'
+'XKplfyGstdPGmGFgB/DlRa6WWnaqBiQIgrSq/soYk8hkMn9YTOf7/jERWZXP5/vOnj17dakPkUwm'
+'NwEbjDGdwIsi8i7wUjab3Vsxj0Hn3IdFpMsY87hzbq0x5mQmkzm/VF+VWGsfAl4BvAW6O621f602'
+'vmpyzWazmVKpdE+1oAE0NzfvKBQKj9YTNAARedgYcwI4AJxX1S5VTVbqVPUBEdkIvOecGwR+UCqV'
+'NtfjawFeB84vd3BljruGkydP/q2WZnh4+MpynI+MjDzv+/5BVd0GpERknap2LCBtmluNR4CRfD7/'
+'Rr0vqZy5PPcacO9ybdQM3I1m7sv78tz1pUU01RL5cngWSKzEwE3bB90srLUtwNcqbl8AvgvoUu3c'
+'coETkQSwuuxW3vO8lLV2D/AVZncENbnlAgfcVd4QETswMPBnAGvtIeAJZkvOqtz0HNfX19dSLBY/'
+'w2yduxO4FIbhR8s1vu9PiUie6/BxUNXLZc2Cqr5Y3m+t/cVS7NRccdu2bVtXS9PX19eydevWVUtx'
+'WI7v+18vFAoTqnpcVR8H2oGJBaRXnHNdqvqUqr4ei8UmUqnU9nr9ATQ1Nf2G/66oC9bamiXlQlQN'
+'XCqV8j3PeyedTn+8mq5QKBxpbm4+Vm/BbozJATtVdQBYC7wD5Cp1InKa2XIwpqo7gKc9z/tdPb7+'
+'zZ49ey4xu3IBuqy1db9wqAhcb29vu+/7f0kmk5vS6XRCRF4FDtXaAIvIblXdHIvFfmatNb7v/ygI'
+'gm/Vcp7JZM4YY4oi8ryIPM1s/lnI15siIqp6UEQOOOfGV1I1RCKRfuAc0Ag8sxwb8wJXKpXuB+4p'
+'lUotqjoEHO/u7t5Vy0g2m31bRPqAz4+NjX1PZ6m5T0qlUluccz9X1e8bY04BzZ7nXRM459w5YOPq'
+'1au/AYwaY46n0+m7l/iM17B79+7LkUjk08Ax4Nl9+/btokb5Wck8cRAEX3XODYjIFHCxWCz6k5OT'
+'paUk4ng83hiLxdLM1n+DwANhGH5wMX06nb7bOfcGMNbW1vbY1NTUnc65VD6fH6r0t8CxUg5ojEQi'
+'yzohKcda+0ngi8AqYLC1tXWkv7//n7XGzQtcKpU6LCKPqWpeRHLAZ1X1yMjIyHPVjPi+fydwETij'
+'qu8D20VEgHWLncklEok7otHo3snJyW+fPn265kTLCYJgvao+2d3d/R1r7ZL2XdebBY/ORWRGVVd8'
+'dO6ce2R0dPSVGzX5m0nlPq5fRNYWCoWf1vOzZm7FvDR3/ednzczMzKnrONfb3OYW5l/jv4lWsW64'
+'7QAAAABJRU5ErkJggg=='
;


/*
 * Text labels. Editing only for markers.
 */

if( !('mapBBCodeHandlers' in window) )
	window.mapBBCodeHandlers = [];

window.mapBBCodeHandlers.unshift({
	text: true,

	// this regex always fails
	reKeys: new RegExp('a^'),
	
	applicableTo: function() {
		return true;
	},

	// creates marker from text
	objectToLayer: function( layer, text, ui ) {
		if( text ) {
			layer._text = text;
			var icon = this._getIcon(layer, text, ui);
			if( icon ) {
				layer.setIcon(icon);
				layer.options.clickable = false;
				if( L.PopupIcon && icon instanceof L.PopupIcon ) {
					icon.options.selectable = true;
					icon.bindTo(layer);
				}
			} else {
				layer.bindPopup(text.replace(new RegExp('<(?!/?(' + ui.options.allowedHTML + ')[ >])', 'g'), '&lt;'));
			}
		} else
			layer.options.clickable = false;
	},
	
	_getIcon: function( layer, text, ui ) {
		if( layer instanceof L.Marker && text.length > 0 ) {
			if( L.LetterIcon && text.length <= ui.options.letterIconLength )
				return new L.LetterIcon(text);
			if( L.PopupIcon && text.length <= ui.options.popupIconLength && text.indexOf('<') < 0 )
				return new L.PopupIcon(text);
		}
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
			var title = layer.inputField.value,
				icon = this._getIcon(layer, title, ui) || layer.defaultIcon;
			layer.setIcon(icon);
		}, this);
		return commentDiv;
	}
});


/*
 * Map BBCode Editor, extends bbcode display module.
 * See editor() and editorWindow() methods.
 */
window.MapBBCode.include({
	layerToObject: function( layer ) {
		var obj = {};
		if( layer instanceof L.Marker ) {
			obj.coords = [layer.getLatLng()];
		} else if( layer.getLatLngs ) {
			var llngs = layer.getLatLngs(), len=llngs.length, coords = [], i;
			for( i = 0; i < len; i++ )
				coords.push(llngs[i]);
			if( layer instanceof L.Polygon )
				coords.push(coords[0]);
			obj.coords = coords;
		}

		obj.params = layer._objParams || [];
		this._eachHandler(function(handler) {
			if( handler.text && 'layerToObject' in handler ) {
				var text = handler.layerToObject(layer, '', this);
				if( text )
					obj.text = text;
			} else if( 'layerToObject' in handler ) {
				// remove relevant params
				var lastParams = [], j;
				if( 'reKeys' in handler )
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

		this._eachHandler(function(handler) {
			var div = 'createEditorPanel' in handler ? handler.createEditorPanel(layer, this) : null;
			if( div )
				parentDiv.appendChild(div);
		}, this, layer);

		parentDiv.appendChild(buttonDiv);
		layer.bindPopup(parentDiv);
		return layer;
	},

	_findParentForm: function( element ) {
		var node = element;
		while( node && node.tagName != 'FORM' && node.tagName != 'HTML' )
			node = node.parentElement;
		return node && node.tagName == 'FORM' ? node : false;
	},

	_addSubmitHandler: function( map, drawn ) {
		var initialBBCode = this._getBBCode(map, drawn);
		var node = this._findParentForm(map.getContainer());
		if( node ) {
			L.DomEvent.on(node, 'submit', function(e) {
				if( !this._findParentForm(map.getContainer()) )
					return;

				var bbcode = this._getBBCode(map, drawn);
				if( bbcode != initialBBCode && drawn.getLayers().length > 0 ) {
					if( !window.confirm(this.strings.submitWarning) )
						L.DomEvent.preventDefault(e);
				}
			}, this);
		}
	},

	_findMapInTextArea: function( textarea ) {
		var openTag = window.MapBBCodeProcessor.getOpenTagSubstring(),
			closeTag = window.MapBBCodeProcessor.getCloseTag();
		var value = textarea.value,
			pos = 'selectionStart' in textarea ? textarea.selectionStart : value.indexOf(closeTag);
		if( pos >= value.length || value.length < 10 || value.indexOf(closeTag) < 0 )
			return '';
		// check if cursor is inside a map
		var start = value.lastIndexOf(openTag, pos);
		if( start >= 0 ) {
			var end = value.indexOf(closeTag, start);
			if( end + closeTag.length > pos ) {
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
		else if( !('selectionStart' in textarea) || pos >= value.length )
			textarea.value = value + newCode;
		else {
			textarea.value = value.substring(0, pos) + newCode + value.substring(pos);
		}
	},

	_getBBCode: function( map, drawn ) {
		var objs = [];
		drawn.eachLayer(function(layer) {
			objs.push(this.layerToObject(layer));
		}, this);
		var needZoomPos = !objs.length || map.wasPositionSet;
		return window.MapBBCodeProcessor.objectsToString({ objs: objs, zoom: needZoomPos ? map.getZoom() : 0, pos: needZoomPos ? map.getCenter() : 0 });
	},

	// Show editor in element. BBcode can be textarea element. Callback is always called, null parameter means cancel
	editor: function( element, bbcode, callback, context ) {
		var mapDiv = this._createMapPanel(element, true);
		if( !mapDiv ) return;

		var str = this.strings; // a shortcut
		var map = L.map(mapDiv, L.extend({}, { zoomControl: false }, this.options.leafletOptions));
		map.addControl(new L.Control.Zoom({ zoomInTitle: str.zoomInTitle, zoomOutTitle: str.zoomOutTitle }));
		if( map.attributionControl )
			map.attributionControl.setPrefix('<a href="http://mapbbcode.org" title="' + str.mapbbcodeTitle + '">MapBBCode</a>');
		if( L.Control.Search )
			map.addControl(new L.Control.Search({ title: str.searchTitle }));
		this._addLayers(map);

		var textArea;
		if( typeof bbcode !== 'string' ) {
			textArea = bbcode;
			bbcode = this._findMapInTextArea(textArea);
		}

		var drawn = new L.FeatureGroup();
		var data = window.MapBBCodeProcessor.stringToObjects(bbcode), objs = data.objs;
		for( var i = 0; i < objs.length; i++ )
			this._makeEditable(this.objectToLayer(objs[i]).addTo(drawn), drawn);
		drawn.addTo(map);
		this._zoomToLayer(map, drawn, { zoom: data.zoom, pos: data.pos }, true);
		map.wasPositionSet = objs.length > 0 && !(!data.pos);

		// now is the time to update leaflet.draw strings
		var dlt = L.drawLocal.draw.toolbar, dlh = L.drawLocal.draw.handlers;
		dlt.actions.text = str.cancel;
		dlt.actions.title = str.drawCancelTitle;
		dlt.undo.text = str.undoPoint;
		dlt.undo.title = str.undoPointTitle;
		dlt.buttons.polyline = str.polylineTitle;
		dlt.buttons.polygon = str.polygonTitle;
		dlt.buttons.marker = str.markerTitle;
		dlh.marker.tooltip.start = str.markerTooltip;
		dlh.polyline.tooltip.start = str.polylineStartTooltip;
		dlh.polyline.tooltip.cont = str.polylineContinueTooltip;
		dlh.polyline.tooltip.end = str.polylineEndTooltip;
		dlh.polygon.tooltip.start = str.polygonStartTooltip;
		dlh.polygon.tooltip.cont = str.polygonContinueTooltip;
		dlh.polygon.tooltip.end = str.polygonEndTooltip;

		var drawControl = new L.Control.Draw({
			position: 'topleft',
			draw: {
				marker: true,
				polyline: {
					showLength: false,
					guidelineDistance: 10,
					shapeOptions: {
						color: '#0033FF',
						weight: 5,
						opacity: 0.7
					}
				},
				polygon: this.options.enablePolygons ? {
					showArea: false,
					guidelineDistance: 10,
					shapeOptions: {
						color: '#0033FF',
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
		this._eachHandler(function(handler) {
			if( 'initDrawControl' in handler )
				handler.initDrawControl(drawControl);
		});
		map.addControl(drawControl);
		map.on('draw:created', function(e) {
			var layer = e.layer;
			this._eachHandler(function(handler) {
				if( 'initLayer' in handler )
					handler.initLayer(layer);
			}, this, layer);
			this._makeEditable(layer, drawn);
			drawn.addLayer(layer);
			if( e.layerType === 'marker' )
				layer.openPopup();
		}, this);

		if( this.options.editorCloseButtons ) {
			var apply = L.functionButtons([{ content: '<b>'+str.apply+'</b>', title: str.applyTitle }], { position: 'topleft' });
			apply.on('clicked', function() {
				var newCode = this._getBBCode(map, drawn);
				mapDiv.close();
				if( textArea )
					this._updateMapInTextArea(textArea, bbcode, newCode);
				if( callback )
					callback.call(context, newCode);
			}, this);
			map.addControl(apply);

			if( this.options.uploadButton && this._upload ) {
				var upload = L.functionButtons([{ content: str.upload, title: str.uploadTitle }], { position: 'topleft' });
				upload.on('clicked', function() {
					this._upload(mapDiv, drawn.getLayers().length ? this._getBBCode(map, drawn) : false, function(codeid) {
						mapDiv.close();
						var newCode = window.MapBBCodeProcessor.getShareTag(codeid);
						if( textArea )
							this._updateMapInTextArea(textArea, bbcode, newCode);
						if( callback )
							callback.call(context, newCode);
					});
				}, this);
				map.addControl(upload);
			}

			var cancel = L.functionButtons([{ content: str.cancel, title: str.cancelTitle }], { position: 'topright' });
			cancel.on('clicked', function() {
				mapDiv.close();
				if( callback )
					callback.call(context, null);
			}, this);
			map.addControl(cancel);
		}

		if( this.options.helpButton ) {
			var help = L.functionButtons([{ content: '<span style="font-size: 18px; font-weight: bold;">?</span>', title: str.helpTitle }], { position: 'topright' });
			help.on('clicked', function() {
				var res = '',
					help = str.helpContents.split(/\n+/),
					version = '1.2.0',
					features = 'resizable,dialog,scrollbars,height=' + this.options.windowHeight + ',width=' + this.options.windowWidth;
				var win = window.open('', 'mapbbcode_help', features);
				for( var i = 0; i < help.length; i++ ) {
					res += !i ? '<h1>'+help[0]+'</h1>' : help[i].substring(0, 1) === '#' ? '<h2>'+help[i].replace(/^#\s*/, '')+'</h2>' : '<p>'+help[i]+'</p>';
				}
				res = res.replace('{version}', version);
				res += '<div id="close"><input type="button" value="' + str.close + '" onclick="javascript:window.close();"></div>';
				var css = '<style>body { font-family: sans-serif; font-size: 12pt; } p { line-height: 1.5; } h1 { text-align: center; font-size: 18pt; } h2 { font-size: 14pt; } #close { text-align: center; margin-top: 1em; }</style>';
				win.document.open();
				win.document.write(css);
				win.document.write(res);
				win.document.close();
				win.onkeypress = function(e) {
					var keyCode = (window.event) ? (e || window.event).which : e.keyCode;
					if( keyCode == 27 ) {
						win.close();
					}
				};
			}, this);
			map.addControl(help);
		}

		if( this.options.confirmFormSubmit )
			this._addSubmitHandler(map, drawn);
		
		return this._createControlAndCallHooks(mapDiv, map, drawn, {
			editor: true,
			close: function() {
				var finalCode = this.getBBCode();
				this.map = this._ui = null;
				this.getBBCode = function() { return finalCode; };
				mapDiv.close();
			},
			getBBCode: function() {
				return this._ui._getBBCode(map, drawn);
			},
			updateBBCode: function( bbcode, noZoom ) {
				var data = window.MapBBCodeProcessor.stringToObjects(bbcode), objs = data.objs;
				drawn.clearLayers();
				map.removeLayer(drawn); // so options set after object creation could be set
				for( var i = 0; i < objs.length; i++ )
					this._ui._makeEditable(this._ui.objectToLayer(objs[i]).addTo(drawn), drawn);
				map.addLayer(drawn);
				if( !noZoom )
					this._ui._zoomToLayer(map, drawn, { zoom: data.zoom, pos: data.pos }, true);
			}
		});
	},

	// Opens editor window. Requires options.windowPath to be correct
	editorWindow: function( bbcode, callback, context ) {
		window.storedMapBB = {
			bbcode: bbcode,
			callback: callback,
			context: context,
			caller: this
		};

		var features = this.options.windowFeatures,
			featSize = 'height=' + this.options.windowHeight + ',width=' + this.options.windowWidth,
			windowPath = this.options.windowPath,
			url = windowPath.substring(windowPath.length - 1) == '/' ? windowPath + 'mapbbcode-window.html' : windowPath;

		window.open(url, 'mapbbcode_editor', features + ',' + featSize);
	}
});


/*
 * MapBBCode Share functions. Extends MapBBCode display/edit module.
 */
window.MapBBCode.include({
	_getEndpoint: function() {
		var endpoint = this.options.externalEndpoint;
		if( !endpoint || endpoint.substring(0, 4) !== 'http' )
			return '';
		var lastChar = endpoint.substring(endpoint.length - 1);
		if( lastChar != '/' && lastChar != '=' )
			endpoint += '/';
		return endpoint;
	},

	_ajax: function( url, callback, context, post ) {
		var http;
		if (window.XMLHttpRequest) {
			http = new window.XMLHttpRequest();
		}
		if( window.XDomainRequest && (!http || !('withCredentials' in http)) ) {
			// older IE that does not support CORS
			http = new window.XDomainRequest();
		}
		if( !http )
			return;

		function respond() {
			var st = http.status;
			callback.call(context,
				(!st && http.responseText) || (st >= 200 && st < 300) ? false : (st || 499),
				http.responseText);
		}

		if( 'onload' in http )
			http.onload = http.onerror = respond;
		else
			http.onreadystatechange = function() { if( http.readyState == 4 ) respond(); };

		try {
			if( post ) {
				http.open('POST', url, true);
				http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
				http.send(post);
			} else {
				http.open('GET', url, true);
				http.send(null);
			}
		} catch( err ) {
			// most likely a security error
			callback.call(context, 399);
		}
	},

	showExternal: function( element, id, callback, context ) {
		var endpoint = this._getEndpoint();
		if( !endpoint || !id )
			return;

		var errorDiv = this._createMapPanel(element);
		errorDiv.style.display = 'table';

		var cell = document.createElement('div');
		cell.style.display = 'table-cell';
		cell.style.width = '100%';
		cell.style.backgroundColor = '#ddd';
		cell.style.textAlign = 'center';
		cell.style.verticalAlign = 'middle';
		cell.innerHTML = this.strings.sharedCodeLoading.replace('{url}', endpoint + id);
		errorDiv.appendChild(cell);

		var showMap = function(error, content) {
			var show, result, derror = false;
			if( error )
				derror = true;
			else
				result = eval('('+content+')');

			if( error || result.error || !result.bbcode ) {
				cell.innerHTML = this.strings.sharedCodeError.replace('{url}', endpoint + id);
				show = {
					close: function() { errorDiv.close(); }
				};
			} else {
				show = this.show(element, result.bbcode);
				if( result.title ) {
					// todo?
					/* jshint noempty: false */
				}
				if( show ) {
					var map = show.map;
					if( !this.options.outerLinkTemplate ) {
						map.addControl(L.functionButtons([{
							content: window.MapBBCode.buttonsImage,
							bgPos: [52, 0],
							href: endpoint + id,
							alt: '&#x21B7;',
							title: this.strings.outerTitle
						}], { position: 'topright' }));
					}
					if( L.ExportControl ) {
						var ec = new L.ExportControl({
							name: this.strings.exportName,
							title: this.strings.exportTitle,
							filter: typeof this.options.exportTypes === 'string' && this.options.exportTypes.length > 0 ? this.options.exportTypes.split(',') : this.options.exportTypes,
							endpoint: endpoint,
							codeid: id
						});
						map.addControl(ec);
					}
				}
			}
			if( callback )
				callback.call(context || this, show);
		};

		this._ajax(endpoint + id + '?api=1', showMap, this);
	},

	_upload: function( mapDiv, bbcode, callback ) {
		var outerDiv = document.createElement('div');
		outerDiv.style.display = 'table';
		try {
			outerDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
		} catch( err ) { // invalid value in IE8
			outerDiv.style.backgroundColor = 'black';
		}
		outerDiv.style.zIndex = 2000;
		outerDiv.style.position = 'absolute';
		outerDiv.style.left = outerDiv.style.right = outerDiv.style.top = outerDiv.style.bottom = 0;
		outerDiv.style.width = outerDiv.style.height = '100%';
		mapDiv.appendChild(outerDiv);

		var back = document.createElement('div');
		back.style.width = back.style.height = '100%';
		back.style.textAlign = 'center';
		back.style.color = 'white';
		back.style.verticalAlign = 'middle';
		back.style.display = 'table-cell';
		back.style.cursor = 'default';

		var stop = L.DomEvent.stopPropagation;
		L.DomEvent
			.on(back, 'click', stop)
			.on(back, 'mousedown', stop)
			.on(back, 'dblclick', stop);
		outerDiv.appendChild(back);
		var cancel = document.createElement('input');

		var endpoint = this._getEndpoint();
		if( bbcode ) {
			var message = document.createElement('div');
			message.innerHTML = this.strings.uploading + '...';
			back.appendChild(message);
			this._ajax(endpoint + 'save?api=1', function(error, content) {
				if( error ) {
					message.innerHTML = this.strings.uploadError + ': ' + error;
				} else {
					var result = eval('('+content+')');
					if( result.error || !result.codeid ) {
						message.innerHTML = this.strings.uploadError + ':<br>' + result.error;
					} else {
						message.innerHTML = this.strings.uploadSuccess + ':<br><a href="'+result.editurl+'" target="editmap" style="line-height: 40px; color: #ccf">'+result.editurl+'</a>';
						var sthis = this;
						cancel.onclick = function() {
							mapDiv.removeChild(outerDiv);
							callback.call(sthis, result.codeid);
						};
					}
				}
			}, this, 'title=&bbcode=' + encodeURIComponent(bbcode).replace(/%20/g, '+'));
		} else {
			var descDiv = document.createElement('div');
			descDiv.innerHTML = this.strings.sharedFormHeader;
			back.appendChild(descDiv);

			var inputDiv = document.createElement('div');

			var url = document.createElement('input');
			url.type = 'text';
			url.size = 40;
			inputDiv.appendChild(url);

			var urlBtn = document.createElement('input');
			urlBtn.type = 'button';
			urlBtn.value = this.strings.apply;
			inputDiv.appendChild(urlBtn);

			back.appendChild(inputDiv);
			url.focus();

			var errorDiv = document.createElement('div');
			errorDiv.style.color = '#fcc';
			errorDiv.style.display = 'none';
			back.appendChild(errorDiv);

			var checkCode = function() {
				errorDiv.style.display = 'none';
				var matches = new RegExp('(?:/|^)([a-z]+)\\s*$').exec(url.value);
				if( matches ) {
					var id = matches[1];
					this._ajax(endpoint + id + '?api=1', function(error, content) {
						if( error ) {
							errorDiv.innerHTML = this.strings.sharedFormError;
							errorDiv.style.display = 'block';
						} else {
							if( content.substring(0, 15).indexOf('"error"') > 0 ) {
								url.value = '';
								errorDiv.innerHTML = this.strings.sharedFormInvalidCode;
								errorDiv.style.display = 'block';
							} else {
								mapDiv.removeChild(outerDiv);
								callback.call(this, id);
							}
						}
					}, this);
				}
			};
			L.DomEvent.on(urlBtn, 'click', checkCode, this);
			L.DomEvent.on(url, 'keypress', function(e) {
				var keyCode = (window.event) ? (e || window.event).which : e.keyCode;
				if( keyCode == 13 )
					checkCode.call(this);
				else if( keyCode == 27 )
					mapDiv.removeChild(outerDiv);
			}, this);
		}

		cancel.type = 'button';
		cancel.value = this.strings.close;
		cancel.style.marginTop = '30px';
		cancel.onclick = function() {
			mapDiv.removeChild(outerDiv);
		};
		back.appendChild(cancel);
	}
});


/*
 * Support for color params.
 */

if( !('mapBBCodeHandlers' in window) )
	window.mapBBCodeHandlers = [];

window.mapBBCodeHandlers.push({
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
		if( draw.options.draw.polygon )
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
			var target = (window.event && window.event.srcElement) || e.target || e.srcElement,
				targetStyle = target.style;
			if( targetStyle.borderColor == 'white' ) {
				layer.setStyle({ color: targetStyle.backgroundColor, fillColor: targetStyle.backgroundColor });
				layer._colorName = target._colorName;
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
		var anotherDiv = document.createElement('div');
		anotherDiv.style.clear = 'both';
		colorDiv.appendChild(anotherDiv);
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
		div.style.borderStyle = 'solid';
		div.style.fontSize   = '10px';
		div.style.fontFamily = 'sans-serif';
		div.style.fontWeight = 'bold';
		div.style.textAlign  = 'center';
		div.style.lineHeight = diameter + 'px';
		div.style.color      = 'white';
		div.style.backgroundColor = this.options.color;
		div.style.padding = '0';
		this._setIconStyles(div, 'icon');
		return div;
	},

	createShadow: function() { return null; }
});

L.letterIcon = function(letter, options) {
	return new L.LetterIcon(letter, options);
};


/*
 * Small popup-like icon to replace big L.Popup
 */

L.PopupIcon = L.Icon.extend({
	options: {
		selectable: false,
		color: 'white',
		width: 150
	},
	
	initialize: function( text, options ) {
		L.Icon.prototype.initialize.call(this, options);
		this._text = text;
	},

	bindTo: function( marker ) {
		this._marker = marker;
		marker.setIcon(this);
		return marker;
	},

	createIcon: function() {
		var pdiv = document.createElement('div'),
			div = document.createElement('div'),
			width = this.options.width;

		pdiv.style.position = 'absolute';
		div.style.position = 'absolute';
		div.style.width = width + 'px';
		div.style.bottom = '-3px';
		div.style.pointerEvents = 'none';
		div.style.left = (-width / 2) + 'px';
		div.style.margin = div.style.padding = '0';
		pdiv.style.margin = pdiv.style.padding = '0';

		var contentDiv = document.createElement('div');
		contentDiv.innerHTML = this._text;
		contentDiv.style.textAlign = 'center';
		contentDiv.style.lineHeight = '1.2';
		contentDiv.style.backgroundColor = this.options.color;
		contentDiv.style.boxShadow = '0px 1px 10px rgba(0, 0, 0, 0.655)';
		contentDiv.style.padding = '4px 7px';
		contentDiv.style.borderRadius = '5px';
		contentDiv.style.margin = '0 auto';
		contentDiv.style.display = 'table';
		contentDiv.style.pointerEvents = 'auto';

		if( this.options.selectable && (!this._marker || (!this._marker.options.clickable && !this._marker.options.draggable)) ) {
			var stop = L.DomEvent.stopPropagation;
			L.DomEvent
				.on(contentDiv, 'click', stop)
				.on(contentDiv, 'mousedown', stop)
				.on(contentDiv, 'dblclick', stop);
		}

		var tipcDiv = document.createElement('div');
		tipcDiv.className = 'leaflet-popup-tip-container';
		tipcDiv.style.width = '20px';
		tipcDiv.style.height = '11px';
		tipcDiv.style.padding = '0';
		tipcDiv.style.margin = '0 auto';
		var tipDiv = document.createElement('div');
		tipDiv.className = 'leaflet-popup-tip';
		tipDiv.style.width = tipDiv.style.height = '8px';
		tipDiv.style.marginTop = '-5px';
		tipDiv.style.boxShadow = 'none';
		tipcDiv.appendChild(tipDiv);
		
		div.appendChild(contentDiv);
		div.appendChild(tipcDiv);
		pdiv.appendChild(div);
		return pdiv;
	},
	
	createShadow: function () {
		return null;
	}
});

L.popupIcon = function (text, options) {
	return new L.PopupIcon(text, options);
};


/*
 * Leaflet Geocoding plugin that look good.
 */
L.Control.Search = L.Control.extend({
	options: {
		position: 'topleft',
		title: 'Nominatim Search',
		email: ''
	},

	onAdd: function( map ) {
		this._map = map;
		var container = L.DomUtil.create('div', 'leaflet-bar');
		var wrapper = document.createElement('div');
		container.appendChild(wrapper);
		var link = L.DomUtil.create('a', '', wrapper);
		link.href = '#';
		link.style.width = '26px';
		link.style.height = '26px';
		link.style.backgroundImage = 'url(' + this._icon + ')';
		link.style.backgroundSize = '26px 26px';
		link.style.backgroundRepeat = 'no-repeat';
		link.title = this.options.title;

		var stop = L.DomEvent.stopPropagation;
		L.DomEvent
			.on(link, 'click', stop)
			.on(link, 'mousedown', stop)
			.on(link, 'dblclick', stop)
			.on(link, 'click', L.DomEvent.preventDefault)
			.on(link, 'click', this._toggle, this);


		var form = this._form = document.createElement('form');
		form.style.display = 'none';
		form.style.position = 'absolute';
		form.style.left = '27px';
		form.style.top = '0px';
		form.style.zIndex = -10;
		var input = this._input = document.createElement('input');
		input.style.height = '25px';
		input.style.border = '1px solid grey';
		input.style.padding = '0 0 0 10px';
		form.appendChild(input);
		L.DomEvent.on(form, 'submit', function() { this._doSearch(input.value); return false; }, this).on(form, 'submit', L.DomEvent.preventDefault);
		container.appendChild(form);

		return container;
	},

	_toggle: function() {
		if( this._form.style.display != 'block' ) {
			this._form.style.display = 'block';
			this._input.focus();
		} else {
			this._collapse();
		}
	},

	_collapse: function() {
		this._form.style.display = 'none';
		this._input.value = '';
	},

	_nominatimCallback: function( results ) {
		if( results && results.length > 0 ) {
			var bbox = results[0].boundingbox;
			this._map.fitBounds(L.latLngBounds([[bbox[0], bbox[2]], [bbox[1], bbox[3]]]));
		}
		this._collapse();
	},

	_callbackId: 0,

	_doSearch: function( query ) {
		var callback = '_l_osmgeocoder_' + this._callbackId++;
		window[callback] = L.Util.bind(this._nominatimCallback, this);
		var queryParams = {
			q: query,
			format: 'json',
			limit: 1,
			'json_callback': callback
		};
		if( this.options.email )
			queryParams.email = this.options.email;
		if( this._map.getBounds() )
			queryParams.viewbox = this._map.getBounds().toBBoxString();
		var url = 'http://nominatim.openstreetmap.org/search' + L.Util.getParamString(queryParams);
		var script = document.createElement('script');
		script.type = 'text/javascript';
		script.src = url;
		document.getElementsByTagName('head')[0].appendChild(script);
	},

	/* jshint laxbreak: true */
	_icon: 'data:image/png;base64,'
		+'iVBORw0KGgoAAAANSUhEUgAAADQAAAA0CAYAAADFeBvrAAAABHNCSVQICAgIfAhkiAAAAAlwSFlz'
		+'AAAL/wAAC/8Bk9f7AQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAOnSURB'
		+'VGiB7ZhPaBxVHMc/vxezuzlsQqQqFf+Af8CLoWgsNHjoYjazbrR4SsGbgkcPInooLb1YRdBDQRCt'
		+'Cp6E3NLDZmendRXpaiC1kXqwh17EixQsmxATk935edhJHELczbydskOZz+m937zf+73v/Gbe+82I'
		+'qnI3YQa9gLhJBSWdVFDSSQUlnVRQ0kkFJZ174p6wXC5nVXXC9/2RXC53bWFhYS3uGN2QOIrTQqFw'
		+'KJPJnAGeB54GhoNLCtwAlowxHywuLt7oO1gP+hbkOM4rwGfA/T2GbojIKdd1z+sdLPH7EuQ4zufA'
		+'GyHTH8BPIrKsqn8Dk8BR4KmdAar63fb29ov1en3TOnAXrN8hx3Fe5z8x/4jI2dHR0Y/m5+fb+4w9'
		+'KSKfqOohETmezWbPAW/bxu6GVYbK5fJD7Xb7V2AMWPd9/5jnedd7+NzXbrd/BB4HfBE5Xq1Wf7Ba'
		+'dRestu1Wq3WejhiAd3uJAahUKrdE5DU6G4VR1S9tYvcisiDpUAy6S7Va7dOD+gYZ+SLoPuk4zsNR'
		+'4/cisqBisfgEkAdQVTfqjqWqi6H2ZNT4vbDJ0DOh7tWo/qq662OMGbwg4IGdhoj8GdV5fX39Fp33'
		+'CN/3D1vE70pkQar6S6h9JKp/Pp+fAARARK5F9e+FjaAVgjssIs9axNz1McYsW/h3JbIgz/OawM2g'
		+'e7JYLD5yUN9CoZAD3gy67WazuRI1fi+sziER+ThojhpjLhzUb3h4+D2CMkhVLzQajQ2b+F3XZlMp'
		+'iIg4juOp6guB6auhoaG3KpXK6n7j5+bmhprN5jvAOTo3sRVUClesV/5/a7MtTmdnZx9ttVrXCc4k'
		+'4HcROWOMuVKpVG4ClEqlw8BRVT1Np1ANc1tEpqvV6s+2i9+PvqrtmZmZIyLyNTCx59JtYAN4cI99'
		+'E8iF+n/5vj/teV5su11fn+C1Wm1lbGzsORF5HwhX2ePsESMi36jqYyLihsz3GmMul0ql8GHdF7F8'
		+'sUKnAm+1WseMMZNBSTOiqldFZBlYcl33N+jsdJlMZgGYCbnH9vjFJigKgaiLQDFkjkXUQP761Ov1'
		+'za2trROAFzKPq+qlfh+/gWRoh6mpqZF8Pn8RmA6Z+8rUQP/LNRqNjbW1tRPApZC5r0wN/EfjjigR'
		+'uRwyjwNnbeYbuCDoiFpdXX0Z+DYwfa+qr9rMlQhBsJupl1T1w2w2W3Zdd91mnoFuCneCxGQoLlJB'
		+'SScVlHRSQUknFZR0UkFJ564T9C+LGmRQ/iQvLwAAAABJRU5ErkJggg=='
});

L.control.search = function( options ) {
	return new L.Control.Search(options);
};


/*
 * L.Control.Attribution that replaces OpenStreetMap links with permalinks.
 * Also can edd an edit link.
 * Replaces standard attribution control, because of https://github.com/Leaflet/Leaflet/issues/2177
 */
L.Control.StandardAttribution = L.Control.Attribution;
L.Control.PermalinkAttribution = L.Control.Attribution.extend({
	onAdd: function( map ) {
		var container = L.Control.StandardAttribution.prototype.onAdd.call(this, map);
		map.on('moveend', this._update, this);
		return container;
	},

	onRemove: function( map ) {
		map.off('moveend', this._update);
		L.Control.StandardAttribution.prototype.onRemove.call(this, map);
	},

	// copied from original class and slightly modified
	_update: function () {
		if (!this._map) { return; }

		var attribs = [];

		for (var i in this._attributions) {
			if (this._attributions[i]) {
				// make permalink for openstreetmap
				if( i.indexOf('/openstreetmap.org') > 0 || i.indexOf('/www.openstreetmap.org') > 0 ) {
					var permalink = 'http://www.openstreetmap.org/#map={zoom}/{lat}/{lon}';
					i = i.replace(/(['"])http[^'"]+openstreetmap.org[^'"]*(['"])/, '$1' + permalink + '$2');
					if( this._map.options.attributionEditLink ) {
						var editlink = permalink.replace('#', 'edit#');
						i = i.replace(/(openstreetmap.org[^'"]*(['"])[^>]*>[^<]+<\/a>)/, '$1 (<a href=$2' + editlink + '$2 target=$2osmedit$2>Edit</a>)');
					}
				}
				var latlng = this._map.getCenter();
				i = i.replace(/\{zoom\}/g, this._map.getZoom()).replace(/\{lat\}/g, L.Util.formatNum(latlng.lat, 4)).replace(/\{lon\}/g, L.Util.formatNum(latlng.lng, 4));
				attribs.push(i);
			}
		}

		var prefixAndAttribs = [];

		if (this.options.prefix) {
			prefixAndAttribs.push(this.options.prefix);
		}
		if (attribs.length) {
			prefixAndAttribs.push(attribs.join(', '));
		}

		this._container.innerHTML = prefixAndAttribs.join(' | ');
	}
});

L.control.permalinkAttribution = function( options ) {
	return new L.Control.PermalinkAttribution(options);
};

L.Map.mergeOptions({
	attributionEditLink: false
});

L.Control.Attribution = L.Control.PermalinkAttribution;
L.control.standardAttribution = L.control.attribution;
L.control.attribution = L.control.permalinkAttribution;


/*
 * Export button that connects to MapBBCode Share.
 */
L.ExportControl = L.Control.extend({
	includes: L.Mixin.Events,

	options: {
		position: 'topleft',
		name: 'Export',
		title: '',
		endpoint: 'http://share.mapbbcode.org/',
		codeid: '',
		filter: [],
		types: false,
		titles: false
	},

	onAdd: function( map ) {
		var container = L.DomUtil.create('div', 'leaflet-bar');
		var wrapper = document.createElement('div');
		container.appendChild(wrapper);
		var link = L.DomUtil.create('a', '', wrapper);
		link.href = '#';
		link.innerHTML = this.options.name;
		link.title = this.options.title || '';
		link.style.height = '26px';
		link.style.width = 'auto';
		link.style.padding = '0 4px';

		var variants = this._variants = document.createElement('div');
		variants.style.display = 'none';
		variants.style.position = 'absolute';
		variants.style.left = '50px';
		variants.style.top = '0px';
		variants.style.width = '200px';
		variants.style.padding = '0 6px';
		variants.style.backgroundColor = 'white';
		variants.style.zIndex = -10;
		container.appendChild(variants);

		var stop = L.DomEvent.stopPropagation;
		L.DomEvent
			.on(link, 'click', stop)
			.on(link, 'mousedown', stop)
			.on(link, 'dblclick', stop)
			.on(link, 'click', L.DomEvent.preventDefault)
			.on(link, 'click', function() {
				variants.style.display = variants.style.display == 'block' ? 'none' : 'block';
			});

		if( this.options.types && this.options.titles ) {
			this._updateVariants();
		} else {
			// request t&t from endpoint
			this._ajax(this.options.endpoint + 'fmtlist', function(res) {
				if( res && res.types && res.titles )
					this._updateTypesAndTitles(res.types, res.titles);
			}, this);
		}

		return container;
	},

	_updateTypesAndTitles: function( types, titles ) {
		if( !types || !titles || !types.length || types.length != titles.length )
			return;

		var filter = this.options.filter;
		if( filter && filter.length ) {
			var newTypes = [], newTitles = [], i, j;
			for( i = 0; i < types.length; i++ ) {
				for( j = 0; j < filter.length; j++ ) {
					if( types[i] == filter[j] ) {
						newTypes.push(types[i]);
						newTitles.push(titles[i]);
						break;
					}
				}
			}
			this.options.titles = newTitles;
			this.options.types = newTypes;
		} else {
			this.options.titles = titles;
			this.options.types = types;
		}

		this._updateVariants();
	},

	_updateVariants: function() {
		var i, types = this.options.types,
			titles = this.options.titles,
			codeid = this.options.codeid,
			div = this._variants;
		for( i = 0; i < types.length; i++ ) {
			if( i > 0 ) {
				div.appendChild(document.createTextNode(' | '));
			}
			var link1 = document.createElement('a');
			link1.style.display = 'inline';
			link1.style.width = 'auto';
			link1.style.color = 'blue';
			link1.style.border = 'none';
			link1.style.textDecoration = 'none';
			link1.innerHTML = titles[i];
			var stop = L.DomEvent.stopPropagation;
			if( codeid ) {
				link1.href = this.options.endpoint + codeid + '?format=' + types[i];
				L.DomEvent
					.on(link1, 'click', stop)
					.on(link1, 'mousedown', stop)
					.on(link1, 'dblclick', stop)
					.on(link1, 'click', this._linkClick, this);
			} else {
				link1.href = '#';
				link1._etype = types[i];
				L.DomEvent
					.on(link1, 'click', stop)
					.on(link1, 'mousedown', stop)
					.on(link1, 'dblclick', stop)
					.on(link1, 'click', L.DomEvent.preventDefault)
					.on(link1, 'click', this._linkClick, this);
			}
			div.appendChild(link1);
		}
	},

	_linkClick: function(e) {
		var target = (window.event && window.event.srcElement) || e.target || e.srcElement;
		this._variants.style.display = 'none';
		this.fire('export', { fmt: target._etype });
	},

	_ajax: function( url, callback, context ) {
		var http;
		if (window.XMLHttpRequest) {
			http = new window.XMLHttpRequest();
		}
		if( window.XDomainRequest && (!http || !('withCredentials' in http)) ) {
			// older IE that does not support CORS
			http = new window.XDomainRequest();
		}
		if( !http )
			return;

		function respond() {
			var st = http.status;
			if( (!st && http.responseText) || (st >= 200 && st < 300) ) {
				try {
					var result = eval('(' + http.responseText + ')');
					callback.call(context, result);
				} catch( err ) {
				}
			}
		}

		if( 'onload' in http )
			http.onload = http.onerror = respond;
		else
			http.onreadystatechange = function() { if( http.readyState == 4 ) respond(); };

		try {
			http.open('GET', url, true);
			http.send(null);
		} catch( err ) {
		}
	}
});

L.exportControl = function(options) {
	return new L.ExportControl(options);
};


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


window.MapBBCode.include({ strings: {
    "close": "Close",
    "remove": "Delete",
    "apply": "Apply",
    "cancel": "Cancel",
    "title": "Title",
    "zoomInTitle": "Zoom in",
    "zoomOutTitle": "Zoom out",
    "applyTitle": "Apply changes",
    "cancelTitle": "Cancel changes",
    "fullScreenTitle": "Enlarge or shrink map panel",
    "searchTitle": "Search for a location",
    "helpTitle": "Open help window",
    "outerTitle": "Show this place on an external map",
    "mapbbcodeTitle": "A library for parsing, editing and displaying [map] bbcode",
    "submitWarning": "You will lose changes to the map. Proceed?",
    "exportName": "Export",
    "exportTitle": "Download this map",
    "upload": "Upload",
    "uploadTitle": "Upload this map to an external server",
    "uploading": "Uploading",
    "uploadError": "Error while uploading the map",
    "uploadSuccess": "Upload was successful. Bookmark this link to be able to edit the map",
    "sharedFormHeader": "There are no objects to upload. Enter a MapBBCode Share map URL",
    "sharedFormError": "This map panel has incorrect endpoint set.<br>Please contact an administrator.",
    "sharedFormInvalidCode": "Map code is invalid",
    "sharedCodeLoading": "Downloading <a href=\"{url}\" target=\"mapbbcode_outer\">a map</a>...",
    "sharedCodeError": "Failed to download an external map<br><br><a href=\"{url}\" target=\"mapbbcode_outer\">Open map in a new window</a>",
    "polylineTitle": "Draw a path",
    "polygonTitle": "Draw a polygon",
    "markerTitle": "Add a marker",
    "drawCancelTitle": "Cancel drawing",
    "undoPoint": "Delete last point",
    "undoPointTitle": "Delete last point drawn",
    "markerTooltip": "Click map to place marker",
    "polylineStartTooltip": "Click to start drawing a line",
    "polylineContinueTooltip": "Click to continue drawing line",
    "polylineEndTooltip": "Click the last point to finish line",
    "polygonStartTooltip": "Click to start drawing a polygon",
    "polygonContinueTooltip": "Click to continue drawing polygon",
    "polygonEndTooltip": "Click the last point to close this polygon",
    "deleteLastPoint": "Delete last point",
    "deleteLastPointTooltip": "Delete last point drawn",
    "singleLength": "Length of this line",
    "totalLength": "Total length",
    "helpContents": "Map BBCode Editor\n\nSince you have already activated the editor, you know the drill. There are buttons for markers and geometry, you click the map and objects appear, they have popups activated by clicking, from which you can change some properties, like color. To save the drawing click \"Apply\", otherwise there is a \"Cancel\" button.\nWhat you should know is that you are editing not the map, but the underlying bbcode, with all restrictions it imposes. Map BBCode is a text string, which you can copy and paste to different services, and edit directly. <a href=\"http://mapbbcode.org/bbcode.html\" target=\"mapbb\">The syntax</a> of it is quite simple: <tt>[map]...[/map]</tt> tags with a list of objects as coordinate sequences and attributes. When a cursor is inside bbcode, the editor is opened with a drawing it represents, otherwise it will be empty.\nFor a complete manual see <a href=\"http://mapbbcode.org/guide.html\" target=\"mapbb\">User's Guide</a> on the official MapBBCode site.\n\n# Navigating the map\nHere are some hints for using map panels. Keyboard arrows work when a map is in focus. Shift+drag with a mouse to quickly zoom into an area, shift+zoom buttons to change zoom 3 steps at a time. Use the layer switcher at the top right corner to see the drawing on a different map. Mouse wheel is disabled in the viewer, but can be used in the editor to quickly zoom in or out. Use the button with a magnifier to navigate to a named place or a road.\n\n# External maps\nIf the feature is not disabled by an administrator, you can upload your maps to a server, <a href=\"http://share.mapbbcode.org\" target=\"mapbb\">share.mapbbcode.org</a> by default, with an \"Upload\" button. If you click it not having drawn anything, it will ask for a map URL or identifier. Those are converted to <tt>[mapid]id[/mapid]</tt> bbcode, which looks like a regular map, but with an export button: users can download a drawing as GPX or CSV or in any other format. If you share an edit link for a map, others can join in, and changes will be reflected in embedded maps.\n\n# Plugin\n<a href=\"http://mapbbcode.org/\" target=\"mapbb\">MapBBCode</a> is an open source javascript library with plugins around it available for some forum and blog engines. Its goal is to make sharing maps easier. This is version {version}.\n"
}});

}(window, document));