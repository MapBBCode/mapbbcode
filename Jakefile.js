/*
MapBBCode building, testing and linting scripts.

To use, install Node, then run the following commands in the project root:

    npm install -g jake
    npm install

To check the code for errors and build MapBBCode from source, run "jake".
To run the tests, run "jake test".
*/

var build = require('./build/build.js'),
    langs = require('./build/update_locales.js');

desc('Check MapBBCode source for errors with JSHint');
task('lint', build.lint);

desc('Combine and compress MapBBCode source files');
task('build', ['lint'], build.build);

desc('Combine and compress MapBBCode configuration tool source files');
task('cfg', ['lint'], build.cfg);

desc('Update locales from Transifex');
task('lang', langs.languages);

//desc('Compress MapBBCode layerList and proprietary layers sources');
//task('layers', ['lint'], build.layers);

//desc('Run PhantomJS tests');
//task('test', ['lint'], build.test);

desc('Create archived package of MapBBCode and all dependencies');
task('pack', ['lang', 'build', 'cfg'], build.pack);

task('default', ['build', 'cfg']);
