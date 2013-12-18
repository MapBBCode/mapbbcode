/*
 * Support for color params.
 */

if( !('mapBBCodeHandlers' in window) )
	window.mapBBCodeHandlers = [];

window.mapBBCodeHandlers.push({
	lineColors: {
		def: '#0022dd',
		blue: '#0022dd',
		red: '#bb0000',
		green: '#007700',
		brown: '#964b00',
		purple: '#800080',
		black: '#000000'
	},

	// regular expression for supported keys
	reKeys: new RegExp('^(blue|red|green|brown|purple|black)$'),
	
	applicableTo: function( layer ) {
		return layer instanceof L.Polygon || layer instanceof L.Polyline;
	},

	// applies relevant params to the layer object
	objectToLayer: function( layer, params ) {
		var colors = this.lineColors,
			color = params.length > 0 && params[0] in colors ? colors[params[0]] : colors.def;
		layer.options.color = color;
		if( layer instanceof L.Polygon )
			layer.options.fillColor = color;
	},
	
	// returns array with layer properties
	layerToObject: function( layer, lastParams ) {
		return layer._colorName ? (this.lineColors[layer._colorName] !== this.lineColors.def ? [layer._colorName] : []) : lastParams;
	},
	
	initLayer: function( layer ) {
	},
	
	initDrawControl: function(draw) {
		draw.options.draw.polyline.shapeOptions.color = this.lineColors.def;
		if( draw.options.draw.polygon )
			draw.options.draw.polygon.shapeOptions.color = this.lineColors.def;
	},
	
	createEditorPanel: function( layer ) {
		var colorDiv = document.createElement('div');
		var colors = [], c, lineColors = this.lineColors;
		for( c in lineColors )
			if( typeof lineColors[c] === 'string' && lineColors[c].substring(0, 1) === '#' )
				colors.push(c);
		colors = colors.sort();
		colorDiv.style.width = 10 + 20 * colors.length + 'px';
		colorDiv.textAlign = 'center';
		var colOnclick = function(e) {
			var target = (window.event && window.event.srcElement) || e.target || e.srcElement,
				targetStyle = target.style;
			if( targetStyle.borderColor == 'white' ) {
				layer.setStyle({ color: targetStyle.backgroundColor, fillColor: targetStyle.backgroundColor });
				layer._colorName = target._colorName;
				var nodes = colorDiv.childNodes;
				for( var j = 0; j < nodes.length; j++ )
					nodes[j].style.borderColor = 'white';
				targetStyle.borderColor = '#aaa';
			}
		};
		for( var i = 0; i < colors.length; i++ ) {
			if( colors[i] === 'def' )
				continue;
			var col = document.createElement('div');
			col._colorName = colors[i];
			col.style.width = '16px';
			col.style.height = '16px';
			col.style.cssFloat = 'left';
			col.style.styleFloat = 'left';
			col.style.marginRight = '3px';
			col.style.marginBottom = '5px';
			col.style.cursor = 'pointer';
			var color = lineColors[colors[i]];
			col.style.backgroundColor = color;
			col.style.borderWidth = '3px';
			col.style.borderStyle = 'solid';
			col.style.borderColor = color == layer.options.color ? '#aaa' : 'white';
			col.onclick = colOnclick;
			colorDiv.appendChild(col);
		}
		var anotherDiv = document.createElement('div');
		anotherDiv.style.clear = 'both';
		colorDiv.appendChild(anotherDiv);
		return colorDiv;
	}
});
