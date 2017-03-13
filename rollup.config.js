import buble from 'rollup-plugin-buble';

const pkg = require( './package.json' );

export default {
	//entry: 'src/test.es.js',
	entry: 'src/test.js',
	plugins: [ buble() ],
	moduleName: 'test',
	targets: [
		{ dest: pkg.main, format: 'iife' },
		{ dest: pkg.module, format: 'es' }
	]
};