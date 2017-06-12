var buble = require( 'rollup-plugin-buble' );
var ractiveCompiler = require( 'rollup-plugin-ractive-compiler' );
var stringToModule = require( 'rollup-plugin-string' );
var includePaths = require( 'rollup-plugin-includepaths' );
var pkg = require( './package.json' );

// Set './src/js' as a relative path for imports in modules so we can do: 
// import myLib from 'lib/myLib.js' where 'src/js/lib/myLib.js' exists
let includePathOptions = {
	paths: [ './src/js' ]
};

module.exports = {

	entry: 'src/js/app/app.js', // app.js bootstraps our application.
	// app.js is referenced from index.html <script> tag
	
	// Ractive.js is loaded as an external library through index.html <script> tag. However
    // we want to import Ractive in our modules with: import Ractive fcrom 'Ractibe.js'.
    // So we inform Rollup that the 'Ractive.js' import is for an external library
	 external: [
		'Ractive.js'
	],

	plugins: [
		
		includePaths( includePathOptions ),

		// this plugin allows us to import Ractive templates and optionally compile them
		// for production use. We disable compile by default and switch it back on for
		// production in dist.js
		ractiveCompiler( {
			include: [ '**/*.html' ],

			compile: false
		} ),

		// this plugin allows us to import plain text/json files as ES6 Modules.
		// We configure this plugin to handle files with the pattern 'xxx.text.html'.
		stringToModule( {
			include: '**/*.text.html'
		} ),

		// Setup Buble plugin to transpiler ES6 to ES5
		buble( {
			exclude: [ '**/*.html' ] // Skip HTML files
		} ),
	],
	moduleName: 'myTemplate',

	targets: [
		{
			format: 'iife',
			banner: '/* journey-examples version ' + pkg.version + ' */',
			sourceMap: true // NB: generating a SourceMap allows us to debug
					// our code in the browser in it's original ES6 format.
		}
	]
};