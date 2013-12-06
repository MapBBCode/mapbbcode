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
