/*
 * A leaflet button with icon or text and click listener.
 */
L.FunctionButtons = L.Control.extend({
    includes: L.Mixin.Events,

    initialize: function( content, options ) {
        this._content = content;
        if( !options.titles )
            options.titles = [];
        if( options.titles.length < content.length )
            for( var i = options.titles.length; i < content.length; i++ )
                options.titles.push('');
        L.Control.prototype.initialize.call(this, options);
    },

    onAdd: function( map ) {
        this._map = map;
        this._links = [];

        var container = L.DomUtil.create('div', 'leaflet-bar');
        for( var i = 0; i < this._content.length; i++ ) {
            var link = L.DomUtil.create('a', '', container);
            this._links.push(link);
            link.href = '#';
            link.style.padding = '0 4px';
            link.style.width = 'auto';
            link.style.minWidth = '20px';
			if( this.options.bgColor )
				link.style.backgroundColor = this.options.bgColor;
            if( this.options.titles && this.options.titles.length > i )
                link.title = this.options.titles[i];
            this._updateContent(i);

            var stop = L.DomEvent.stopPropagation;
            L.DomEvent
                .on(link, 'click', stop)
                .on(link, 'mousedown', stop)
                .on(link, 'dblclick', stop)
                .on(link, 'click', L.DomEvent.preventDefault)
                .on(link, 'click', this.clicked, this);
        }

        return container;
    },

    _updateContent: function( n ) {
        if( n >= this._content.length )
            return;
        var link = this._links[n],
            content = this._content[n];
        if( typeof content === 'string' ) {
            var ext = content.length < 4 ? '' : content.substring(content.length - 4),
                isData = content.substring(0, 11) === 'data:image/';
            if( ext === '.png' || ext === '.gif' || ext === '.jpg' || isData ) {
                link.style.width = '' + (this.options.imageSize || 26) + 'px';
                link.style.height = '' + (this.options.imageSize || 26) + 'px';
                link.style.padding = '0';
                link.style.backgroundImage = 'url(' + content + ')';
                link.style.backgroundRepeat = 'no-repeat';
                link.style.backgroundPosition = this.options.bgPos && this.options.bgPos.length > n && this.options.bgPos[n] ? (-this.options.bgPos[n][0]) + 'px ' + (-this.options.bgPos[n][1]) + 'px' : '0px 0px';
            } else
                link.innerHTML = content;
        } else {
            while( link.firstChild )
                link.removeChild(link.firstChild);
            link.appendChild(content);
        }
    },

    setContent: function( n, content ) {
        if( n >= this._content.length )
            return;
        this._content[n] = content;
        this._updateContent(n);
    },

    setTitle: function( n, title ) {
        this.options.titles[n] = title;
        this._links[n].title = title;
    },

    setBgPos: function( n, bgPos ) {
        this.options.bgPos[n] = bgPos;
        this._links[n].style.backgroundPosition = bgPos ? (-bgPos[0]) + 'px ' + (-bgPos[1]) + 'px' : '0px 0px';
    },

    clicked: function(e) {
        var link = (window.event && window.event.srcElement) || e.target || e.srcElement,
            idx = this._links.length;
        while( --idx >= 0 )
            if( link === this._links[idx] )
                break;
        this.fire('clicked', {idx: idx});
    }
});

L.functionButtons = function( content, options ) {
    return new L.FunctionButtons(content, options);
};

L.FunctionButton = L.FunctionButtons.extend({
    initialize: function( content, options ) {
        if( options.title )
            options.titles = [options.title];
        if( options.bgPos )
            options.bgPos = [options.bgPos];
        L.FunctionButtons.prototype.initialize.call(this, [content], options);
    },

    setContent: function( content ) {
        L.FunctionButtons.prototype.setContent.call(this, 0, content);
    },

    setTitle: function( title ) {
        L.FunctionButtons.prototype.setTitle.call(this, 0, title);
    },
    
    setBgPos: function( bgPos ) {
        L.FunctionButtons.prototype.setBgPos.call(this, 0, bgPos);
    }
});

L.functionButton = function( content, options ) {
    return new L.FunctionButton(content, options);
};
