L.LetterIcon = L.Icon.extend({
    options: {
        className: 'leaflet-div-icon',
        radius: 11
    },

    initialize: function(letter, options) {
        this._letter = letter;
        L.Icon.prototype.initialize(this, options);
    },

    createIcon: function(old) {
        var radius = this.options.radius,
            diameter = radius * 2 + 1;
        var div = document.createElement('div');
        div.innerHTML = this._letter;
        div.className = 'leaflet-marker-icon';
        div.style.marginLeft = (-radius) + 'px';
        div.style.marginTop  = (-radius) + 'px';
        div.style.width      = diameter + 'px';
        div.style.height     = diameter + 'px';
        div.style.borderRadius = (radius + 2) + 'px';
        div.style.borderWidth = '2px';
        div.style.borderColor = 'white';
        div.style.fontSize   = '10px';
        div.style.fontFamily = 'sans-serif';
        div.style.fontWeight = 'bold';
        div.style.textAlign  = 'center';
        div.style.lineHeight = diameter + 'px';
        div.style.color      = 'white';
        div.style.backgroundColor = 'black';
        this._setIconStyles(div, 'icon');
        return div;
    },

    createShadow: function() { return null; }
});
