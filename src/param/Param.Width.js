/*
 * Width parameter. Just an example.
 */

if( !('objectParams' in window.MapBBCode) )
    window.MapBBCode.objectParams = [];

window.MapBBCode.objectParams.push({
    widths: [3, 5, 7, 10],
    defaultWidth: 5,

    // regular expression for supported keys
    reKeys: new RegExp('^w\\d+$'),
    
    applicableTo: function( layer ) {
        return layer instanceof L.Polyline;
    },

    // applies relevant params to the layer object
    objectToLayer: function( layer, params ) {
        var width = params.length > 0 ? params[0].substring(1) : this.defaultWidth, found;
        for( var i = 0; i < this.widths.length; i++ )
            if( this.widths[i] == width )
                found = width;
        if( !found )
            found = width < this.widths[0] ? this.widths[0] : this.widths[this.widths.length - 1];
        layer.options.weight = found;
    },
    
    // returns array with layer properties
    layerToObject: function( layer, lastParams ) {
        return layer._width ? (layer._width !== this.defaultWidth ? ['w'+layer._width] : []) : lastParams;
    },
    
    initDrawControl: function(draw) {
        draw.options.draw.polyline.shapeOptions.weight = this.defaultWidth;
    },
    
    createEditorPanel: function( layer ) {
        var colorDiv = document.createElement('div');
        colorDiv.style.width = 10 + 24 * this.widths.length + 'px';
        colorDiv.textAlign = 'center';
        var colOnclick = function(e) {
            var target = e.target._width ? e.target : e.target.parentNode,
                width = target._width;
            if( target.style.borderColor == 'white' ) {
                layer.setStyle({ weight: width });
                layer._width = width;
                var nodes = colorDiv.childNodes;
                for( var j = 0; j < nodes.length; j++ )
                    nodes[j].style.borderColor = 'white';
                target.style.borderColor = '#aaa';
            }
        };
        for( var i = 0; i < this.widths.length; i++ ) {
            var col = document.createElement('div'), w = this.widths[i];
            col._width = w;
            col.style.width = '16px';
            col.style.height = '16px';
            col.style.cssFloat = 'left';
            col.style.styleFloat = 'left';
            col.style.marginRight = '3px';
            col.style.marginBottom = '5px';
            col.style.cursor = 'pointer';
            col.style.backgroundColor = 'white';
            col.style.borderWidth = '3px';
            col.style.borderStyle = 'solid';
            col.style.borderColor = w == layer.options.weight ? '#aaa' : 'white';
            col.onclick = colOnclick;
            colorDiv.appendChild(col);
            
            var col2 = document.createElement('div');
            col2.style.width = '16px';
            col2.style.height = w + 'px';
            col2.style.marginTop = (8 - w / 2) + 'px';
            col2.style.backgroundColor = 'black';
            col2.onclick = colOnclick;
            col.appendChild(col2);
        }
        return colorDiv;
    }
});