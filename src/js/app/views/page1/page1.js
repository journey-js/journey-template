import template from  './page1.html';
import Ractive from 'Ractive.js';

var page1 = {

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
export default page1;

