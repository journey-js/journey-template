import Ractive from "lib/Ractive.js";
import journey from "lib/journey.js";

journey.on( "routeAbuseStart", function ( ) {
	Ractive.defaults.transitionsEnabled = false;
	console.log( "* Animation disabled" );
} );
journey.on( "routeAbuseEnd", function ( ) {
	Ractive.defaults.transitionsEnabled = true;
	console.log( "** Renabling animations" );
} );
