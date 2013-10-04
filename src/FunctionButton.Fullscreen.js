L.Fullscreen = L.FunctionButton.extend({
    options: {
        position: 'topright',
        height: '100%',
        bgPos: L.point(0, 0)
    },

    initialize: function( options ) {
        this._isFull = false;
        L.FunctionButton.prototype.initialize.call(this, window.MapBBCode.buttonsImage, options);
    },

    clicked: function() {
        var map = this._map,
            style = map.getContainer().style,
            isFull = this._isFull;
        if( !isFull && !this._oldWidth ) {
            this._oldWidth = style.width;
            this._oldHeight = style.height;
        }
        this._map.getContainer().style.width = isFull ? this._oldWidth : '100%';
        this._map.getContainer().style.height = isFull ? this._oldHeight: this.options.height;
        this._map.invalidateSize();
        this.options.bgPos.x = isFull ? 0 : 26;
        this.updateBgPos();
        this._isFull = !isFull;
        this.fire('clicked');
    }
});
