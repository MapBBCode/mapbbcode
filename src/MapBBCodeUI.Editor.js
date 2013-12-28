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
					version = '$$VERSION$$',
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

		if( this._edWnd && !this._edWnd.closed )
			this._edWnd.close();
		this._edWnd = window.open(url, 'mapbbcode_editor', features + ',' + featSize);
	}
});
