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

var createNewHolder = function(in_name, in_email, in_emailValid, callback) {
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
          emailValid : in_emailValid == "email_is_not_valid" ? false : true
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
    pageOptions.breadcrumbs = [{name : 'App Settings', link : '/app/update'}, {name : 'Create Holder', link : null}];
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
        request.body.input_email_valid,
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

  update : function(request, response) {
    pageOptions.defaultHolderName = sails.config.default_territory_holder;
    pageOptions.breadcrumbs = [{name : 'Territory holders', link : '/holder'}, {name : 'Edit holder', link: null}];
    if(request.method == 'GET') {
      Holder.findOne({'id' : request.params.id})
      .exec(function(err, h) {
        if(err || !h || h.length == 0) {
          return response.send("Please give holder to be updated as a parameter.", 500);
        }
        return response.view({
          viewOptions: pageOptions,
          holder : h, 
          actionResult : "Please edit holder information."
        });
      })
    } else if(request.method == 'POST') {
      if(request.body.input_name.length < 5 || request.body.input_email.length < 5) {
        return response.view({
          viewOptions : pageOptions,
          actionResult : "Name and email are not ok."
        });  
      }
      Holder.update(
        {'id' : request.params.id},
        {
          name : request.body.input_name, 
          email : request.body.input_email,
          emailValid : (request.body.input_email_valid == "email_is_not_valid") ? false : true
        }, function(err, h) {
          if(err || !h || h.length == 0) {
            return response.send(err, 500);
          }
          return response.redirect('holder/' + request.params.id);
        }
      );
    }
  },

  destroy : function(request, response) {
    pageOptions.breadcrumbs = [{name : 'App Settings', link : '/app/update'}, {name : 'Remove Holder', link : null}];
    pageOptions.currentUsername = request.user[0].username; 
    console.log(request.user[0].username);
    if(!request.user || request.user[0].username != 'admin') {
      return response.send("Forbidden", 403);
    }
    if(request.method == 'GET') {
      Holder.find().exec(function(err, h) {
        for(var i = 0; i < h.length; i++) {
          if(h[i].id == sails.config.default_territory_holder_id)
            h.splice(i, 1);
        }
        return response.view({
          holders : h.sort(function(a,b){if(a.name>b.name)return 1; if(a.name<b.name)return -1; else return 0;}),
          viewOptions : pageOptions,
          actionResult : "Please select a holder to be removed. All territories assigned to the holder will be returned to the default holder. If you want to mark territories as covered, it needs to be done manually."
        });
      });

    } else if(request.method == 'POST') {
      if(!request.body.input_name) {
        return response.send("The holder is not specified", 500);
      }
      // Return territories to the default user and then destroy the holder
      Holder.findOne({ name: request.body.input_name })
      .exec(function(err, h) {
        if(err || !h) return response.send(err, 500);
        Territory.update(
          { holder : h.id },
          { 
            holder : sails.config.default_territory_holder_id,
            taken : new Date(),
            reallyTaken : new Date()
          },
          function(err, t) {
            if(err) return response.send(err, 500);
            var affectedTerritories = [];
            for(var i = 0; i < t.length; i++) {
              affectedTerritories.push(t[i].territoryCode);
            }
            Holder.destroy({id:h.id}).done(function(err){
              if(err) return response.send(err, 500);
              console.log("Removed " + h.name);
              return response.redirect('/holder/destroy');
            });
          }
        );
      });
    }
  },

  find : function(request, response) {
    pageOptions.currentUsername = request.user[0].username; 
  	Holder.findOne(request.params.id)
  	.exec(function(err, h) {
  		if(err || !h) return response.notFound();
  		Territory.find({holder : request.params.id})
      .sort('territoryLetter').sort('territoryNumber')
  		.exec(function(err, t) {
        pageOptions.breadcrumbs = [{name : 'Territory holders', link : '/holder'}, {name : h.name, link : null}];
	      return response.view({
          viewOptions : pageOptions,
	        holderName : h.name,
          holderId : h.id,
	        territories : t
	      });
			});
  	});
  },

  index : function(request, response) {
    pageOptions.currentUsername = request.user[0].username; 
    pageOptions.userIsHolderRelated = request.user[0].holderRelated ? true : false;
  	Holder.find()
    .sort('name')
  	.exec(function(err, h){
  		Territory.find()
      .sort('territoryLetter').sort('territoryNumber')
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
        var onlyRelatedHolders = [];
        if(request.user[0].holderRelated && request.user[0].holderRelated === true) {
          for(var i = 0; i < only_holders_with_territories.length; i++) {
            if(only_holders_with_territories[i].id == request.user[0].relatedHolder || only_holders_with_territories[i].id == sails.config.default_territory_holder_id) {
              onlyRelatedHolders.push(only_holders_with_territories[i]);
            }
          }
          only_holders_with_territories = onlyRelatedHolders;
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
