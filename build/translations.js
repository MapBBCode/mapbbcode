// Update translations from Transifex

var request = require('request'),
	yaml = require('js-yaml'),
	fs = require('fs');

var resources = { 'core': '', 'config': '.config' },
	target = 'dist/lang',
	project = 'http://www.transifex.com/api/2/project/mapbbcode/';

var auth = JSON.parse(fs.readFileSync('transifex.auth', 'utf8'));

for( var r in resources ) {
	var res = project + 'resource/' + r + '/';
}
