/*
 * Measurements in a popup. An example of non-parameter plugin.
 */

if( !('mapBBCodeHandlers' in window) )
	window.mapBBCodeHandlers = [];

window.mapBBCodeHandlers.push({
	applicableTo: function( layer ) {
		return layer instanceof L.Polyline; // includes polygons
	},

	createEditorPanel: function( layer, ui ) {
		var title, metric = 'metric' in ui.options ? ui.options.metric : true;
		if( layer instanceof L.Polygon )
			title = ui.strings.area || 'Area';
		else if( layer instanceof L.Polyline )
			title = ui.strings.mlength || 'Length';
		else
			return;
		var measureDiv = document.createElement('div');
		measureDiv.style.textAlign = 'left';
		measureDiv.style.marginBottom = '4px';
		measureDiv.appendChild(document.createTextNode(title + ':'));
		var value = document.createElement('span');
		value.style.paddingLeft = '4px';
		measureDiv.appendChild(value);
		var update = function() {
			if( layer instanceof L.Polygon ) {
				var area = L.GeometryUtil.geodesicArea(layer.getLatLngs());
				value.innerHTML = L.GeometryUtil.readableArea(area, metric);
			} else { // polyline
				var i, d = 0, latlngs = layer.getLatLngs();
				for( i = 1; i < latlngs.length; i++ ) {
					d += latlngs[i-1].distanceTo(latlngs[i]);
				}
				value.innerHTML = L.GeometryUtil.readableDistance(d, metric);
			}
		};
		layer.on('edit', update);
		update();
		return measureDiv;
	}
});
