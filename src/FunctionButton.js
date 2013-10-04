/*
 * A leaflet button with icon or text and click listener.
 */
L.FunctionButton = L.Control.extend({
    includes: L.Mixin.Events,

    initialize: function( content, options ) {
        this._content = content;
        L.Control.prototype.initialize.call(this, options);
    },

    onAdd: function( map ) {
        this._map = map;

        var container = L.DomUtil.create('div', 'leaflet-bar');
        var link = L.DomUtil.create('a', '', container);
        this._link = link;
        link.href = '#';
        link.style.padding = '0 4px';
        link.style.width = 'auto';
        link.style.minWidth = '20px';
        if( this.options.title )
            link.title = this.options.title;

        if( typeof this._content === 'string' ) {
            var ext = this._content.length < 4 ? '' : this._content.substring(this._content.length - 4),
                isData = this._content.substring(0, 11) === 'data:image/';
            if( ext === '.png' || ext === '.gif' || ext === '.jpg' || isData ) {
                link.style.width = '' + (this.options.imageSize || 26) + 'px';
                link.style.height = '' + (this.options.imageSize || 26) + 'px';
                link.style.padding = '0';
                link.style.backgroundImage = 'url(' + this._content + ')';
                link.style.backgroundRepeat = 'no-repeat';
                link.style.backgroundPosition = !this.options.bgPos ? '0px 0px' : (-this.options.bgPos.x) + 'px ' + (-this.options.bgPos.y) + 'px';
            } else
                link.innerHTML = this._content;
        } else
            link.appendChild(this._content);

        var stop = L.DomEvent.stopPropagation;
        L.DomEvent
            .on(link, 'click', stop)
            .on(link, 'mousedown', stop)
            .on(link, 'dblclick', stop)
            .on(link, 'click', L.DomEvent.preventDefault)
            .on(link, 'click', this.clicked, this);

        return container;
    },

    updateBgPos: function() {
        this._link.style.backgroundPosition = !this.options.bgPos ? '0px 0px' : (-this.options.bgPos.x) + 'px ' + (-this.options.bgPos.y) + 'px';
    },

    clicked: function() {
        this.fire('clicked');
    }
});

L.functionButton = function( content, options ) {
    return new L.FunctionButton(content, options);
};
