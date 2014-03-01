/**
 * TerritoryController
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
  activePage : 'territory',
  breadcrumbs : [],
  appliedFilters : []
};

var figureOutPossibleLetters = function() {
  return sails.config.territory_letters;
};

var createNewTerritory = function(in_territory, callback) {
  // TODO: Should sanitize letter and number
  if(!in_territory.letter || !in_territory.number) {
    callback("Missing letter or number!", 500);
  }
  if(isNaN(in_territory.number)) {
    callback("Territory number is not valid", 500);
  }
  if(!in_territory.lat || !in_territory.lng) {
    callback("Missing latitude or longitude!", 500);
  }
  Territory.find()
    .where({territoryCode : in_territory.letter + in_territory.number})
    .exec(function(err, t){
      if(err)
        callback(err, 500);
      if (t.length > 0)
        callback("The territory exists already", 500);
      else {
        Territory.create({
          territoryLetter : in_territory.letter,
          territoryNumber : parseInt(in_territory.number),
          territoryCode   : in_territory.letter + in_territory.number,
          taken : new Date(),
          reallyTaken : new Date(),
          lat : in_territory.lat,
          lng : in_territory.lng,
          description : in_territory.description,
          holder : sails.config.default_territory_holder_id
        }).done(function(err, territory) {
          if(err) {
            callback(err, 500);
          }
          callback(territory, 200);
        });
      }
    });
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

module.exports = {
    
  create : function(request, response) {
  	if(request.method != 'POST')
  		return response.notFound();
  	
  	if(request.param('territoryCode') && 
      request.param('territoryCode') !=
  		request.param('territoryLetter') + request.param('territoryNumber'))
  		return response.json("The code does not match!", 500);
  	
  	createNewTerritory(
      { 
        letter : request.param('territoryLetter'), 
        number : parseInt(request.param('territoryNumber'))
      },
      function(data, code) {
        return response.json(data, code);
      });
  },

  update : function(request, response) {
    var possibleLetters = figureOutPossibleLetters();
    pageOptions.defaultHolderName = sails.config.default_territory_holder;
    pageOptions.breadcrumbs = [{name : 'Territories', link : '/territory'}, {name : request.params.id, link: '/territory/' + request.params.id.charAt(0) + '/' + request.params.id.substring(1)}, {name : 'Edit', link: null}];
    if(request.method == 'GET') {
      Territory.findOne({'territoryCode' : request.params.id})
      .exec(function(err, t) {
        if(err || !t || t.length == 0) {
          return response.send("Please give territory to be updated as a parameter.", 500);
        }
        return response.view({
          viewOptions: pageOptions,
          availableLetters : possibleLetters,
          territory : t, 
          actionResult : "Please input territory information."
        });
      })
    } else if(request.method == 'POST') {
      Territory.update(
        {territoryCode:request.params.id},
        {
          description : request.body.input_description,
          lat : request.body.input_lat,
          lng : request.body.input_lng
        }, function(err, t) {
          if(err || !t || t.length == 0) {
            return response.send(err, 500);
          }
          return response.redirect('territory/' + t[0].territoryLetter + '/' + t[0].territoryNumber);
        }
      );

    } else if(request.method == 'PUT') {
    	Territory.findOne(request.param('id')).exec(function(err, t) {
    		if(err)
    			return response.json(err, 500);
    		if(!t)
    			return response.notFound();
    		if(request.param('holder') && request.param('holder').length > 0) {
    			t.holder = request.param('holder');
    			t.taken = new Date();
  				t.save(function(err) {
  					if(err) return response.send(err, 500);
  					return response.json(t);
  				});
    		} else {
    			return response.send("Please provide holder.", 500);
    		}
    	});
    }
  },

  find : function(request, response) {
    pageOptions.breadcrumbs = [{name : 'Territories', link : '/territory'}];
    pageOptions.defaultHolderName = sails.config.default_territory_holder;
  	var searchParameters;
  	if (request.params.letter && request.params.number) {
  		searchParameters = {'territoryCode' : request.params.letter + request.params.number};
      pageOptions.breadcrumbs.push({name : searchParameters.territoryCode, link : null});
    }
  	else if (!request.params.letter && request.params.number) {
  		searchParameters = {'territoryNumber' : parseInt(request.params.number)};
      pageOptions.breadcrumbs.push({name : searchParameters.territoryNumber, link : null});
    }
  	else if (request.params.letter && !request.params.number) {
  		searchParameters = {'territoryLetter' : request.params.letter};
      pageOptions.breadcrumbs.push({name : searchParameters.territoryLetter, link : null});
    }
  	if(request.wantsJSON) {
  		Territory
  		.find(searchParameters)
  		.exec(function(err, t) {
  			return response.json(t, 200);
  		})
  	} else {
  		Territory.find(searchParameters).sort('territoryLetter').sort('territoryNumber').exec(function(err, t) {
        Holder.find().exec(function(err, h) {
          var t_with_names = convertHolderIDtoName(t, h);
          pageOptions.currentUsername = request.user[0].username;
          return response.view({
            viewOptions: pageOptions,
            possibleHolders : h,
            territories : t_with_names
          });      
        })
  		})
  	}
  },

  index : function(request, response) {
    pageOptions.breadcrumbs = [{name : 'Territories', link : null}];
    pageOptions.currentUsername = request.user[0].username;
    pageOptions.defaultHolderName = sails.config.default_territory_holder;

    var filter = { };
    if(request.query.only_free == 'true') {
      filter.holder = sails.config.default_territory_holder_id;
    }
    if(request.query.letter) {
      filter.territoryLetter = request.query.letter;
    }
    if(request.query.taken_days_ago) {
      var milliseconds_ago = request.query.taken_days_ago * 24 * 60 * 60 * 1000;
      var oldDate = new Date();
      oldDate.setTime(oldDate.getTime() - milliseconds_ago);
      filter.taken = { '<=' : oldDate };
    }

  	Territory.find(filter).sort('territoryLetter').sort('territoryNumber')
    .exec(function(err, all) {
      Holder.find().exec(function(err, h){
        var t_with_names = convertHolderIDtoName(all, h);
  	  	if(request.wantsJSON) {
  	  		return response.json(all, 200);
  	  	} else {

          var possibleLetters = figureOutPossibleLetters();
          var only_available_letters = [];
          for(var i = 0; i < possibleLetters.length; i++) {
            for(var j = 0; j < t_with_names.length; j++) {
              if(possibleLetters[i] == t_with_names[j].territoryLetter) {
                only_available_letters.push(possibleLetters[i]);
                break;
              }
            }
          }

          var out_t = [];
          if(request.query.taken_days_ago) {
            for(var i = 0; i < t_with_names.length; i++) {
              if(oldDate.getTime() > new Date(t_with_names[i].taken).getTime()) {
                out_t.push(t_with_names[i]);
              }
            }
          } else {
            out_t = t_with_names;
          }

          Territory.count(function(err, count_all) {
            return response.view({
              viewOptions: pageOptions,
              allLetters : possibleLetters,
              availableLetters : only_available_letters,
              totalCount : count_all,
              territories : out_t
            });
          });
  	  	}
      });
  	});
  },

  add : function(request, response) {
    pageOptions.defaultHolderName = sails.config.default_territory_holder;
    pageOptions.breadcrumbs = [{name : 'Territories', link : '/territory'}, {name : 'Add new territory', link : null}];
    var possibleLetters = figureOutPossibleLetters();
    if(request.method == 'GET') {
      return response.view({
        viewOptions: pageOptions,
        availableLetters : possibleLetters,
        actionResult : "Please input territory information."
      });
    } else if(request.method == 'POST') {
      createNewTerritory(
        { 
          letter : request.body.input_letter, 
          number : parseInt(request.body.input_number), 
          lat : request.body.input_lat, 
          lng : request.body.input_lng, 
          description : request.body.input_description
        },
        function(data, code) {
          pageOptions.currentUsername = request.user[0].username;
          if(code != 200) {
            return response.view({
              viewOptions: pageOptions,
              availableLetters : possibleLetters,
              actionResult : data
            });            
          } else {
            return response.view({
              viewOptions: pageOptions,
              lastLetter : data.territoryLetter,
              availableLetters : possibleLetters,
              actionResult : "New Territory (" + data.territoryLetter + data.territoryNumber + ") Created!"
            }); 
          }
        });
    }
  },

  holder : function(request, response) {
    pageOptions.defaultHolderName = sails.config.default_territory_holder;
    Holder.find().exec(function(err, all_holders) {
      if(request.method == 'GET') {
        pageOptions.breadcrumbs = [{name : 'Territories', link : '/territory'}, {name : 'Change Holder', link : null}];
        return response.view({
          viewOptions: pageOptions,
          possibleHolders : all_holders,
          actionResult : "Here we can change the territory holder."
        });
      } else if(request.method == 'POST') { 
        Territory.find({
          'territoryLetter': request.body.input_letter,
          'territoryNumber': parseInt(request.body.input_number)
        }).exec(function(err, t) {
          if(err)
            return response.json(err, 500);
          if(!t || t.length != 1) {
            return response.json("There is no suitable territory", 500);
          }
          t = t[0];
          if(request.body.input_holder && request.body.input_holder.length > 0) {
            Holder.findOne({'name' : request.body.input_holder})
            .exec(function(err, h) {
              if(err)
                return response.json(err, 500);
              if(!h)
                return response.json("Holder " + request.body.input_holder +  " is not in the system. Add her first.", 500);
              if(t.holder != h.id) {
                t.reallyTaken = new Date();
              }
              if(!t.holderHistory)
                  t.holderHistory = [];
              if(t.holder != sails.config.default_territory_holder_id)
                t.holderHistory.push([t.holder, new Date()]);
              t.holder = h.id;
              t.taken = new Date();
              t.save(function(err) {
                if(err) return response.send(err, 500);
                return response.redirect('territory/' + request.body.input_letter + '/' + request.body.input_number);
              });            
            });
          }
        });
      }
    });
  },

  map : function(request, response) {
    pageOptions.defaultHolderName = sails.config.default_territory_holder;
    var possibleLetters = figureOutPossibleLetters();
    var taken_days_ago = request.query.taken_days_ago;
    var available = request.query.only_available;
    Territory.find()
    .exec(function(err, t) {
      // Remove sensitive information
      var anon_t = [];
      for(var i = 0; i < t.length; i++) {
        var new_t = t[i];
        new_t.holder = undefined;
        new_t.description = undefined;
        anon_t.push(new_t);
      }
      if(!err && anon_t.length > 0) {
        if(request.wantsJSON) {
          return response.json(anon_t);
        }
        return response.view({
          viewOptions : pageOptions,
          availableLetters : possibleLetters,
          territories : anon_t
        }); 
      } else {
        return response.send("Error: " + err, 500)
      }
    });
  },

  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to TerritoryController)
   */
  _config: {}

};
