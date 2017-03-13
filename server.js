var express = require( "express" );
var open = require( 'open' );
var chokidar = require( "chokidar" );
var fs = require( "fs-extra" );
var cmd = require('node-cmd');
 
 transpileJS();
watchAssets();
setupServer();

function transpileJS() {
	
	// start rollup to watch JS files
	cmd.run("rollup -c -w");
}

function watchAssets() {
	
	chokidar.watch( 'src/**/*', { ignored: [ 'src/**/*.js' ] } ).on( 'all', ( event, path ) => {
		console.log( event, path );
		var dest = path.replace( /^(src\\)/, "dist/" );
		console.log( "DEST", dest );
		fs.copySync( path, dest );
	} );

}


function setupServer() {
	
	var app = express();
	app.use( express.static( __dirname + "/dist" ) );
	app.listen( 9988 );
	open( 'http://localhost:9988/' );
}

