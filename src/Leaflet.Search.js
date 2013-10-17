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
