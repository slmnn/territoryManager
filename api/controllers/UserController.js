/**
 * UserController
 *
 * @module      :: Controller
 * @description	:: A set of functions called `actions`.
 *
 *                 Actions contain code telling Sails how to respond to a certain type of request.
 *                 (i.e. do stuff, then send some JSON, show an HTML page, or redirect to another URL)
 *
 *                 You can configure the blueprint URLs which trigger these actions (`config/controllers.js`)
 *                 and/or override them with custom routes (`config/routes.js`)
 *
 *                 NOTE: The code you write here supports both HTTP and Socket.io automatically.
 *
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

var pageOptions = {
  activePage : '',
  breadcrumbs : [{name : 'User management', link : null}],
  appliedFilters : []
};

module.exports = {

	find : function(req, res) {
		return res.redirect('/user/update');
	},
  
	initAdminUser : function(req, res) {
		if(req.method == 'GET') {
			User.findOne({'username':'admin'})
			.exec(function(err, a){
				if(err) return res.send(err, 500);
				else if (a) return res.send("Admin already exists", 500);
				else {
					console.log("Creating 'admin'");
					User.create(
						{
							username: 'admin',
							password: sails.config.admin_init_password
						}
					).done(function(err, u){
						if(err) return res.send(err, 500);
						return res.redirect('/login');
					});
				}
			});
		} else {
			return res.send("Forbidden", 403);
		}
	},

	create : function (req, res) {
    if(req.method == 'GET') {
			if(!req.user || req.user[0].username != "admin") {
				return res.send("Forbidden", 403);
			} else {
				pageOptions.currentUsername = req.user[0].username; 
			}
      return res.view({
        viewOptions : pageOptions,
        actionResult : "Please input new user information."
      });
    } else if(req.method == 'POST') {
			if(!req.user || req.user[0].username != "admin") {
				return res.send("Forbidden", 403);
			} else {
				pageOptions.currentUsername = req.user[0].username; 
			}
			if(req.body.input_password1 !== req.body.input_password2) {
				console.log("Mismatching Passwords!")
				return res.view({
					viewOptions: pageOptions,
					actionResult : "Mismatching Passwords!"
				});
			}
			if(req.body.input_username.length <= 2) {
				return res.view({
					viewOptions: pageOptions,
					actionResult : "Username should be longer"
				});
			}
			User.create(
				{
					username:req.body.input_username,
					password:req.body.input_password1
				}
			).done(function(err, u){
				return res.view({
					viewOptions: pageOptions,
					actionResult : "User created!"
				});
			});
		}
	},

	update : function (req, res) {
    if(req.method == 'GET') {
    	pageOptions.currentUsername = req.user[0].username;
			if(!req.user || !req.user[0].id) {
				return res.send("Forbidden", 403);
			} else {
				pageOptions.currentUsername = req.user[0].username; 
			}
      return res.view({
        viewOptions : pageOptions,
        actionResult : "Please input new user information."
      });
    } else if(req.method == 'POST') {
			if(!req.user || !req.user[0].id) {
				return res.send("Forbidden", 403);
			} else {
				pageOptions.currentUsername = req.user[0].username; 
			}
			if(req.body.input_password1 != req.body.input_password2) {
				console.log("Mismatching Passwords!")
				return res.view({
					viewOptions: pageOptions,
					actionResult : "Mismatching Passwords!"
				});
			}
			User.update(
				{
					id : req.user[0].id
				},
				{
					password : req.body.input_password1
				}, function(err, u) {
          if(err || !u || u.length == 0) {
            return res.send(err, 500);
          }
					return res.view({
						viewOptions: pageOptions,
						actionResult : "User updated!"
					});
				}
			);
		}
	},

  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to UserController)
   */
  _config: {}

  
};
