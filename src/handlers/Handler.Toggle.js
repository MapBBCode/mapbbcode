/*
 * Toggle objects handler. Click on a checkbox to hide or show objects.
 */

if( !('mapBBCodeHandlers' in window) )
	window.mapBBCodeHandlers = [];

window.mapBBCodeHandlers.push({
	panelHook: function( control, ui ) {
		if( !('toggleObjects' in control) )
			return;

		var Checkbox = L.Control.extend({
			options: {
				position: 'topright',
				text: 'Data',
				title: 'Toggle lines and markers visibility'
			},

			initialize: function(control, options) {
				L.setOptions(this, options);
				this._control = control;
				this._state = true;
			},

			onAdd: function(map) {
				var container = this._container = document.createElement('div');
				container.className = 'leaflet-bar';
				container.style.background = 'white';
				container.style.padding = '3px 5px';
				container.title = this.options.title;

				var checkbox = document.createElement('input');
				checkbox.type = 'checkbox';
				checkbox.id = 'toggle-objects';
				checkbox.checked = this._state;
				L.DomEvent.on(checkbox, 'change', function() {
					state = control.toggleObjects();
					checkbox.checked = state;
				});
				var label = document.createElement('label');
				label.appendChild(document.createTextNode(this.options.text));
				label.htmlFor = checkbox.id;
				label.style.paddingLeft = '2px';
				container.appendChild(checkbox);
				container.appendChild(label);

				var stop = L.DomEvent.stopPropagation;
				L.DomEvent
					.on(container, 'click', stop)
					.on(container, 'mousedown', stop)
					.on(container, 'dblclick', stop);

				return container;
			}
		});

		var check = new Checkbox(control);
		if( ui.strings.toggleData )
			check.options.text = ui.strings.toggleData;
		if( ui.strings.toggleDataTitle )
			check.options.title = ui.strings.toggleDataTitle;
		control.map.addControl(check);
	}
});
