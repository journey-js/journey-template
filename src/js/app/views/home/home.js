import template from  './home.html';
import Ractive from 'Ractive.js';

var home = {

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
export default home;

