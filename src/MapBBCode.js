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

        var result = '', objs = data.objs || [];
        for( var i = 0; i < objs.length; i++ ) {
            if( i > 0 )
                result = result + '; ';
            var coords = objs[i].coords;
            for( var j = 0; j < coords.length; j++ ) {
                if( j > 0 )
                    result = result + ' ';
                result = result + this._latLngToString(coords[j]);
            }
            var text = objs[i].text || '', params = objs[i].params || [];
            if( text.indexOf('|') >= 0 && params.length === 0 )
                text = '|' + text;
            if( text.length > 0 || params.length > 0 )
                result = result + '(' + (params.length > 0 ? params.join(',') + '|' : '') + text.replace(/\)/g, '\\)').replace(/;/g, ';;') + ')';
        }

        return result.length || mapData.length ? '[map' + mapData + ']'+result+'[/map]' : '';
    },

    _latLngToString: function( latlng ) {
        var mult = Math.pow(10, 5);
        return '' + (Math.round((latlng.lat || latlng[0]) * mult) / mult) + ',' + (Math.round((latlng.lng || latlng[1]) * mult) / mult);
    }
};
