/*
 * Text labels. Editing only for markers.
 */

if( !('objectParams' in window.MapBBCode) )
    window.MapBBCode.objectParams = [];

window.MapBBCode.objectParams.unshift({
    text: true,

    // this regex always fails
    reKeys: new RegExp('a^'),
    
    applicableTo: function() {
        return true;
    },

    // creates marker from text
    objectToLayer: function( layer, text, ui ) {
        if( text ) {
            layer._text = text;
            if( L.LetterIcon && layer instanceof L.Marker && ui.options.letterIcons && text.length >= 1 && text.length <= 2 ) {
                layer.setIcon(new L.LetterIcon(text));
                layer.options.clickable = false;
            } else {
                layer.bindPopup(text.replace(new RegExp('<(?!/?(' + ui.options.allowedHTML + ')[ >])', 'g'), '&lt;'));
            }
        } else
            layer.options.clickable = false;
    },
    
    // returns new text
    layerToObject: function( layer ) {
        return layer.inputField ? layer.inputField.value.replace(/\\n/g, '\n').replace(/\\\n/g, '\\n') : (layer._text || '');
    },
    
    createEditorPanel: function( layer, ui ) {
        if( !(layer instanceof L.Marker ) )
            return;
        var commentDiv = document.createElement('div');
        var commentSpan = document.createTextNode(ui.strings.title + ': ');
        var inputField = document.createElement('input');
        inputField.type = 'text';
        inputField.size = 20;
        if( layer._text )
            inputField.value = layer._text.replace(/\\n/g, '\\\\n').replace(/[\r\n]+/g, '\\n');
        commentDiv.appendChild(commentSpan);
        commentDiv.appendChild(inputField);
        commentDiv.style.marginBottom = '8px';

        layer.inputField = inputField;
        layer.options.draggable = true;
        layer.defaultIcon = new L.Icon.Default();
        inputField.onkeypress = function(e) {
            var keyCode = (window.event) ? (e || window.event).which : e.keyCode;
            if( keyCode == 27 || keyCode == 13 ) { // escape actually does not work
                layer.closePopup();
                e.preventDefault();
                return false;
            }
        };
        layer.on('popupopen', function() {
            inputField.focus();
        });
        layer.on('popupclose', function() {
            var title = layer.inputField.value;
            if( L.LetterIcon && ui.options.letterIcons && title.length > 0 && title.length <= 2 )
                layer.setIcon(new L.LetterIcon(title));
            else
                layer.setIcon(layer.defaultIcon);
        }, this);
        return commentDiv;
    }
});
