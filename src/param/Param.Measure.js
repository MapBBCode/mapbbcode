/*
 * Measurements in a popup. An example of non-parameter plugin.
 */

if( !('objectParams' in window.MapBBCode) )
    window.MapBBCode.objectParams = [];

window.MapBBCode.objectParams.push({
    // nope
    reKeys: new RegExp('a^'),
    
    applicableTo: function( layer ) {
        return layer instanceof L.Polyline; // includes polygons
    },

    // not a parameter
    objectToLayer: function() {
    },
    
    // not a parameter
    layerToObject: function() {
    },
    
    createEditorPanel: function( layer, ui ) {
        var title, metric = 'metric' in ui.options ? ui.options.metric : true;
        if( layer instanceof L.Polygon )
            title = ui.strings.area || 'Area';
        else if( layer instanceof L.Polyline )
            title = ui.strings.length || 'Length';
        else
            return;
        var measureDiv = document.createElement('div');
        measureDiv.style.clear = 'both';
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
