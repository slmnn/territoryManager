/**
 * HolderController
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

var anynomousHolderPrefix = "anonymous_";
var pageOptions = {
  activePage : 'holder',
  breadcrumbs : [],
  appliedFilters : []
};

var convertHolderIDtoName = function(t, h) {
  for(var i = 0; i < t.length; i++) {
    var h_id = t[i].holder;
    for(var j = 0; j < h.length; j++) {
      if(h[j].id == h_id) {
        t[i].holder = h[j].name;
        continue;
      }
    }
  }
  return t;
};

var createNewHolder = function(in_name, in_email, callback) {
  if(!in_name) {
  	var d = new Date();
    in_name = anynomousHolderPrefix + d.getTime();
  } if(!in_email) {
  	callback("The email address is required", 500);
  }
  Holder.find()
    .where({name : in_name})
    .exec(function(err, t) {
      if(err)
        callback(err, 500);
      else if (t.length > 0) {
        var suggestion = in_name + '_' + t.length;
        callback("The name is not unique. Try '" + suggestion + "'", 500);
      } else {
        Holder.create({
          name : in_name,
          email : in_email,
          territories : []
        }).done(function(err, holder) {
          if(err) {
            callback(err, 500);
          }
          callback(holder, 200);
        });
      }
    });
};

module.exports = {
    
  create : function(request, response) {
    pageOptions.breadcrumbs = [{name : 'Territory holders', link : '/holder'}, {name : 'Create Holder', link : null}];
    pageOptions.currentUsername = request.user[0].username; 
    if(request.method == 'GET') {
      return response.view({
        viewOptions : pageOptions,
        actionResult : "Please input holder information."
      });
    } else if(request.method == 'POST') {
      if(request.body.input_name.length < 5 || request.body.input_email.length < 5) {
        return response.view({
          viewOptions : pageOptions,
          actionResult : "Name and email are not ok."
        });  
      }
    	createNewHolder(
    		request.body.input_name, 
    		request.body.input_email,
        function(data, code) {
          if(code != 200) {
            return response.view({
              viewOptions : pageOptions,
              actionResult : "Sorry, something went wrong: " + data
            });            
          } else {
            return response.view({
              viewOptions : pageOptions,
              actionResult : "New Holder Created (" + data.name + ")!"
            }); 
          }
        });
    }
  },

  destroy : function(request, response) {
    pageOptions.breadcrumbs = [{name : 'Territory holders', link : '/holder'}, {name : 'Remove Holder', link : null}];
    pageOptions.currentUsername = request.user[0].username; 
    if(request.method == 'GET') {
      Holder.find().exec(function(err, h) {
        for(var i = 0; i < h.length; i++) {
          if(h[i].id == sails.config.default_territory_holder_id)
            h.splice(i, 1);
        }
        return response.view({
          holders : h,
          viewOptions : pageOptions,
          actionResult : "Please select a holder to be removed. All territories assigned to the holder will be returned to the default holder."
        });
      });

    } else if(request.method == 'POST') {
      return response.send("TODO", 200);
    }
  },

  find : function(request, response) {
    pageOptions.currentUsername = request.user[0].username; 
  	Holder.findOne(request.params.id)
  	.exec(function(err, h) {
  		if(err || !h) return response.notFound();
  		Territory.find({holder : request.params.id})
      .sort('territoryCode')
  		.exec(function(err, t) {
				console.log("Find ", request.params.id, h, t);
        pageOptions.breadcrumbs = [{name : 'Territory holders', link : '/holder'}, {name : h.name, link : null}];
	      return response.view({
          viewOptions : pageOptions,
	        holderName : h.name,
	        territories : t
	      });
			});
  	});
  },

  index : function(request, response) {
    pageOptions.currentUsername = request.user[0].username; 
  	Holder.find()
    .sort('name')
  	.exec(function(err, h){
  		Territory.find()
      .sort('territoryCode')
  		.exec(function(err, t) {
        var only_holders_with_territories = [];
        for(var i = 0; i < h.length; i++) {
          for(var j = 0; j < t.length; j++) {
            if(t[j].holder == h[i].id) {
              only_holders_with_territories.push(h[i]);
              break;
            }
          }
        }
        pageOptions.breadcrumbs = [{name : 'Territory holders', link : null}];
	  		return response.view({
          viewOptions : pageOptions,
	  			territories : t,
	  			holders : only_holders_with_territories
	  		})
  		});
  	})
  },

  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to HolderController)
   */
  _config: {}

  
};
