import template from  './notFound.html';
import Ractive from 'lib/Ractive.js';

var notFound = {

	enter: function (route, prevRoute, options) {
		
		route.view = new Ractive({
			el: options.target,
			template: template
		});
		
		
	},
	
	leave: function (route, nextRoute, options) {
		route.view.teardown();
	}
};
export default notFound;

