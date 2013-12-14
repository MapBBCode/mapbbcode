/* Downloads the latest translations from Transifex */
/* Taken from iD editor project and rewritten a bit */

var request = require('request'),
    yaml = require('js-yaml'),
    fs = require('fs');

var resources = ['core', 'config'],
	classes = { core: 'MapBBCode', config: 'MapBBCodeConfig'},
	project = 'http://www.transifex.com/api/2/project/mapbbcode/',
	auth = JSON.parse(fs.readFileSync('build/transifex.auth', 'utf8'));

exports.languages = function() {
	console.log('Fetching translations...');
	for( var i = 0; i < resources.length; i++ ) {
		getResource(resources[i]);
	}
}

function loadSilently(path) {
	try {
		return fs.readFileSync(path, 'utf8');
	} catch (e) {
		return null;
	}
}

function getResource(res) {
    var resource = project + 'resource/' + res + '/';
    getLanguages(resource, function(err, codes) {
        if (err) return callback(err);

        asyncMap(codes, getLanguage(resource), function(err, results) {
            if (err) return callback(err);

            results.forEach(function(result, j) {
				if( !Object.keys(result).length )
					return;
				var lang = codes[j];
				var fn = 'dist/lang/' + lang + (res === 'core' ? '' : '.' + res) + '.js';
				var strings = JSON.stringify(result, null, 4);
				strings = 'window.' + classes[res] + '.include({ strings: ' + strings + '});';
				var oldLang = loadSilently(fn);
				if( oldLang !== strings ) {
					console.log(res + ' ' + lang);
					fs.writeFileSync(fn, strings);
				}
				if( lang === 'en' ) {
					var fn2 = 'src/strings/English' + (res === 'core' ? '' : '.Config') + '.js';
					fs.writeFileSync(fn2, strings);
				}
            });
        });
    });
}

function getLanguage(resource) {
    return function(code, callback) {
        var url = resource + 'translation/' + code;
        request.get(url, { auth : auth }, function(err, resp, body) {
            if (err) return callback(err);
            callback(null, yaml.load(JSON.parse(body).content)[code]);
        });
    };
}

function getLanguages(resource, callback) {
    request.get(resource + '?details', { auth: auth }, function(err, resp, body) {
        if (err) return callback(err);
        callback(null, JSON.parse(body).available_languages.map(function(d) {
			return d.code;
		}));
    });
}

function asyncMap(inputs, func, callback) {
    var remaining = inputs.length,
        results = [],
        error;

    inputs.forEach(function(d, i) {
        func(d, function done(err, data) {
            if (err) error = err;
            results[i] = data;
            remaining --;
            if (!remaining) callback(error, results);
        });
    });
}
