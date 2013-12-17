/*
 * MapBBCode Share functions. Extends MapBBCode display/edit module.
 */
window.MapBBCode.include({
	_getEndpoint: function() {
		var endpoint = this.options.externalEndpoint;
		if( !endpoint || endpoint.substring(0, 4) !== 'http' )
			return '';
		var lastChar = endpoint.substring(endpoint.length - 1);
		if( lastChar != '/' && lastChar != '=' )
			endpoint += '/';
		return endpoint;
	},

	_ajax: function( url, callback, context, post ) {
		var http;
		if (window.XMLHttpRequest) {
			http = new window.XMLHttpRequest();
		}
		if( window.XDomainRequest && (!http || !('withCredentials' in http)) ) {
			// older IE that does not support CORS
			http = new window.XDomainRequest();
		}
		if( !http )
			return;

		function respond() {
			var st = http.status;
			callback.call(context,
				(!st && http.responseText) || (st >= 200 && st < 300) ? false : (st || 499),
				http.responseText);
		}

		if( 'onload' in http )
			http.onload = http.onerror = respond;
		else
			http.onreadystatechange = function() { if( http.readyState == 4 ) respond(); };

		try {
			if( post ) {
				http.open('POST', url, true);
				http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
				http.send(post);
			} else {
				http.open('GET', url, true);
				http.send(null);
			}
		} catch( err ) {
			// most likely a security error
			callback.call(context, 399);
		}
	},

	showExternal: function( element, id, callback, context ) {
		var endpoint = this._getEndpoint();
		if( !endpoint || !id )
			return;

		var errorDiv = this._createMapPanel(element);
		errorDiv.style.display = 'table';

		var cell = document.createElement('div');
		cell.style.display = 'table-cell';
		cell.style.width = '100%';
		cell.style.backgroundColor = '#ddd';
		cell.style.textAlign = 'center';
		cell.style.verticalAlign = 'middle';
		cell.innerHTML = this.strings.sharedCodeLoading.replace('{url}', endpoint + id);
		errorDiv.appendChild(cell);

		var showMap = function(error, content) {
			var show, result, derror = false;
			if( error )
				derror = true;
			else
				result = eval('('+content+')');

			if( error || result.error || !result.bbcode ) {
				cell.innerHTML = this.strings.sharedCodeError.replace('{url}', endpoint + id);
				show = {
					close: function() { errorDiv.close(); }
				};
			} else {
				show = this.show(element, result.bbcode);
				if( result.title ) {
					// todo?
					/* jshint noempty: false */
				}
				if( show ) {
					var map = show.map;
					if( !this.options.outerLinkTemplate ) {
						map.addControl(L.functionButtons([{
							content: window.MapBBCode.buttonsImage,
							bgPos: [52, 0],
							href: endpoint + id,
							alt: '&#x21B7;',
							title: this.strings.outerTitle
						}], { position: 'topright' }));
					}
					if( L.ExportControl ) {
						var ec = new L.ExportControl({
							name: this.strings.exportName,
							title: this.strings.exportTitle,
							filter: typeof this.options.exportTypes === 'string' && this.options.exportTypes.length > 0 ? this.options.exportTypes.split(',') : this.options.exportTypes,
							endpoint: endpoint,
							codeid: id
						});
						map.addControl(ec);
					}
				}
			}
			if( callback )
				callback.call(context || this, show);
		};

		this._ajax(endpoint + id + '?api=1', showMap, this);
	},

	_upload: function( mapDiv, bbcode, callback ) {
		var outerDiv = document.createElement('div');
		outerDiv.style.display = 'table';
		try {
			outerDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
		} catch( err ) { // invalid value in IE8
			outerDiv.style.backgroundColor = 'black';
		}
		outerDiv.style.zIndex = 2000;
		outerDiv.style.position = 'absolute';
		outerDiv.style.left = outerDiv.style.right = outerDiv.style.top = outerDiv.style.bottom = 0;
		outerDiv.style.width = outerDiv.style.height = '100%';
		mapDiv.appendChild(outerDiv);

		var back = document.createElement('div');
		back.style.width = back.style.height = '100%';
		back.style.textAlign = 'center';
		back.style.color = 'white';
		back.style.verticalAlign = 'middle';
		back.style.display = 'table-cell';
		back.style.cursor = 'default';

		var stop = L.DomEvent.stopPropagation;
		L.DomEvent
			.on(back, 'click', stop)
			.on(back, 'mousedown', stop)
			.on(back, 'dblclick', stop);
		outerDiv.appendChild(back);
		var cancel = document.createElement('input');

		var endpoint = this._getEndpoint();
		if( bbcode ) {
			var message = document.createElement('div');
			message.innerHTML = this.strings.uploading + '...';
			back.appendChild(message);
			this._ajax(endpoint + 'save?api=1', function(error, content) {
				if( error ) {
					message.innerHTML = this.strings.uploadError + ': ' + error;
				} else {
					var result = eval('('+content+')');
					if( result.error || !result.codeid ) {
						message.innerHTML = this.strings.uploadError + ':<br>' + result.error;
					} else {
						message.innerHTML = this.strings.uploadSuccess + ':<br><a href="'+result.editurl+'" target="editmap" style="line-height: 40px; color: #ccf">'+result.editurl+'</a>';
						var sthis = this;
						cancel.onclick = function() {
							mapDiv.removeChild(outerDiv);
							callback.call(sthis, result.codeid);
						};
					}
				}
			}, this, 'title=&bbcode=' + encodeURIComponent(bbcode).replace(/%20/g, '+'));
		} else {
			var descDiv = document.createElement('div');
			descDiv.innerHTML = this.strings.sharedFormHeader;
			back.appendChild(descDiv);

			var inputDiv = document.createElement('div');

			var url = document.createElement('input');
			url.type = 'text';
			url.size = 40;
			inputDiv.appendChild(url);

			var urlBtn = document.createElement('input');
			urlBtn.type = 'button';
			urlBtn.value = this.strings.apply;
			inputDiv.appendChild(urlBtn);

			back.appendChild(inputDiv);
			url.focus();

			var errorDiv = document.createElement('div');
			errorDiv.style.color = '#fcc';
			errorDiv.style.display = 'none';
			back.appendChild(errorDiv);

			var checkCode = function() {
				errorDiv.style.display = 'none';
				var matches = new RegExp('(?:/|^)([a-z]+)\\s*$').exec(url.value);
				if( matches ) {
					var id = matches[1];
					this._ajax(endpoint + id + '?api=1', function(error, content) {
						if( error ) {
							errorDiv.innerHTML = this.strings.sharedFormError;
							errorDiv.style.display = 'block';
						} else {
							if( content.substring(0, 15).indexOf('"error"') > 0 ) {
								url.value = '';
								errorDiv.innerHTML = this.strings.sharedFormInvalidCode;
								errorDiv.style.display = 'block';
							} else {
								mapDiv.removeChild(outerDiv);
								callback.call(this, id);
							}
						}
					}, this);
				}
			};
			L.DomEvent.on(urlBtn, 'click', checkCode, this);
			L.DomEvent.on(url, 'keypress', function(e) {
				var keyCode = (window.event) ? (e || window.event).which : e.keyCode;
				if( keyCode == 13 )
					checkCode.call(this);
				else if( keyCode == 27 )
					mapDiv.removeChild(outerDiv);
			}, this);
		}

		cancel.type = 'button';
		cancel.value = this.strings.close;
		cancel.style.marginTop = '30px';
		cancel.onclick = function() {
			mapDiv.removeChild(outerDiv);
		};
		back.appendChild(cancel);
	}
});
