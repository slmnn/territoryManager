/**
 * TraceController
 *
 * @description :: Server-side logic for managing traces
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var pageOptions = {
  activePage : 'territory',
  breadcrumbs : []
};

module.exports = {
	find: function(req, res) {
		pageOptions.defaultHolderName = sails.config.default_territory_holder;
    pageOptions.breadcrumbs = [{name : 'Territories', link : '/territory'}, {name : 'View traces', link : null}];
    pageOptions.currentUsername = req.user[0].username;
    pageOptions.currentUserType = req.user[0].type;

		if(req.method == 'GET') {
			var search_start = {};
			var search_end = {};
			if(req.query.start) search_start = { trace_date: { '>=': new Date(req.query.start) }};
			if(req.query.end) search_end = { trace_date: { '<=': new Date(req.query.end) }};

			var search_username = {};
			if(req.user[0].holderRelated === true) {
				search_username = { username:req.user[0].username };
			}

			var search_admin = req.user[0].username == 'admin' ? {} : {only_admin:false};

			var search_limit = {};
			if(req.query.limit) search_limit = req.query.limit;

			Trace.find(search_username)
			.where(search_start)
			.where(search_end)
			.where(search_admin)
			.limit(search_limit)
			.sort({ trace_date: 'desc' })
			.exec(function(err, t){
	      return res.view({
	        viewOptions: pageOptions,
	        traces : t,
	        actionResult : ""
	      });
			})
		}
	}
};

