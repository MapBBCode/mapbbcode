L.ExportControl = L.Control.extend({
    includes: L.Mixin.Events,

    options: {
        position: 'topleft',
        endpoint: 'http://share.mapbbcode.org/',
        codeid: '',
        types: false,
        titles: false
    },

    onAdd: function( map ) {
        var container = L.DomUtil.create('div', 'leaflet-bar');
        var wrapper = document.createElement('div');
        container.appendChild(wrapper);
        var link = L.DomUtil.create('a', '', wrapper);
        link.href = '#';
        link.innerHTML = 'Export';
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
                if( res && res.titles && res.titles.length > 0 && res.types && res.types.length == res.titles.length ) {
                    this.options.titles = res.titles;
                    this.options.types = res.types;
                    this._updateVariants();
                }
            }, this);
        }

        return container;
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
        this._variants.style.display = 'none';
        this.fire('export', { fmt: e.target._etype });
    },

    _ajax: function( url, func, context ) {
        var http = null;
        if (window.XMLHttpRequest) {
            http = new XMLHttpRequest();
        } else if (window.ActiveXObject) { // Older IE.
            http = new ActiveXObject("MSXML2.XMLHTTP.3.0");
        }
        http.onreadystatechange = function() {
            if( http.readyState != 4 || http.status != 200 ) return;
            var result = eval('('+http.responseText+')');
            func.call(context, result);
        };
        http.open('GET', url, true);
        http.send(null);
    }
});

L.exportControl = function(options) {
    return new L.ExportControl(options);
};
