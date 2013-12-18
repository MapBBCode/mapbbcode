var fs = require('fs'),
    jshint = require('jshint'),
    UglifyJS = require('uglify-js'),

    deps = require('./deps.js').deps,
    hintrc = require('./hintrc.js').config;

function lintFiles(files) {

	var errorsFound = 0,
	    i, j, len, len2, src, errors, e;

	for (i = 0, len = files.length; i < len; i++) {

		jshint.JSHINT(fs.readFileSync(files[i], 'utf8'), hintrc, i ? {L: true} : null);
		errors = jshint.JSHINT.errors;

		for (j = 0, len2 = errors.length; j < len2; j++) {
			e = errors[j];
			console.log(files[i] + '\tline ' + e.line + '\tcol ' + e.character + '\t ' + e.reason);
		}

		errorsFound += len2;
	}

	return errorsFound;
}

function getFiles(options) {
	var memo = {},
	    opt = options || {},
	    comps;

	if (opt.compsBase32) {
		comps = parseInt(opt.compsBase32, 32).toString(2).split('');
		console.log('Managing dependencies...');
	}

	function addFiles(srcs) {
		for (var j = 0, len = srcs.length; j < len; j++) {
			memo[srcs[j]] = true;
		}
	}

	for (var i in deps) {
                if( !opt.allFiles && !comps ) {
			if( deps[i].noInclude )
				continue;
			if( (opt.configOnly && !deps[i].config) || (!opt.configOnly && deps[i].config) )
				continue;
                }

		if (comps) {
                        if (parseInt(comps.pop(), 2) === 1) {
                                console.log('\t* ' + i);
                                addFiles(deps[i].src);
                        } else {
                                console.log('\t  ' + i);
                        }
		} else {
			addFiles(deps[i].src);
		}
	}

	var files = [];

	for (var src in memo) {
		files.push('src/' + src);
	}

	return files;
}

exports.getFiles = getFiles;

exports.lint = function () {

	var files = getFiles({ allFiles: true });

	console.log('Checking for JS errors...');

	var errorsFound = lintFiles(files);

	if (errorsFound > 0) {
		console.log(errorsFound + ' error(s) found.\n');
		fail();
	} else {
		console.log('\tCheck passed');
	}
};


function getSizeDelta(newContent, oldContent) {
	if (!oldContent) {
		return 'new';
	}
	var newLen = newContent.replace(/\r\n?/g, '\n').length,
		oldLen = oldContent.replace(/\r\n?/g, '\n').length,
		delta = newLen - oldLen;

	return (delta >= 0 ? '+' : '') + delta;
}

function loadSilently(path) {
	try {
		return fs.readFileSync(path, 'utf8');
	} catch (e) {
		return null;
	}
}

function combineFiles(files) {
	var content = '';
	for (var i = 0, len = files.length; i < len; i++) {
		content += fs.readFileSync(files[i], 'utf8') + '\n\n';
	}
	return content;
}

function pad0(num) {
	return num >= 10 ? num : '0' + (num + '');
}

exports.build = function (compsBase32, buildName) {

	var files = getFiles({ compsBase32: compsBase32, configOnly: buildName === 'config' });

	console.log('Concatenating ' + files.length + ' files...');

	var date = new Date(), dateStr = pad0(date.getDate()) + '.' + pad0(date.getMonth() + 1) + '.' + date.getFullYear(),
	    copy = fs.readFileSync('src/copyright.js', 'utf8').replace(/\$\$DATE\$\$/g, dateStr),
	    intro = '(function (window, document, undefined) {\nvar L = window.L;\n',
	    outro = '}(window, document));',
	    pjson = require('../package.json'),
	    newSrc = copy + intro + combineFiles(files) + outro,
	    newSrc = newSrc.replace(/\$\$VERSION\$\$/g, pjson.version || 'dev'),

	    pathPart = 'dist/mapbbcode' + (buildName ? '-' + buildName : ''),
	    srcPath = pathPart + '-src.js',

	    oldSrc = loadSilently(srcPath),
	    srcDelta = getSizeDelta(newSrc, oldSrc);

	console.log('\tUncompressed size: ' + newSrc.length + ' bytes (' + srcDelta + ')');

	if (newSrc === oldSrc) {
		console.log('\tNo changes');
	} else {
		fs.writeFileSync(srcPath, newSrc);
		console.log('\tSaved to ' + srcPath);
	}

	console.log('Compressing...');

	var path = pathPart + '.js',
	    oldCompressed = loadSilently(path),
	    newCompressed = copy + UglifyJS.minify(newSrc, {
	        warnings: true,
	        fromString: true
	    }).code,
	    newCompressed = newCompressed.replace(/\$\$VERSION\$\$/g, pjson.version || 'dev'),
	    delta = getSizeDelta(newCompressed, oldCompressed);

	console.log('\tCompressed size: ' + newCompressed.length + ' bytes (' + delta + ')');

	if (newCompressed === oldCompressed) {
		console.log('\tNo changes');
	} else {
		fs.writeFileSync(path, newCompressed);
		console.log('\tSaved to ' + path);
	}
};

exports.cfg = function (compsBase32, buildName) {
    exports.build(compsBase32, 'config');
};

exports.layers = function () {
	console.log('Copying layers...');

	var path = 'src/layers',
		files = fs.readdirSync(path), i;

	for( i = 0; i < files.length; i++ ) {
		if( !/\.js$/.test(files[i]) )
			continue;
		if( files[i] == 'LayerList.js' )
			continue;
		var source = loadSilently(path + '/' + files[i]),
			dest = 'dist/' + (files[i] == 'LayerList.js' ? '' : 'proprietary/') + files[i],
			oldSource = loadSilently(dest);
		if( oldSource !== source ) {
			fs.writeFileSync(dest, source);
			console.log('Updated ' + files[i] + ' (' + getSizeDelta(source, oldSource) + ' bytes)');
		}
	}
};

// by compressing we only save 1k per file - not much enough
exports.layersCompress = function () {
	console.log('Compressing layers...');

	var copy = fs.readFileSync('src/copyright.js', 'utf8'),
		path = 'src/layers',
		files = fs.readdirSync(path), i, delta = 0;

	for( i = 0; i < files.length; i++ ) {
		if( !/\.js$/.test(files[i]) )
			continue;
		if( files[i] == 'LayerList.js' )
			continue;
		var source = loadSilently(path + '/' + files[i]),
			dest = 'dist/' + (files[i] == 'LayerList.js' ? '' : 'proprietary/') + files[i],
			oldCompressed = loadSilently(dest),
			compressed = copy + UglifyJS.minify(source, {
				warnings: true,
				fromString: true
			}).code;
		if( oldCompressed !== compressed ) {
			fs.writeFileSync(dest, compressed);
			console.log('Updated ' + files[i] + ' (' + getSizeDelta(compressed, oldCompressed) + ' bytes)');
		}
	}
};

exports.pack = function() {
    var jake = require('jake'),
        target = 'dist/target/',
        mapbb = target + 'mapbbcode/',
        archive = 'mapbbcode-latest.zip';
    var commands = [
        'mkdir -p ' + mapbb,
        'cp -r dist/lib/* ' + mapbb,
        'cat ' + mapbb + 'override.css dist/lib/leaflet.css > ' + mapbb + 'leaflet.css',
		'rm ' + mapbb + 'override.css',
        'cp -r dist/lang ' + mapbb,
        'cp -r src/layers ' + mapbb + 'proprietary',
        'mv ' + mapbb + 'proprietary/LayerList.js ' + mapbb,
        'cp src/handlers/Handler.Length.js ' + mapbb,
        'cp dist/mapbbcode.js ' + mapbb,
        'cp dist/mapbbcode-config.js ' + mapbb,
        'cp dist/mapbbcode-window.html ' + mapbb,
        'rm -f dist/' + archive,
        'cd ' + target + '; zip -r ../' + archive + ' *',
        'rm -r ' + target
    ];
	console.log('Creating ' + archive + '...');
    jake.exec(commands);
};
