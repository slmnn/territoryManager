/**
 * AppController
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

module.exports = {
    
  
  /**
   * Action blueprints:
   *    `/app/update`
   */
  update: function (request, response) {
    if(!request.user || request.user[0].username != "admin") {
      return response.send("Forbidden", 403);
    }    
    var pageOptions = {};
    pageOptions.defaultHolderName = sails.config.default_territory_holder;
    pageOptions.currentUsername = request.user[0].username; 
    pageOptions.message = "";
    pageOptions.breadcrumbs = [{name : 'Application settings', link : null}];
    if(request.method == 'GET') {
      App.find().exec(function(err, a) {
        if(err) response.send("error", 500);
        pageOptions.message = "Input new settings";
        return response.view({viewOptions: pageOptions, currentSettings : a[0]});
      })
    }
    if(request.method == 'POST') {
      App.find().exec(function(err, a) {
        a[0].backupInterval = request.body.input_interval;
        a[0].backupEmail = request.body.input_email;
        a[0].save(function(err) {
          if(err) response.send("error", 500);
          pageOptions.message = "Changes saved!";
          return response.view({viewOptions: pageOptions, currentSettings : a[0]});  
        })
      })
    }
  },

  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to AppController)
   */
  _config: {}

  
};
