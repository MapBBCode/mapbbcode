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
