/*
 * List of public-use layers.
 */
window.layerList = {
    list: {
        "OpenStreetMap": "L.tileLayer('http://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: 'Map &copy; <a href=\"http://openstreetmap.org\">OpenStreetMap</a>', minZoom: 0, maxZoom: 19 })",
        "OpenStreetMap DE": "L.tileLayer('http://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png', { attribution: 'Map &copy; <a href=\"http://openstreetmap.org\">OpenStreetMap</a>', minZoom: 0, maxZoom: 18 })",
        "CycleMap": "L.tileLayer('http://{s}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png', { attribution: 'Map &copy; <a href=\"http://openstreetmap.org\">OSM</a> | Tiles &copy; Andy Allan', minZoom: 0, maxZoom: 18 })",
        "OpenMapSurfer": "L.tileLayer('http://129.206.74.245:8001/tms_r.ashx?x={x}&y={y}&z={z}', { name: 'MapSurfer', attribution: 'Map &copy; <a href=\"http://openstreetmap.org\">OSM</a> | Tiles &copy; <a href=\"http://giscience.uni-hd.de/\">GIScience Heidelberg</a>', minZoom: 0, maxZoom: 19 })",
        "Humanitarian": "L.tileLayer('http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', { attribution: 'Map &copy; <a href=\"http://openstreetmap.org\">OpenStreetMap</a> | Tiles &copy; <a href=\"http://hot.openstreetmap.org\">Humanitarian OSM Team</a>', minZoom: 0, maxZoom: 19 })",
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
        /* jshint evil: true, unused: false */
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
