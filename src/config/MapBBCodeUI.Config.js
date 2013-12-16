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

