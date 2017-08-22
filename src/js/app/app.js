import journey from 'lib/journey.js';
import './config/routes.js';
import Ractive from "lib/Ractive.js";
import './config/animationMonitor.js';
import fade from 'lib/fade';

let contextPath = "/template/";

Ractive.transitions = {
	fade
};

journey.on( "entered", function ( options ) {
} );

journey.start( {
	target: "#main",
	debug: Ractive.DEBUG = true,
	fallback: '/notFound',
	base: contextPath,
	defaultRoute: '/home',
	useOnHashChange: false,
	useHash: true,
	hash: '#'
} );
