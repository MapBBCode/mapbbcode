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
