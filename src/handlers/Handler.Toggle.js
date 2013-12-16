/*
 * Toggle objects handler. Click on a checkbox to hide or show objects.
 */

if( !('mapBBCodeHandlers' in window) )
	window.mapBBCodeHandlers = [];

window.mapBBCodeHandlers.push({
	panelHook: function( control, ui ) {
		if( !('toggleObjects' in control) )
			return;
		var state = true;
		// todo: add checkbox
	}
});
