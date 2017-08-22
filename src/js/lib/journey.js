/* journey version 0.0.4 */
var journey = (function () {
'use strict';

var window$1 = ( typeof window !== 'undefined' ? window : null );

var mode = {
	DEBUG: null
};

var util = {

	stripSearch: function (str) {
		var start = str.indexOf( '?' );

		if ( start >= 0 ) {
			str = str.substring( 0, start );
		}
		return str;
	},

	isUrl: function ( str ) {
		if ( str.indexOf( "://" ) >= 0 ) {
			return true;
		}
	},

	prefixWithBase: function ( str, base ) {

		// Cannot prefix a url with the base value: http://moo will become refixhttp://moo
		if ( util.isUrl( str ) ) {
			return str;
		}

		var index = str.indexOf( base );
		if ( index === 0 ) {
			return str;
		}

		// Guard against double '/' when base ends with '/' and str starts with '/'
		if ( base[base.length - 1] === '/' && str[0] === '/' ) {
			str = str.slice( 1 );
		}

		str = base + str;
		return str;
	},

	stripBase: function ( str, base ) {
		if ( str.indexOf( base ) === 0 ) {
			str = str.substr( base.length );
		}

		if ( str === '' ) {
			// Don't return an empty str, return '/' which is generally mapped
			return '/';
		}
		return str;
	},

	getLocationAsRelativeUrl: function () {
		var relUrl = window$1.location.pathname + window$1.location.search + window$1.location.hash || '';
		return relUrl;
	},

	useDefaultRoute: function ( path ) {
		if ( path == null )
			{ return true; }

		if ( path.length == 1 ) {

			if ( path[0] == '/' || path[0] == '#' ) {
				return true;
			}
		}

		return false;
	},

	extend: function ( out ) {
		var arguments$1 = arguments;

		out = out || { };
		for ( var i = 1; i < arguments.length; i ++ ) {
			if ( ! arguments$1[i] )
				{ continue; }
			for ( var key in arguments[i] ) {
				if ( arguments$1[i].hasOwnProperty( key ) )
					{ out[key] = arguments$1[i][key]; }
			}
		}

		return out;
	},
	

	log: function ( ) {
		if ( mode.DEBUG ) {
			Function.apply.call( console.log, console, arguments );
		}
	},
	logWarn: function ( ) {
		if ( mode.DEBUG ) {
			Function.apply.call( console.info, console, arguments );
		}
	},
	logInfo: function ( ) {
		if ( mode.DEBUG ) {
			Function.apply.call( console.warn, console, arguments );
		}
	},
	logError: function ( ) {
		if ( mode.DEBUG ) {
			Function.apply.call( console.error, console, arguments );
		}
	}
};

var config = {
	fallback: null,

	base: '',

	useHash: true,

	useOnHashChange: false,

	hash: '#',

	defaultRoute: null,

	target: null,
	
	debug: true,
	
	abuseTimeout: 1000
};

var pathHelper = {

	getGotoPath: function (href) {
		// TODO should this part be uncommented?
//		if ( config.useHash ) {
//			return href;
//		}
		
		href = pathHelper.stripSlashOrHashPrefix( href );
		return href;
	},

	getInitialPath: function () {
		var relUrl = config.useHash ? window$1.location.hash : util.getLocationAsRelativeUrl();
		var path = util.stripBase( relUrl, config.base );

		if ( config.defaultRoute && util.useDefaultRoute( path ) ) {
			path = config.defaultRoute || path;
		}

		if ( ! config.useHash ) {
			path = pathHelper.stripSlashOrHashPrefix( path );
		}

		return path;
	},

	stripSlashOrHashPrefix: function (str) {

		if ( str == null )
			{ return str; }
		str = str.trim( );
		if ( str[0] === '/' ) {
			str = str.slice( 1 );
		}

		if ( str.startsWith( config.hash ) ) {
			return str.slice( config.hash.length );
		}

		if ( str[0] === '#' ) {
			str = str.slice( 1 );
		}

		return str;
	},
	prefixWithHash: function (str) {
		if ( str.startsWith( config.hash ) ) {
			return str;
		}

		str = pathHelper.stripSlashOrHashPrefix( str );
		str = config.hash + str;
		return str;
	},
	prefixWithSlash: function prefixWithSlash( str ) {
// Cannot prefix a url with '/' else http://moo will become /http://moo
		if ( util.isUrl( str ) ) {
			return str;
		}

		if ( str[0] === '/' ) {
			return str;
		} else {
			str = pathHelper.stripSlashOrHashPrefix( str );
		}
		str = '/' + str;
		return str;
	}
};

var listener;

var watchHistory = {

	_ignoreHashChange: false,

	useOnHashChange: false,

	supportHistory:   !!(window$1.history && window$1.history.pushState),

	noop: function noop() {},

	start: function start( options ) {
		if ( options === void 0 ) options = {};


		watchHistory.useOnHashChange = watchHistory.shouldUseOnHashChange(options.useOnHashChange || false);
		watchHistory.listener = watchHistory.noop;

		watchHistory.startListening();
	},

	startListening: function startListening() {

		if (watchHistory.useOnHashChange) {
			window$1.addEventListener( 'hashchange', watchHistory.hashchangeEventLisener, false );

		} else {
			window$1.addEventListener( 'popstate', watchHistory.popstateEventLisener, false );
		}
	},
	
	shouldUseOnHashChange: function shouldUseOnHashChange(value) {
		// Use override if present
		if (value) {
			return true;
		}

		 if (watchHistory.supportHistory) {
			 return false;
		 }
		 return true;
	},

	popstateEventLisener: function popstateEventLisener( e ) {
		if ( e.state == null ) { return; } // hashchange, or otherwise outside journey's control

		//let url = location.pathname;
		var url = config.useHash ? window$1.location.hash : window$1.location.pathname;
		var options = {
			url: url,
			popEvent: e,
			popState: true // so we know not to update the url and create another history entry
		};
		listener(options);
	},

	hashchangeEventLisener: function hashchangeEventLisener( e ) {
		if (watchHistory._ignoreHashChange) {
			watchHistory._ignoreHashChange = false;
			return;
		}

		var url = location.hash;
		
		var options = {
			url: url,
			hashEvent: e,
			hashChange: true // so we know not to update the url and create another history entry
		};
		
		listener(options);
	},

	setListener: function setListener( callback ) {
		listener = callback;
	},
	
	setHash: function setHash(hash, options) {

		hash = options.invisible ? window$1.location.hash : hash;

		if (options.replaceState) {
			location.replace(hash);

		} else {
			// updating the hash will fire a hashchange event but we only want to respond to hashchange events when the history pops, not pushed
			watchHistory._ignoreHashChange = true;
			window$1.location.hash = hash;
		}
	}
};

var a = typeof document !== 'undefined' && document.createElement( 'a' );
var QUERYPAIR_REGEX = /^([\w\-]+)(?:=([^&]*))?$/;
var HANDLERS = [ 'beforeleave', 'beforeenter', 'enter', 'leave', 'update' ];

var isInitial = true;

function RouteData( ref ) {
	var route = ref.route;
	var pathname = ref.pathname;
	var params = ref.params;
	var query = ref.query;
	var hash = ref.hash;
	var scrollX = ref.scrollX;
	var scrollY = ref.scrollY;

	this.pathname = pathname;
	this.params = params;
	this.query = query;
	this.hash = hash;
	this.isInitial = isInitial;
	this.scrollX = scrollX;
	this.scrollY = scrollY;

	this._route = route;

	isInitial = false;
}

RouteData.prototype = {
	matches: function matches( href ) {
		return this._route.matches( href );
	}
};

function Route( path, options ) {
	var this$1 = this;

	path = pathHelper.stripSlashOrHashPrefix(path);

	this.path = path;
	this.segments = path.split( '/' );

	if ( typeof options === 'function' ) {
		options = {
			enter: options
		};
	}

	this.updateable = typeof options.update === 'function';

	HANDLERS.forEach( function (handler) {
		this$1[ handler ] = function ( route, other, opts ) {
			var value;

			if ( options[ handler ] ) {
				value = options[ handler ]( route, other, opts );
			}

			return journey.Promise.resolve( value );
		};
	} );
}

Route.prototype = {
	matches: function matches( href ) {
		a.href = pathHelper.prefixWithSlash(href); // This works for the options useHash: false + contextPath: true

		var pathname = a.pathname.slice( 1 );
		var segments = pathname.split( '/' );

		return segmentsMatch( segments, this.segments );
	},

	exec: function exec( target ) {
		var this$1 = this;

		a.href = target.href;

		var pathname = a.pathname;
		pathname = pathHelper.stripSlashOrHashPrefix(pathname);
		var search = a.search.slice( 1 );

		var segments = pathname.split( '/' );

		if ( segments.length !== this.segments.length ) {
			return false;
		}

		var params = { };

		for ( var i = 0; i < segments.length; i += 1 ) {
			var segment = segments[i];
			var toMatch = this$1.segments[i];

			if ( toMatch[0] === ':' ) {
				params[ toMatch.slice( 1 ) ] = segment;
			} else if ( segment !== toMatch ) {
				return false;
			}
		}

		var query = { };
		var queryPairs = search.split( '&' );

		for ( var i$1 = 0; i$1 < queryPairs.length; i$1 += 1 ) {
			var match = QUERYPAIR_REGEX.exec( queryPairs[i$1] );

			if ( match ) {
				var key = match[1];
				var value = decodeURIComponent( match[2] );

				if ( query.hasOwnProperty( key ) ) {
					if ( typeof query[ key ] !== 'object' ) {
						query[ key ] = [ query[ key ] ];
					}

					query[ key ].push( value );
				} else {
					query[ key ] = value;
				}
			}
		}

		return new RouteData( {
			route: this,
			pathname: pathname,
			params: params,
			query: query,
			hash: a.hash.slice( 1 ),
			scrollX: target.scrollX,
			scrollY: target.scrollY
		} );
	}
};

function segmentsMatch( a, b ) {
	if ( a.length !== b.length )
		{ return; }

	var i = a.length;
	while ( i -- ) {
		if ( ( a[i] !== b[i] ) && ( b[i][0] !== ':' ) ) {
			return false;
		}
	}

	return true;
}

//
//const skip = [ "isInitial", "_route", "pathname", "params", "query", "hash" ];
//
//RouteData.prototype.extend = function ( src ) {
//	for ( var nextKey in src ) {
//		if ( src.hasOwnProperty( nextKey ) ) {
//
//			if ( skip.indexOf( nextKey ) < 0 ) {
//				this[nextKey] = src[nextKey];
//			}
//		}
//	}
//	return this;
//};


RouteData.prototype.extend = function( target ) {
	var arguments$1 = arguments;

	var output = Object( target );

	for ( var i = 1; i < arguments.length; i++ ) {
		var src = arguments$1[i];
		if ( src === undefined || src === null )
			{ continue; }
		for ( var nextKey in src ) {
			if ( src.hasOwnProperty( nextKey ) ) {
				output[nextKey] = src[nextKey];
			}
		}
	}
	return output;
};

var routes = [];

// Adapted from https://github.com/visionmedia/page.js
// MIT license https://github.com/visionmedia/page.js#license

function watchLinks ( callback ) {
	window$1.addEventListener( 'click', handler, false );
	window$1.addEventListener( 'touchstart', handler, false );

	function handler ( event ) {
		if ( which( event ) !== 1 ) { return; }
		if ( event.metaKey || event.ctrlKey || event.shiftKey ) { return; }
		if ( event.defaultPrevented ) { return; }

		// ensure target is a link
		var el = event.target;
		while ( el && el.nodeName !== 'A' ) {
			el = el.parentNode;
		}

		if ( !el || el.nodeName !== 'A' ) { return; }

		// Ignore if tag has
		// 1. 'download' attribute
		// 2. rel='external' attribute
		if ( el.hasAttribute( 'download' ) || el.getAttribute( 'rel' ) === 'external' ) { return; }

		// ensure non-hash for the same path

		// Check for mailto: in the href
		if ( ~el.href.indexOf( 'mailto:' ) ) { return; }

		// check target
		if ( el.target ) { return; }

		// x-origin
		if ( !sameOrigin( el.href ) ) { return; }

		var path;

		if (config.useHash) {
			path = toHash(el);

		} else {
		path = el.getAttribute('href');
		
		// below is original code which builds up path from the a.href property. Above we instead simply use the <a href> attribute
		//path = el.pathname + el.search + ( el.hash || '' );
		}

		// strip leading '/[drive letter]:' on NW.js on Windows
		if ( typeof process !== 'undefined' && path.match( /^\/[a-zA-Z]:\// ) ) {
			path = path.replace( /^\/[a-zA-Z]:\//, '/' );
		}

		// same page
		//const orig = path;

		/*
		if ( config.base && orig === path ) {
			return;
		}*/

		path = util.stripBase(path, config.base);

		// no match? allow navigation
		var matchFound = routes.some( function (route) { return route.matches( path ); } );

		if ( matchFound ) {
			event.preventDefault();

			//path = util.prefixWithBase(path, config.base);
			callback( path );
		}

		return;
	}
}

function toHash(link) {
	var href = link.getAttribute('href');
	href = pathHelper.prefixWithHash(href);
	return href;
}

function which ( event ) {
	event = event || window$1.event;
	return event.which === null ? event.button : event.which;
}

function sameOrigin ( href ) {
	var origin = location.protocol + '//' + location.hostname;
	if ( location.port ) { origin += ':' + location.port; }

	return ( href && ( href.indexOf( origin ) === 0 ) );
}

function isSameRoute ( routeA, routeB, dataA, dataB ) {
	if ( routeA !== routeB ) {
		return false;
	}

	return (
		dataA.hash === dataB.hash &&
		deepEqual( dataA.params, dataB.params ) &&
		deepEqual( dataA.query, dataB.query )
	);
}

function deepEqual ( a, b ) {
	if ( a === null && b === null ) {
		return true;
	}

	if ( isArray( a ) && isArray( b ) ) {
		var i = a.length;

		if ( b.length !== i ) { return false; }

		while ( i-- ) {
			if ( !deepEqual( a[i], b[i] ) ) {
				return false;
			}
		}

		return true;
	}

	else if ( typeof a === 'object' && typeof b === 'object' ) {
		var aKeys = Object.keys( a );
		var bKeys = Object.keys( b );

		var i$1 = aKeys.length;

		if ( bKeys.length !== i$1 ) { return false; }

		while ( i$1-- ) {
			var key = aKeys[i$1];

			if ( !b.hasOwnProperty( key ) || !deepEqual( b[ key ], a[ key ] ) ) {
				return false;
			}
		}

		return true;
	}

	return a === b;
}

var toString = Object.prototype.toString;

function isArray ( thing ) {
	return toString.call( thing ) === '[object Array]';
}

/*!
 * EventEmitter v4.2.11 - git.io/ee
 * https://github.com/Olical/EventEmitter
 * Unlicense - http://unlicense.org/
 * Oliver Caldwell - http://oli.me.uk/
 * @preserve
 */

    /**
     * Class for managing events.
     * Can be extended to provide event functionality in other classes.
     *
     * @class EventEmitter Manages event registering and emitting.
     */
    function EventEmitter() {}

    // Shortcuts to improve speed and size
    var proto = EventEmitter.prototype;

    /**
     * Finds the index of the listener for the event in its storage array.
     *
     * @param {Function[]} listeners Array of listeners to search through.
     * @param {Function} listener Method to look for.
     * @return {Number} Index of the specified listener, -1 if not found
     * @api private
     */
    function indexOfListener(listeners, listener) {
        var i = listeners.length;
        while (i--) {
            if (listeners[i].listener === listener) {
                return i;
            }
        }

        return -1;
    }

    /**
     * Alias a method while keeping the context correct, to allow for overwriting of target method.
     *
     * @param {String} name The name of the target method.
     * @return {Function} The aliased method
     * @api private
     */
    function alias(name) {
        return function aliasClosure() {
            return this[name].apply(this, arguments);
        };
    }

    /**
     * Returns the listener array for the specified event.
     * Will initialise the event object and listener arrays if required.
     * Will return an object if you use a regex search. The object contains keys for each matched event. So /ba[rz]/ might return an object containing bar and baz. But only if you have either defined them with defineEvent or added some listeners to them.
     * Each property in the object response is an array of listener functions.
     *
     * @param {String|RegExp} evt Name of the event to return the listeners from.
     * @return {Function[]|Object} All listener functions for the event.
     */
    proto.getListeners = function getListeners(evt) {
        var events = this._getEvents();
        var response;
        var key;

        // Return a concatenated array of all matching events if
        // the selector is a regular expression.
        if (evt instanceof RegExp) {
            response = {};
            for (key in events) {
                if (events.hasOwnProperty(key) && evt.test(key)) {
                    response[key] = events[key];
                }
            }
        }
        else {
            response = events[evt] || (events[evt] = []);
        }

        return response;
    };

    /**
     * Takes a list of listener objects and flattens it into a list of listener functions.
     *
     * @param {Object[]} listeners Raw listener objects.
     * @return {Function[]} Just the listener functions.
     */
    proto.flattenListeners = function flattenListeners(listeners) {
        var flatListeners = [];
        var i;

        for (i = 0; i < listeners.length; i += 1) {
            flatListeners.push(listeners[i].listener);
        }

        return flatListeners;
    };

    /**
     * Fetches the requested listeners via getListeners but will always return the results inside an object. This is mainly for internal use but others may find it useful.
     *
     * @param {String|RegExp} evt Name of the event to return the listeners from.
     * @return {Object} All listener functions for an event in an object.
     */
    proto.getListenersAsObject = function getListenersAsObject(evt) {
        var listeners = this.getListeners(evt);
        var response;

        if (listeners instanceof Array) {
            response = {};
            response[evt] = listeners;
        }

        return response || listeners;
    };

    /**
     * Adds a listener function to the specified event.
     * The listener will not be added if it is a duplicate.
     * If the listener returns true then it will be removed after it is called.
     * If you pass a regular expression as the event name then the listener will be added to all events that match it.
     *
     * @param {String|RegExp} evt Name of the event to attach the listener to.
     * @param {Function} listener Method to be called when the event is emitted. If the function returns true then it will be removed after calling.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.addListener = function addListener(evt, listener) {
        var listeners = this.getListenersAsObject(evt);
        var listenerIsWrapped = typeof listener === 'object';
        var key;

        for (key in listeners) {
            if (listeners.hasOwnProperty(key) && indexOfListener(listeners[key], listener) === -1) {
                listeners[key].push(listenerIsWrapped ? listener : {
                    listener: listener,
                    once: false
                });
            }
        }

        return this;
    };

    /**
     * Alias of addListener
     */
    proto.on = alias('addListener');

    /**
     * Semi-alias of addListener. It will add a listener that will be
     * automatically removed after its first execution.
     *
     * @param {String|RegExp} evt Name of the event to attach the listener to.
     * @param {Function} listener Method to be called when the event is emitted. If the function returns true then it will be removed after calling.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.addOnceListener = function addOnceListener(evt, listener) {
        return this.addListener(evt, {
            listener: listener,
            once: true
        });
    };

    /**
     * Alias of addOnceListener.
     */
    proto.once = alias('addOnceListener');

    /**
     * Defines an event name. This is required if you want to use a regex to add a listener to multiple events at once. If you don't do this then how do you expect it to know what event to add to? Should it just add to every possible match for a regex? No. That is scary and bad.
     * You need to tell it what event names should be matched by a regex.
     *
     * @param {String} evt Name of the event to create.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.defineEvent = function defineEvent(evt) {
        this.getListeners(evt);
        return this;
    };

    /**
     * Uses defineEvent to define multiple events.
     *
     * @param {String[]} evts An array of event names to define.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.defineEvents = function defineEvents(evts) {
        var this$1 = this;

        for (var i = 0; i < evts.length; i += 1) {
            this$1.defineEvent(evts[i]);
        }
        return this;
    };

    /**
     * Removes a listener function from the specified event.
     * When passed a regular expression as the event name, it will remove the listener from all events that match it.
     *
     * @param {String|RegExp} evt Name of the event to remove the listener from.
     * @param {Function} listener Method to remove from the event.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.removeListener = function removeListener(evt, listener) {
		if (listener == null) {
			return this.removeEvent(evt);
		}
        var listeners = this.getListenersAsObject(evt);
        var index;
        var key;

        for (key in listeners) {
            if (listeners.hasOwnProperty(key)) {
                index = indexOfListener(listeners[key], listener);

                if (index !== -1) {
                    listeners[key].splice(index, 1);
                }
            }
        }

        return this;
    };

    /**
     * Alias of removeListener
     */
    proto.off = alias('removeListener');

    /**
     * Adds listeners in bulk using the manipulateListeners method.
     * If you pass an object as the second argument you can add to multiple events at once. The object should contain key value pairs of events and listeners or listener arrays. You can also pass it an event name and an array of listeners to be added.
     * You can also pass it a regular expression to add the array of listeners to all events that match it.
     * Yeah, this function does quite a bit. That's probably a bad thing.
     *
     * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to add to multiple events at once.
     * @param {Function[]} [listeners] An optional array of listener functions to add.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.addListeners = function addListeners(evt, listeners) {
        // Pass through to manipulateListeners
        return this.manipulateListeners(false, evt, listeners);
    };

    /**
     * Removes listeners in bulk using the manipulateListeners method.
     * If you pass an object as the second argument you can remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
     * You can also pass it an event name and an array of listeners to be removed.
     * You can also pass it a regular expression to remove the listeners from all events that match it.
     *
     * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to remove from multiple events at once.
     * @param {Function[]} [listeners] An optional array of listener functions to remove.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.removeListeners = function removeListeners(evt, listeners) {
        // Pass through to manipulateListeners
        return this.manipulateListeners(true, evt, listeners);
    };

    /**
     * Edits listeners in bulk. The addListeners and removeListeners methods both use this to do their job. You should really use those instead, this is a little lower level.
     * The first argument will determine if the listeners are removed (true) or added (false).
     * If you pass an object as the second argument you can add/remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
     * You can also pass it an event name and an array of listeners to be added/removed.
     * You can also pass it a regular expression to manipulate the listeners of all events that match it.
     *
     * @param {Boolean} remove True if you want to remove listeners, false if you want to add.
     * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to add/remove from multiple events at once.
     * @param {Function[]} [listeners] An optional array of listener functions to add/remove.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.manipulateListeners = function manipulateListeners(remove, evt, listeners) {
        var this$1 = this;

        var i;
        var value;
        var single = remove ? this.removeListener : this.addListener;
        var multiple = remove ? this.removeListeners : this.addListeners;

        // If evt is an object then pass each of its properties to this method
        if (typeof evt === 'object' && !(evt instanceof RegExp)) {
            for (i in evt) {
                if (evt.hasOwnProperty(i) && (value = evt[i])) {
                    // Pass the single listener straight through to the singular method
                    if (typeof value === 'function') {
                        single.call(this$1, i, value);
                    }
                    else {
                        // Otherwise pass back to the multiple function
                        multiple.call(this$1, i, value);
                    }
                }
            }
        }
        else {
            // So evt must be a string
            // And listeners must be an array of listeners
            // Loop over it and pass each one to the multiple method
            i = listeners.length;
            while (i--) {
                single.call(this$1, evt, listeners[i]);
            }
        }

        return this;
    };

    /**
     * Removes all listeners from a specified event.
     * If you do not specify an event then all listeners will be removed.
     * That means every event will be emptied.
     * You can also pass a regex to remove all events that match it.
     *
     * @param {String|RegExp} [evt] Optional name of the event to remove all listeners for. Will remove from every event if not passed.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.removeEvent = function removeEvent(evt) {
        var type = typeof evt;
        var events = this._getEvents();
        var key;

        // Remove different things depending on the state of evt
        if (type === 'string') {
            // Remove all listeners for the specified event
            delete events[evt];
        }
        else if (evt instanceof RegExp) {
            // Remove all events matching the regex.
            for (key in events) {
                if (events.hasOwnProperty(key) && evt.test(key)) {
                    delete events[key];
                }
            }
        }
        else {
            // Remove all listeners in all events
            delete this._events;
        }

        return this;
    };

    /**
     * Alias of removeEvent.
     *
     * Added to mirror the node API.
     */
    proto.removeAllListeners = alias('removeEvent');

    /**
     * Emits an event of your choice.
     * When emitted, every listener attached to that event will be executed.
     * If you pass the optional argument array then those arguments will be passed to every listener upon execution.
     * Because it uses `apply`, your array of arguments will be passed as if you wrote them out separately.
     * So they will not arrive within the array on the other side, they will be separate.
     * You can also pass a regular expression to emit to all events that match it.
     *
     * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
     * @param {Array} [args] Optional array of arguments to be passed to each listener.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.emitEvent = function emitEvent(that, evt, args) {
        var this$1 = this;

		// NOTE: customized this method
        var listenersMap = this.getListenersAsObject(evt);
        var listeners;
        var listener;
        var i;
        var key;
        var response;

        for (key in listenersMap) {
            if (listenersMap.hasOwnProperty(key)) {
                listeners = listenersMap[key].slice(0);
                i = listeners.length;

                while (i--) {
                    // If the listener returns true then it shall be removed from the event
                    // The function is executed either with a basic call or an apply if there is an args array
                    listener = listeners[i];

                    if (listener.once === true) {
                        this$1.removeListener(evt, listener.listener);
                    }

                    response = listener.listener.apply(that, args || []);

                    if (response === this$1._getOnceReturnValue()) {
                        this$1.removeListener(evt, listener.listener);
                    }
                }
            }
        }

        return this;
    };

    /**
     * Alias of emitEvent
     */
    proto.trigger = alias('emitEvent');

    /**
     * Subtly different from emitEvent in that it will pass its arguments on to the listeners, as opposed to taking a single array of arguments to pass on.
     * As with emitEvent, you can pass a regex in place of the event name to emit to all events that match it.
     *
     * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
     * @param {...*} Optional additional arguments to be passed to each listener.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.emit = function emit(that, evt) {
		// NOTE: customized this method
        var args = Array.prototype.slice.call(arguments, 2);
        return this.emitEvent(that, evt, args);
    };

    /**
     * Sets the current value to check against when executing listeners. If a
     * listeners return value matches the one set here then it will be removed
     * after execution. This value defaults to true.
     *
     * @param {*} value The new value to check for when executing listeners.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.setOnceReturnValue = function setOnceReturnValue(value) {
        this._onceReturnValue = value;
        return this;
    };

    /**
     * Fetches the current value to check against when executing listeners. If
     * the listeners return value matches this one then it should be removed
     * automatically. It will return true by default.
     *
     * @return {*|Boolean} The current value to check for or the default, true.
     * @api private
     */
    proto._getOnceReturnValue = function _getOnceReturnValue() {
        if (this.hasOwnProperty('_onceReturnValue')) {
            return this._onceReturnValue;
        }
        else {
            return true;
        }
    };

    /**
     * Fetches the events object and creates one if required.
     *
     * @return {Object} The events storage object.
     * @api private
     */
    proto._getEvents = function _getEvents() {
        return this._events || (this._events = {});
    };

    if (typeof module === 'object' && module.exports) {
        module.exports = EventEmitter;
    }

var events = {
	BEFORE_LEAVE: "beforeleave",
	BEFORE_LEAVE_COMPLETE: "beforeleaveComplete",
	BEFORE_ENTER: "beforeenter",
	BEFORE_ENTER_COMPLETE: "beforeenterComplete",
	ENTER: "enter",	
	ENTERED: "entered",
	UPDATE: "update",
	UPDATED: "updated",
	LEAVE: "leave",
	LEFT: "left",
	TRANSITION_ABORTED: "transitionAborted",
	ROUTE_ABUSE_START: "routeAbuseStart",
	ROUTE_ABUSE_STOP: "routeAbuseStop",
	_GOTO: "_goto",
	ERROR: "error"
};

var eventer = new EventEmitter();

var journey$2;

var origEmit = eventer.emit;

eventer.emit = function ( that ) {
	if ( typeof that === 'string' ) {
		var args = Array.prototype.slice.call( arguments );
		args.unshift( journey$2 );
		return origEmit.apply( this, args );
	}
	origEmit.apply( this, arguments );
};

eventer.init = function ( arg ) {
	journey$2 = arg;
};

eventer.raiseError = function ( options ) {
	util.logError( options.error );
	journey$2.emit( journey$2, events.ERROR, options );
};

var journey$3;

var handler = {

	init: function init( arg ) {
		journey$3 = arg;
	},

	update: function update( newRoute, newData, target ) {

		// For updates, merge newData into currentData, in order to preserve custom data that was set during enter or beforeenter events
		newData = util.extend( target.currentData, newData );
		var handlerOptions = handler.getDefaultOptions( newRoute );
		var eventOptions = { route: newData, from: null, to: null, options: handlerOptions };

		try {
			eventer.emit( events.UPDATE, eventOptions );

			var result = newRoute.update( newData, handlerOptions );

			var promise = journey$3.Promise.all( [ result ] ); // Ensure handler result can be handled as promise

			promise.then( function () {
				// Update currentRoute *after* update resolves
				journey$3._updateCurrentRoute( target, newRoute, newData );

				eventer.emit( journey$3, events.UPDATED, eventOptions );

			} ).catch( function (err) {
				var options = handler.gatherErrorOptions( events.UPDATE, newRoute, null, null, err );
				eventer.raiseError( options );
			} );

			return promise;

		} catch ( err ) {
			var options = handler.gatherErrorOptions( events.UPDATE, newRoute, null, null, err );
			eventer.raiseError( options );
			return journey$3.Promise.reject( "error occurred in [" + events.UPDATE + "] - " + err.message ); // let others handle further up the stack
		}
	},

	enter: function enter( newRoute, newData, target ) {
		
		var handlerOptions = handler.getDefaultOptions( newRoute );
		var eventOptions = { from: target.currentData, to: newData, options: handlerOptions };

		try {
			eventer.emit( events.ENTER, eventOptions );

			var result = newRoute.enter( newData, target.currentData, handlerOptions );

			var promise = journey$3.Promise.all( [ result ] ); // Ensure handler result can be handled as promise

			promise.then( function () {
				eventer.emit( journey$3, events.ENTERED, eventOptions );

			} ).catch( function (err) {
				var options = handler.gatherErrorOptions( events.ENTER, target.currentRoute, target.currentData, newData, err );
				eventer.raiseError( options );
			} );

			return promise;

		} catch ( err ) {
			var options = handler.gatherErrorOptions( events.ENTER, target.currentRoute, null, null, err );
			eventer.raiseError( options );
			return journey$3.Promise.reject( "error occurred in [" + events.ENTER + "] - " + err.message ); // let others handle further up the stack

		}
	},

	beforeenter: function beforeenter( newRoute, newData, target ) {
		
		var handlerOptions = handler.getDefaultOptions( newRoute );
		var eventOptions = { from: target.currentData, to: newData, options: handlerOptions };

		try {
			eventer.emit( events.BEFORE_ENTER, eventOptions );

			var result = newRoute.beforeenter( newData, target.currentData, handlerOptions );

			var promise = journey$3.Promise.all( [ result ] ); // Ensure handler result can be handled as promise

			promise.then( function () {

				eventer.emit( journey$3, events.BEFORE_ENTER_COMPLETE, eventOptions );

			} ).catch( function (err) {
				var options = handler.gatherErrorOptions( events.BEFORE_ENTER, target.currentRoute, target.currentData, newData, err );
				eventer.raiseError( options );
			} );

			return promise;

		} catch ( err ) {
			var options = handler.gatherErrorOptions( events.BEFORE_ENTER, target.currentRoute, null, null, err );
			eventer.raiseError( options );
			return journey$3.Promise.reject( "error occurred in [" + events.BEFORE_ENTER + "] - " + err.message ); // let others handle further up the stack
		}
	},

	beforeleave: function beforeleave( newRoute, newData, target ) {

		var handlerOptions = handler.getDefaultOptions( target.currentRoute );
		var eventOptions = { from: target.currentData, to: newData, options: handlerOptions };

		try {
			eventer.emit( events.BEFORE_LEAVE, eventOptions );

			var result = target.currentRoute.beforeleave( target.currentData, newData, handlerOptions );

			var promise = journey$3.Promise.all( [ result ] ); // Ensure handler result can be handled as promise

			promise.then( function () {

				eventer.emit( journey$3, events.BEFORE_LEAVE_COMPLETE, eventOptions );

			} ).catch( function (err) {
				var options = handler.gatherErrorOptions( events.BEFORE_LEAVE, target.currentRoute, target.currentData, newData, err );
				eventer.raiseError( options );
			} );

			return promise;

		} catch ( err ) {
			var options = handler.gatherErrorOptions( events.BEFORE_LEAVE, target.currentRoute, null, null, err );
			eventer.raiseError( options );
			return journey$3.Promise.reject( "error occurred in [" + events.BEFORE_LEAVE + "] - " + err.message ); // let others handle further up the stack

		}
	},

	leave: function leave( newRoute, newData, target ) {

		var handlerOptions = handler.getDefaultOptions( target.currentRoute );
		var eventOptions = { from: target.currentData, to: newData, options: handlerOptions };

		try {
			eventer.emit( events.LEAVE, eventOptions );

			var result = target.currentRoute.leave( target.currentData, newData, handlerOptions );
			var promise = journey$3.Promise.all( [ result ] ); // Ensure handler result can be handled as promise

			promise.then( function () {
				// Update currentRoute *after* leave resolves
				journey$3._updateCurrentRoute( target, newRoute, newData );

				eventer.emit( journey$3, events.LEFT, eventOptions );

			} ).catch( function (err) {
				var options = handler.gatherErrorOptions( events.LEAVE, target.currentRoute, target.currentData, newData, err );
				eventer.raiseError( options );
			} );

			return promise;

		} catch ( err ) {
			var options = handler.gatherErrorOptions( events.LEAVE, target.currentRoute, null, null, err );
			eventer.raiseError( options );
			return journey$3.Promise.reject( "error occurred in [" + events.LEAVE + "] - " + err.message ); // let others handle further up the stack

		}
	}
};

handler.getDefaultOptions = function( route ) {
	var options = { };
	options.target = config.target;
	return options;
};

handler.gatherErrorOptions = function( handlerName, route, to, from, err ) {

	var errorOptions = { error: err, event: handlerName, from: from, to: to, route: route };

	var options = handler.getDefaultOptions( route );

	errorOptions.options = options;
	return errorOptions;
};

// from https://developer.mozilla.org/en/docs/Web/API/WindowEventHandlers/onhashchange
if ( ! window.HashChangeEvent )
	{ ( function () {

		var lastURL = document.URL;

		window.addEventListener( "hashchange", function ( event ) {
			Object.defineProperty( event, "oldURL", { enumerable: true, configurable: true, value: lastURL } );
			Object.defineProperty( event, "newURL", { enumerable: true, configurable: true, value: document.URL } );

			lastURL = document.URL;
		} );
	}() ); }


if ( ! String.prototype.startsWith ) {
	String.prototype.startsWith = function ( searchString, position ) {
		position = position || 0;
		return this.substr( position, searchString.length ) === searchString;
	};
}

if ( ! String.prototype.endsWith ) {
	String.prototype.endsWith = function ( searchString, position ) {
		var subjectString = this.toString();
		if ( typeof position !== 'number' || ! isFinite( position ) || Math.floor( position ) !== position || position > subjectString.length ) {
			position = subjectString.length;
		}
		position -= searchString.length;
		var lastIndex = subjectString.lastIndexOf( searchString, position );
		return lastIndex !== - 1 && lastIndex === position;
	};
}

// Promise
// TODO: Better global attachment
if ( window && ! window.Promise ) {
	var PENDING = { };
	var FULFILLED = { };
	var REJECTED = { };

	var Promise$1 = window.Promise = function ( callback ) {
		var fulfilledHandlers = [ ];
		var rejectedHandlers = [ ];
		var state = PENDING;
		var result;
		var dispatchHandlers;

		var makeResolver = function ( newState ) {
			return function ( value ) {
				if ( state !== PENDING ) {
					return;
				}
				result = value;
				state = newState;
				dispatchHandlers = makeDispatcher( ( state === FULFILLED ? fulfilledHandlers : rejectedHandlers ), result );
				wait( dispatchHandlers );
			};
		};

		var fulfill = makeResolver( FULFILLED );
		var reject = makeResolver( REJECTED );

		try {
			callback( fulfill, reject );
		} catch ( err ) {
			reject( err );
		}

		return {
			// `then()` returns a Promise - 2.2.7
			then: function then( onFulfilled, onRejected ) {
				var promise2 = new Promise$1( function ( fulfill, reject ) {

					var processResolutionHandler = function ( handler, handlers, forward ) {
						if ( typeof handler === 'function' ) {
							handlers.push( function ( p1result ) {
								try {
									resolve( promise2, handler( p1result ), fulfill, reject );
								} catch ( err ) {
									reject( err );
								}
							} );
						} else {
							handlers.push( forward );
						}
					};

					processResolutionHandler( onFulfilled, fulfilledHandlers, fulfill );
					processResolutionHandler( onRejected, rejectedHandlers, reject );

					if ( state !== PENDING ) {
						wait( dispatchHandlers );
					}

				} );
				return promise2;
			},
			'catch': function catch$1( onRejected ) {
				return this.then( null, onRejected );
			}
		};
	};

	Promise$1.all = function ( promises ) {
		return new Promise$1( function ( fulfil, reject ) {
			var result = [ ];
			var pending;
			var i;

			if ( ! promises.length ) {
				fulfil( result );
				return;
			}

			var processPromise = function ( promise, i ) {
				if ( promise && typeof promise.then === 'function' ) {
					promise.then( function ( value ) {
						result[i] = value;
						-- pending || fulfil( result );
					}, reject );
				} else {
					result[i] = promise;
					-- pending || fulfil( result );
				}
			};

			pending = i = promises.length;

			while ( i -- ) {
				processPromise( promises[i], i );
			}
		} );
	};

	Promise$1.resolve = function ( value ) {
		return new Promise$1( function ( fulfill ) {
			fulfill( value );
		} );
	};

	Promise$1.reject = function ( reason ) {
		return new Promise$1( function ( fulfill, reject ) {
			reject( reason );
		} );
	};

	// TODO use MutationObservers or something to simulate setImmediate
	var wait = function ( callback ) {
		setTimeout( callback, 0 );
	};

	var makeDispatcher = function ( handlers, result ) {
		return function () {
			for ( var handler = ( void 0 ); handler = handlers.shift(); ) {
				handler( result );
			}
		};
	};

	var resolve = function ( promise, x, fulfil, reject ) {
		var then;
		if ( x === promise ) {
			throw new TypeError( "A promise's fulfillment handler cannot return the same promise" );
		}
		if ( x instanceof Promise$1 ) {
			x.then( fulfil, reject );
		} else if ( x && ( typeof x === 'object' || typeof x === 'function' ) ) {
			try {
				then = x.then;
			} catch ( e ) {
				reject( e );
				return;
			}
			if ( typeof then === 'function' ) {
				var called;

				var resolvePromise = function ( y ) {
					if ( called ) {
						return;
					}
					called = true;
					resolve( promise, y, fulfil, reject );
				};
				var rejectPromise = function ( r ) {
					if ( called ) {
						return;
					}
					called = true;
					reject( r );
				};

				try {
					then.call( x, resolvePromise, rejectPromise );
				} catch ( e ) {
					if ( ! called ) {
						reject( e );
						called = true;
						return;
					}
				}
			} else {
				fulfil( x );
			}
		} else {
			fulfil( x );
		}
	};

}

var callstack = [ ];

var resetRequest = false;

var busy = false;

setupListeners();

var handler$2 = {

	check: function ( options ) {
		if ( callstack.length > 1 ) {

			if ( !busy ) {
				busy = true;
				eventer.emit( events.ROUTE_ABUSE_START, options );
			}

			// After a short delay we check if the callstack is back to normal.
			// If at the end of the delay the callstack is normal, we emit ROUTE_ABUSE_STOP event.
			// If the callstack overflows again during the delay, we cancel the reset request
			// and begin a new reset request after a delay.
			var delay = config.abuseTimeout;
			resetWhenNormal( delay, options );
		}
	},
	reset: function ( options ) {
		callstack = [ ];
		resetRequest = false;
		busy = false;
		eventer.emit( events.ROUTE_ABUSE_STOP, options );
	},

	push: function ( options ) {
		callstack.push( 1 );
		handler$2.check( options );
	},

	pop: function () {
		callstack.splice( 0, 1 );
	}
};

function setupListeners() {

	eventer.on( events._GOTO, function ( options ) {
		if ( options.redirect === true ) {
			return;
		}
		handler$2.push( options );
	} );


	eventer.on( events.ERROR, function ( options ) {
		handler$2.pop();
	} );

	eventer.on( events.ENTERED, function ( options ) {
		handler$2.pop();
	} );

	eventer.on( events.UPDATED, function ( options ) {
		handler$2.pop();
	} );
}

function resetWhenNormal( delay, options ) {
	if ( delay === void 0 ) delay = config.abuseTimeout;


	// if a request was already made to reenable animations, clear it and make a new request
	if ( resetRequest ) {
		clearTimeout( resetRequest );
	}

	// We wait a bit before restting callstack in case user is still thrashing UI.
	resetRequest = setTimeout( function ( ) {
		handler$2.reset( options );
	}, delay );
}

// Enables HTML5-History-API polyfill: https://github.com/devote/HTML5-History-API
var location$1 = window$1 && ( window$1.history.location || window$1.location );

function noop () {}

var currentData = {};
var currentRoute = {
	enter: function () { return journey.Promise.resolve(); },
	leave: function () { return journey.Promise.resolve(); },
	beforeleave: function () { return journey.Promise.resolve(); }
};

var _target;
var isTransitioning = false;

var scrollHistory = {};
var uniqueID = 1;
var currentID = uniqueID;

var journey = {
	Promise: Promise,

	/**
	 * Add a new route for the given path and transition options.
	 * 
	 * @param {string} path route url path eg. 'foo', '/foo', '#foo', '/foo:id', '/foo/:fooId/bar/:barId'
	 * 
	 * @param {Object} options specifies the route handlers:<pre><code> {<br/>
	 *		&nbsp;&nbsp;<em>enter</em>: function( route, prevRoute, options ),<br/>
	 *		&nbsp;&nbsp;<em>leave</em>: function( route, nextRoute, options ),<br/>
	 *		&nbsp;&nbsp;<em>beforeleave</em>:  function( route, nextRoute, options ),<br/>
	 *		&nbsp;&nbsp;<em>beforeenter</em> function( route, prevRoute, options ),<br/>
	 *		&nbsp;&nbsp;<em>update</em>: function( route, options )<br/>
	 *  }
	 * </code></pre>
	 * 
	 * @returns {journey} returns the journey instance to allow chaining: 
	 * <pre><code>
	 * journey.add( 'foo' ).add( 'bar' ).start();
	 * </code></pre>
	 */
	add: function add( path, options ) {

		if ( path == null ) {
			throw new Error( "journey.add() requires a path argument!" );
		}

		options = util.extend( { }, options );

		routes.push( new Route( path, options ) );
		return journey;
	},

	/**
	 * Start Journey with the given options.
	 * <pre><code>
	 * journey.add('foo');
	 * journey.start();
	 * 
	 * // with options:
	 * journey.start( { target: '#main', debug: false, fallback: '/notFound'});
	defaultRoute: '/home'
	 * </code></pre>
	 * 
	 * @param {Object} options specifies the route options:<pre><code>
	 *  <em>target</em> (string): the default target to use for rendering views eg. '#main' to render to &lt;div id="main"&gt;&lt;/div&gt;,<br/>
	 *  <em>fallback</em> (string): specifies a route to use when navigating to a route that does not exist,<br/>
	 *  <em>debug</em> (boolean): specifies if Journey should print debug statements or not. default: true,<br/>
	 *  <em>base</em> (string): specifies a base path to use when deploying the application under a specific contextPath,<br/>
	 *  <em>defaultRoute</em> (string): specifies a default route Journey should navigate to upon startup if no route is specified,<br/>
	 *  <em>useHash</em> (boolean): specifies whether Hashes or HTML5 pushState should be used. default: true,<br/>
	 *  <em>hash</em> (string): specifies the hash string to eg. hash: #!, default: #,<br/>
	 * @returns a promise that resolves after the route enters, or rejects if an error occurs
	 */
	start: function start ( options ) {
		if ( options === void 0 ) options = {};


		util.extend( config, options );

	mode.DEBUG = config.debug;
		
		watchHistory.start(config);
		watchHistory.setListener(historyListener);

		var path = pathHelper.getInitialPath();

		var matchFound = routes.some( function (route) { return route.matches( path ); } );
		var href = matchFound ?
			path :
			config.fallback;

			var gotoOptions = {
				replaceState: true,
				scrollX: window$1.scrollX,
				scrollY: window$1.scrollY
			};

		return journey.goto( href, gotoOptions);
	},

	/**
	 * Navigate to the given <em>href</em>.
	 * <pre><code>
	 * journey.goto( 'foo' );
	 * journey.goto( 'foo', { forceReload: true, invisible: true });
	 * </code></pre>
	 * 
	 * @param {string} href specifies a registered path of the route to navigate to
	 * @param {Object} options specifies the route options:<pre><code>
	 *  <em>invisible</em> (boolean): whether to update the url or not,<br/>
	 *  <em>forceReload</em> (boolean): reload the route even if the given route is the current route,<br/>
	 *  <em>redirect</em> (boolean): specifies that this route will redirect. Journey won't fire routeAbuseStart/routeAbuseEnd.<br/>
	 * </code></pre>
	 * @returns a promise that resolves after the route enters, or rejects if an error occurs
	 */
	goto: function goto ( href, options) {
		if ( options === void 0 ) options = {};

		if (href == null) { return journey.Promise.resolve(); }

		href = pathHelper.getGotoPath(href);

		scrollHistory[ currentID ] = {
			x: window$1.scrollX,
			y: window$1.scrollY
		};

		var target;
		var promise = new journey.Promise( function ( fulfil, reject ) {
			target = _target = {
				href: href,
				scrollX: options.scrollX || 0,
				scrollY: options.scrollY || 0,
				options: options,
				fulfil: fulfil,
				reject: reject,
				currentRoute: currentRoute,
				currentData: currentData
			};
		});
		
		promise._locked = false;
		
		_target.promise = promise;
		
		if ( isTransitioning ) {
			promise._locked = true;
			//return promise;
		}

		_goto( target );
		
		if ( target._sameRoute ) {
			return promise;
		}

		var emitOptions = {
			redirect: options.redirect,
			pathname: href,
			href: location$1.href
		};

		journey.emit( journey, events._GOTO, emitOptions );
	
		promise.catch( function ( err ) {
			// TODO should we catch this one here? If further inside the plumbing an error is also thrown we end up logging the error twice
			var errorOptions = handler.gatherErrorOptions( null, currentRoute, null, null, err );
			eventer.raiseError( errorOptions );
		} );

		return promise;
	},

	/**
	 * Returns the data for the current route
	 *
	 * @returns the data for the current route
	 */
	getCurrentData: function getCurrentData () {
		return currentData;
	},

	/**
	 * Returns the current route
	 *
	 * @returns the current route
	 */
	getCurrentRoute: function getCurrentRoute() {
		return currentRoute;
	},

	/**
	 * Returns the base that was set during startup.
	 *
	 * @returns the base that was set during startup
	 */
	getBase: function getBase ( ) {
		return config.base;
	},

	/**
	 * Start listening to the given event, one of <em>enter, entered, leave, left, beforeenter, beforeenterComplete, beforeleave, beforeleaveComplete,
	 * update, updated, error, transitionAborted.
	 * 
	 * @param {string} event to listen to
	 * @param {function} listener the function to call when the event is fired. function receives an event argument: <b>journey.on ('enter', function ( event ) {});</b>
	 * @return {journey} Current instance of journey for chaining.
	 */
	on: function on( event, listener ) {
		eventer.on( event, listener );
		return journey;
	},

	/**
	 * Stop listening to the given event, one of <em>enter, entered, leave, left, beforeenter, beforeenterComplete, beforeleave, beforeleaveComplete,
	 * update, updated, error, transitionAborted
	 * @param {string} event top stop listening to
	 * @param {function} listener optionally provide a specific listener to remove for the event
	 * @return {journey} Current instance of journey for chaining.
	 */
	off: function off( event, listener ) {
		eventer.off( event, listener );
		return journey;
	},

	/**
	 * Listen to the given event once, after which the listener is removed. Event can be one of
	 *  <em>enter, entered, leave, left, beforeenter, beforeenterComplete, beforeleave, beforeleaveComplete, update, updated, error, transitionAborted.
	 *
	 * @param {string} event to listen to
	 * @param {function} listener the function to call when the event is fired. function receives an event argument: <b>journey.once ('enter', function ( event ) {});</b>
	 * @return {journey} Current instance of journey for chaining.
	 */
	once: function once( event, listener ) {
		eventer.off( event, listener );
		return journey;
	},

	/**
	 * Subtly different from emitEvent in that it will pass its arguments on to the listeners, as opposed to taking a single array of arguments to pass on.
	 * As with emitEvent, you can pass a regex in place of the event name to emit to all events that match it.
	 *
	 * @param {String|RegExp} event Name of the event to emit and execute listeners for.
	 * @param {...*} Optional additional arguments to be passed to each listener.
	 * @return {journey} Current instance of journey for chaining.
	 */
	emit: function emit( event ) {
		eventer.emit.apply( eventer, arguments );
		return journey;
	},

	 /**
     * Emits an event of your choice.
     * When emitted, every listener attached to that event will be executed.
     * If you pass the optional argument array then those arguments will be passed to every listener upon execution.
     * Because it uses `apply`, your array of arguments will be passed as if you wrote them out separately.
     * So they will not arrive within the array on the other side, they will be separate.
     * You can also pass a regular expression to emit to all events that match it.
     *
     * @param {String|RegExp} event Name of the event to emit and execute listeners for.
     * @param {Array} args Optional array of arguments to be passed to each listener.
     * @return {journey} Current instance of EventEmitter for chaining.
     */
	emitEvent: function emitEvent ( event, args ) {
		eventer.emitEvent.apply( eventer, arguments );
		return journey;
	}
};

eventer.init( journey );
handler.init( journey );

if ( window$1 ) {
	watchLinks( function (href) {
		journey.goto( href )

			.catch(function (e) {
				isTransitioning = false; 
			} );
	});
}

function getNewData(target) {
	var newData;
	var newRoute;

	for ( var i = 0; i < routes.length; i += 1 ) {
		var route = routes[i];
		newData = route.exec( target );

		if ( newData ) {
			newRoute = route;
			break;
		}
	}

	return {
		newRoute: newRoute,
		newData: newData
	};
}

function historyListener( options ) {

		var url = util.stripBase(options.url, journey.getBase());

	var targetOptions = {};
	var target;

		target = _target = {
			href: url,
			hashChange: options.hashChange, // so we know not to manipulate the history
			popState: options.popState, // so we know not to manipulate the history
			options: targetOptions,
			fulfil: noop,
			reject: noop,
			currentRoute: currentRoute,
			currentData: currentData
		};

		if(options.popEvent != null) {
			var scroll = scrollHistory[ options.popEvent.state.uid ] || {x: 0, y: 0};
			target.scrollX = scroll.x;
			target.scrollY = scroll.y;

		} else {
			target.scrollX = 0;
			target.scrollY = 0;
		}

		_goto( target );

		if(options.popEvent != null) {
			currentID = options.popEvent.state.uid;
		}
}

function _goto ( target ) {
	var newRoute;
	var newData;
	var forceReloadRoute = target.options.forceReload || false;

	var targetHref = pathHelper.prefixWithSlash(target.href);
	target.href = targetHref;

	var result = getNewData(target);

	if (!result.newData) {
		// If we cannot find data, it is because the requested url isn't mapped to a route. Use fallback to render page. Keep url pointing to requested url for 
		// debugging.
		var tempHref = target.href;
		target.href = config.fallback;
		result = getNewData(target);
		target.href = tempHref;
	}

	newData = result.newData;
	newRoute = result.newRoute;

	target._sameRoute = false;
	var _isSameRoute = isSameRoute( newRoute, target.currentRoute, newData, target.currentData );
	if ( !newRoute || ( _isSameRoute && !forceReloadRoute) ) {
		target.fulfil();
		target._sameRoute = true;
		return;
	}

	scrollHistory[ currentID ] = {
		x: ( target.currentData.scrollX = window$1.scrollX ),
		y: ( target.currentData.scrollY = window$1.scrollY )
	};

	isTransitioning = true;

	var promise;
	if ( !forceReloadRoute && ( newRoute === target.currentRoute ) && newRoute.updateable ) {
		
		// handler.emit(UPDATE);

		// For updates, merge newData into currentData, in order to preserve custom data that was set during enter or beforeenter events
		//newData = util.extend( target.currentData, newData );

		//promise = newRoute.update( newData );
		promise = handler.update( newRoute, newData, target );
		
		promise.then( function () {

			if ( !continueTransition( target, newData ) ) {
				return journey.Promise.resolve( {interrupted: true, msg: "route interrupted"} );
			}
		} );

	} else {

		promise = new journey.Promise(function (resolve, reject) {

					var transitionPromise;

						//transitionPromise = journey.Promise.all([ target.currentRoute.beforeleave( target.currentData, newData )	]);
						transitionPromise = handler.beforeleave( newRoute, newData, target );

					transitionPromise
							.then( function () {
								if ( continueTransition( target, newData ) ) {
									var promise = handler.beforeenter( newRoute, newData, target );
									return promise;
								} else {

									resolve( {interrupted: true, msg: "route interrupted"} );
									return journey.Promise.resolve( {interrupted: true, msg: "route interrupted"} );
								}
							})

							.then( function () {
								if ( continueTransition( target, newData ) ) {

									var promise = handler.leave( newRoute, newData, target );
									return promise;

									//return journey.Promise.all( [ target.currentRoute.leave( target.currentData, newData ) ]);

								} else {
									var promiseResult = {interrupted: true, msg: "route interrupted"};

									resolve( promiseResult  );
									return journey.Promise.resolve( promiseResult );
								}
							})

							.then( function () {

								if ( continueTransition( target, newData ) ) {
									// Only update currentRoute *after* .leave is called and the route hasn't changed in the meantime
									//currentRoute = newRoute;
									//currentData = newData;

                                    //return newRoute.enter( newData, target.currentData ).then( () => resolve() );
									var promise = handler.enter( newRoute, newData, target );
									return promise;
								} else {
									resolve( {interrupted: true, msg: "route interrupted"} );
									return journey.Promise.resolve( {interrupted: true, msg: "route interrupted"} );
								}
							}).then( function () {
								resolve();
							})
							.catch( function ( e ) {
								return reject( e );
							} );
						} );
	}

	promise
		.then( function ( ) {

			isTransitioning = false;

			if ( continueTransition( target, newData ) ) {
				
				target.fulfil();
				updateHistory(target);

			} else {
				// if the user navigated while the transition was taking
				// place, we need to do it all again
				//_goto( _target );
				_target.promise.then( target.fulfil, target.reject );
			}
		})
		.catch( function (err) {
			isTransitioning = false;
			target.reject(err);
		});

		// If we want the URL to change to the target irrespective if an error occurs or not, uncomment below
		//updateHistory(target);
} // * _goto end*

function updateHistory(target) {
	
	if ( target.popState || target.hashChange ) { return; }

	var ref = target.options;
	var replaceState = ref.replaceState;
	var invisible = ref.invisible;
	if ( invisible ) { return; }
	
	var uid = replaceState ? currentID : ++uniqueID;

	var targetHref = target.href;

	if (watchHistory.useOnHashChange) {
		targetHref = pathHelper.prefixWithHash(targetHref);
		target.href = targetHref;
		watchHistory.setHash( targetHref, target.options );

	} else {

		if (config.useHash) {
			targetHref = pathHelper.prefixWithHash(targetHref);
			target.href = targetHref;

		} else {
			targetHref = pathHelper.prefixWithSlash(targetHref);
			// Add base path for pushstate, as we are routing to an absolute path '/' eg. /base/page1
			targetHref = util.prefixWithBase(targetHref, journey.getBase());
			target.href = targetHref;
		}

		history[ target.options.replaceState ? 'replaceState' : 'pushState' ]( { uid: uid }, '', target.href );
	}

	currentID = uid;
	scrollHistory[ currentID ] = {
		x: target.scrollX,
		y: target.scrollY
	};
}

function continueTransition( target, newData ) {
	
	if ( target._transitionAborted === true )	{ return false; }

	if ( _target === target ) {
		return true;
	}

	// add guard so we don't emit transition_aborted more than once for this route transition
	target._transitionAborted = true;

	var eventOptions = handler.getDefaultOptions( journey.getCurrentRoute() );
	var options = {
		to: newData,
		from: target.currentData,
		options: eventOptions
};

	eventer.emit( events.TRANSITION_ABORTED, options );
	return false;
}

/**
 * Not for public use.
 * 
 * @private
 * @param {type} target
 * @param {type} newRoute
 * @param {type} newData
 * @returns {undefined}
 */
journey._updateCurrentRoute = function( target, newRoute, newData) {
	// Only update currentRoute if the route hasn't changed in the meantime
	if (continueTransition(target, newData)) {
		currentRoute = newRoute;
		currentData = newData;
	}
};

return journey;

}());
//# sourceMappingURL=journey.js.map
