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

var nodemailer = require("nodemailer");
var async = require("async");

var pageOptions = {
  activePage : 'territory',
  breadcrumbs : [],
  appliedFilters : []
};

var formDaysMonthsYearsObject = function(in_millisecs) {
  var millisecondsPerDay = 1000 * 60 * 60 * 24;
    var days = in_millisecs / millisecondsPerDay;
    var months = days / 30;
    var years = months / 12;
    days = days % 30;
    months = months % 12;
    return {'days':Math.floor(days), 'months':Math.floor(months), 'years': Math.floor(years)};
}

var figureOutPossibleLetters = function() {
  return sails.config.territory_letters;
};

var parseInputDate = function(in_dateString) {
  var date = new Date(Date.parse(in_dateString));
  if(isNaN( date.getTime() )) {
    return new Date();
  } else {
    return date;
  }
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
          type : in_territory.type,
          taken : parseInputDate(in_territory.covered),
          reallyTaken : parseInputDate(in_territory.covered),
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
        t[i].holder_id = h[j].id;
        continue;
      }
    }
  }
  return t;
};

var sendTerritoryToHolderEmail = function(territoryCode, holder_email, callback) {
  // create reusable transport method (opens pool of SMTP connections)
  var smtpTransport = nodemailer.createTransport("SMTP",{
      service: "Gmail",
      auth: {
          user: sails.config.smtp_username,
          pass: sails.config.smtp_password
      }
  });

  // setup e-mail data with unicode symbols
  var mailOptions = {
      from: "Fred Foo <foo@blurdybloop.com>", // sender address
      to: holder_email, // list of receivers
      subject: "Hello " + territoryCode, // Subject line
      text: "Hello world " + territoryCode, // plaintext body
      html: "<b>Hello world ✔</b>" // html body
  }

  // send mail with defined transport object
  smtpTransport.sendMail(mailOptions, function(error, response){
        if(error){
            console.log(error);
        }else{
            console.log("Message sent: " + response.message);
        }

        // if you don't want to use this transport object anymore, uncomment following line
        smtpTransport.close(); // shut down the connection pool, no more messages

        callback();
    }
  );
};

var createEmailMessage = function(in_template, in_holder, in_territory, in_listOfTerritories) {
  var subjectTxt = in_template.title.replace("_holderName", in_holder.name);
  subjectTxt = subjectTxt.replace("_territoryCode", in_territory.territoryCode);
  var bodyHTML = in_template.body.replace("_territoryCode", in_territory.territoryCode);
  bodyHTML = bodyHTML.replace("_territoryLat", in_territory.lat);
  bodyHTML = bodyHTML.replace("_territoryLng", in_territory.lng);
  var taken = new Date(in_territory.taken);
  bodyHTML = bodyHTML.replace("_taken", taken.getFullYear() + "-" + (taken.getMonth()+1) + "-" + taken.getDate());
  bodyHTML = bodyHTML.replace("_holderName", in_holder.name);
  bodyHTML = bodyHTML.replace("_territoryDetails", in_territory.description);
  bodyHTML = bodyHTML.replace("_listAllTerritoryCodes", in_listOfTerritories);
  var mailOptions = {
    from: sails.config.notificationEmail_sender_address, // sender address
    to: in_holder.email, // list of receivers
    subject: subjectTxt, // Subject line
    text: "This message is available only in HTML.", // plaintext body
    html: bodyHTML // html body
  }
  return mailOptions;
};

var createEmailObject = function(t, t_all, h_all, template) {
  var current_holder = undefined;
  for(var j = 0; j < h_all.length; j++) {
    if(h_all[j].id == t.holder && h_all[j].emailValid === true) {
      current_holder = h_all[j];
    }
  }
  if(t.holder == sails.config.default_territory_holder_id && t.holderHistory.length > 0) {
    for(var j = 0; j < h_all.length; j++) {
      if(h_all[j].id == t.holderHistory[t.holderHistory.length-1][0] && h_all[j].emailValid === true) {
        current_holder = h_all[j];
      }
    }
  }
  if(typeof current_holder != "undefined") {
    var list_of_territories = [];
    for(var k = 0; k < t_all.length; k++) {
      if(t_all[k].holder == current_holder.id) {
        list_of_territories.push(t_all[k].territoryCode);
      }
    }
    var mail = createEmailMessage(
      template, 
      current_holder, 
      t,
      list_of_territories.toString()
    );
    return mail;
  }
  return undefined;
};

var sendMails = function(smtpTransport, mails, callback) {
  if(mails.length == 0) { 
    callback(); 
    return;
  }
  smtpTransport.sendMail(mails.pop(), function(error, response){
      if(error){
        console.log(error);
      }else{
        console.log("Message sent: " + response.message);
      }
      sendMails(smtpTransport, mails, callback)
    }
  );
}

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
    if(!request.user || request.user[0].type == "restricted") {
      return response.send("Forbidden", 403);
    }  
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
      // TODO: Sanitization
      Territory.update(
        {territoryCode:request.params.id},
        {
          description : request.body.input_description,
          type : request.body.input_type,
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
          var possibleHolders = h;
          if(request.user[0].holderRelated && request.user[0].holderRelated === true) {
            possibleHolders = [];
            for(var i = 0; i < h.length; i++) {
              if(h[i].id == request.user[0].relatedHolder || h[i].id == sails.config.default_territory_holder_id) {
                possibleHolders.push(h[i]);
              }
            }
          }
          var t_with_names = convertHolderIDtoName(t, h);
          pageOptions.currentUsername = request.user[0].username;
          pageOptions.currentUserType = request.user[0].type;
          return response.view({
            viewOptions: pageOptions,
            relatedHolder: (request.user[0].holderRelated === true) ? request.user[0].relatedHolder : sails.config.default_territory_holder_id,
            possibleHolders : possibleHolders.sort(function(a,b){if(a.name>b.name)return 1; if(a.name<b.name)return -1; else return 0;}),
            territories : t_with_names
          });      
        })
  		})
  	}
  },

  index : function(request, response) {
    pageOptions.breadcrumbs = [{name : 'Territories', link : null}];
    pageOptions.currentUsername = request.user[0].username;
    pageOptions.currentUserType = request.user[0].type;
    pageOptions.defaultHolderName = sails.config.default_territory_holder;

    var appliedFilters = [];

    var filter = { };
    if(request.query.only_free == 'true') {
      filter.holder = sails.config.default_territory_holder_id;
      appliedFilters.push("only_free");
    }
    if(request.query.type) {
      filter.type = request.query.type;
      appliedFilters.push(request.query.type);
    }
    if(request.query.letter) {
      filter.territoryLetter = request.query.letter;
      appliedFilters.push("letter");
    }
    if(request.query.taken_days_ago) {
      var milliseconds_ago = request.query.taken_days_ago * 24 * 60 * 60 * 1000;
      var oldDate = new Date();
      oldDate.setTime(oldDate.getTime() - milliseconds_ago);
      filter.taken = { '<=' : oldDate };
      appliedFilters.push("taken_days_ago");
    }

    if(appliedFilters.length > 0) {
      message = "Filters applied. Some territories may not be shown."
    } else {
      message = "";
    }

    // TODO async.series
    async.series([
      function(cb) {
        App.find().exec(function(err, a) {
          if(err || a.length == 0) cb("error");
          var a = a[0];
          var lastBackup = new Date(a.lastBackup);
          var now = new Date();
          pageOptions.suggestBackup = false;
          if(now.getTime() - lastBackup.getTime() > a.backupInterval * 24 * 60 * 60 * 1000) {
            pageOptions.suggestBackup = true;
          }
          cb();
        })
      }
    ], function() {
      Territory.find(filter).sort('territoryLetter').sort('territoryNumber')
      .exec(function(err, all) {
        Holder.find().exec(function(err, h){
          var t_with_names = convertHolderIDtoName(all, h);
          if(request.wantsJSON) {
            return response.json(all, 200);
          } else {
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
            var possibleLetters = figureOutPossibleLetters();
            var only_available_letters = [];
            for(var i = 0; i < possibleLetters.length; i++) {
              for(var j = 0; j < out_t.length; j++) {
                if(possibleLetters[i] == out_t[j].territoryLetter) {
                  only_available_letters.push(possibleLetters[i]);
                  break;
                }
              }
            }
            Territory.find().exec(function(err, t_all) {
              var new_territory_taken_emails = 0;
              var not_covered_territory_emails = 0;
              var territory_removed_emails = 0;
              var now = new Date();
              now = now.getTime();
              var not_covered_limit = now - (1000*60*60*24*sails.config.limit_for_rarely_covered_territory);
              for(var i = 0; i < t_all.length; i++) {
                if(t_all[i].notificationEmailDate) {
                  var reallyTaken = new Date(t_all[i].reallyTaken);
                  reallyTaken = reallyTaken.getTime();
                  var last_email_sent = new Date(t_all[i].notificationEmailDate);
                  last_email_sent = last_email_sent.getTime();
                  if(last_email_sent < reallyTaken && t_all[i].holder != sails.config.default_territory_holder_id) {
                    new_territory_taken_emails++;
                  } 
                  if(last_email_sent < reallyTaken && t_all[i].holder == sails.config.default_territory_holder_id) {
                    territory_removed_emails++;
                  } 
                  var taken = new Date(t_all[i].taken);
                  taken = taken.getTime();
                  if(not_covered_limit > taken && last_email_sent < (now - 30*1000*60*60*24)) {
                    not_covered_territory_emails++;
                  }
                } else if(!t_all[i].notificationEmailDate && t_all[i].holder != sails.config.default_territory_holder_id) {
                  new_territory_taken_emails++;
                }
              }

              Territory.count(function(err, count_all) {
                return response.view({
                  viewOptions: pageOptions,
                  allLetters : possibleLetters,
                  availableLetters : only_available_letters,
                  totalCount : count_all,
                  territoryTakenNotificationCount : new_territory_taken_emails,
                  territoryNotCoveredNotificationCount : not_covered_territory_emails,
                  territoryRemovedNotificationCount : territory_removed_emails,
                  territories : out_t,
                  filters : appliedFilters,
                  actionResult : message
                });
              });
            });
          }
        });
      });
    });
  },

  backupTerritoryData : function(request, response) {
    // create reusable transport method (opens pool of SMTP connections)
    var smtpTransport = nodemailer.createTransport("SMTP",{
        service: "Gmail",
        auth: {
          user: sails.config.smtp_username,
          pass: sails.config.smtp_password
        }
    });
    var all_territories, all_holders, backup_email;
    var now = new Date();
    async.parallel([
      function(cb) {
        App.find().exec(function(err, a) {
          if(err || a.length == 0) cb("error");
          backup_email = a[0].backupEmail;
          a[0].lastBackup = now;
          a[0].save(cb)
        });       
      }, function(cb) {
        Territory.find().exec(function(err, all_t) {
          if(err) cb("error");
          all_territories = all_t;
          cb();
        })
      }, function(cb) {
        Holder.find().exec(function(err, all_h) {
          if(err) cb("error");
          all_holders = all_h;
          cb();
        })
      }, function(cb) {
        Trace.create(common.createTrace(request.user[0].username, "New email backup created."))
        .exec(function(err, trace) { 
          if(err) cb("error" + err);
          cb();
        });
      }
    ], function(err) {
      if(err) {
        smtpTransport.close();
        return response.send("Backup failed", 500);
      }
      var mail = {
        from: sails.config.smtp_username,
        to: backup_email,
        subject: "Territory Manager Backup " + now,
        text: "\n\n------- TERRITORIES --------\n\n" +
        JSON.stringify(all_territories) + 
        "\n\n------- HOLDERS ------------\n\n" +
        JSON.stringify(all_holders),
      }
      smtpTransport.sendMail(mail, function(error, res){
        if(error){
          console.log(error);
        }else{
          smtpTransport.close();
          var next = typeof request.query.next != 'undefined' ? request.query.next : '/territory';
          return response.redirect(next);
        }
      });      
    });
  },

  sendNotificationEmails : function(request, response) {
    // create reusable transport method (opens pool of SMTP connections)
    var smtpTransport = nodemailer.createTransport("SMTP",{
        service: "Gmail",
        auth: {
          user: sails.config.smtp_username,
          pass: sails.config.smtp_password
        }
    });

    Territory.find().exec(function(err, t_all) {
      Holder.find().exec(function(err, h_all) {
        var new_territory_taken_emails = 0;
        var territory_removed_emails = 0;
        var not_covered_territory_emails = 0;
        var now = new Date();
        now = now.getTime();
        var mails = [];
        var t_to_be_updated = [];
        var not_covered_limit = now - (1000*60*60*24*sails.config.limit_for_email_notification);
        for(var i = 0; i < t_all.length; i++) {
          if(t_all[i].notificationEmailDate ) {
            var reallyTaken = new Date(t_all[i].reallyTaken);
            reallyTaken = reallyTaken.getTime();
            var last_email_sent = new Date(t_all[i].notificationEmailDate);
            last_email_sent = last_email_sent.getTime();
            // holder is not default, and email is not sent
            if(last_email_sent < reallyTaken && t_all[i].holder != sails.config.default_territory_holder_id) {
              new_territory_taken_emails++;
              t_to_be_updated.push(t_all[i]);
              var mail = createEmailObject(t_all[i], t_all, h_all, sails.config.notificationEmail_new_territory);
              if(typeof mail != 'undefined') {
                mails.push(mail);
              }
            } 
            // holder is now default and email is not sent
            if(last_email_sent < reallyTaken && t_all[i].holder == sails.config.default_territory_holder_id) {
              territory_removed_emails++;
              t_to_be_updated.push(t_all[i]);
              var mail = createEmailObject(t_all[i], t_all, h_all, sails.config.notificationEmail_removed_territory);
              if(typeof mail != 'undefined') {
                mails.push(mail);
              }
            }
            // not_covered_limit is expired and email is not sent
            var taken = new Date(t_all[i].taken);
            taken = taken.getTime();
            if(not_covered_limit > taken && last_email_sent < (now - 30*1000*60*60*24) && t_all[i].holder != sails.config.default_territory_holder_id) {
              not_covered_territory_emails++;
              t_to_be_updated.push(t_all[i]);
              var mail = createEmailObject(t_all[i], t_all, h_all, sails.config.notificationEmail_notCovered_territory);
              if(typeof mail != 'undefined') {
                mails.push(mail);
              }
            }
          } else if(!t_all[i].notificationEmailDate && t_all[i].holder != sails.config.default_territory_holder_id) {
            var mail = createEmailObject(t_all[i], t_all, h_all, sails.config.notificationEmail_new_territory);
            t_to_be_updated.push(t_all[i]);
            if(typeof mail != 'undefined') {
              mails.push(mail);
            }
          }
        }
        async.each(t_to_be_updated, function(t, callback) {
          t.notificationEmailDate = new Date();
          t.save(function(err){
            callback();
          })
        }, function(result) {
          console.log("trying to send mails", mails)
          async.each(mails, function(mail, callback) {
            smtpTransport.sendMail(mail, function(error, response){
              if(error){
                console.log(error);
              }else{
                console.log("Message sent: " + response.message);
              }
              callback();
            });
          }, function() {
            smtpTransport.close(); // shut down the connection pool, no more messages
            Trace.create(common.createTrace(request.user[0].username, "Sent " + mails.length + " email notifications.", false))
            .exec(function(err, trace) { 
              var next = typeof request.query.next != 'undefined' ? request.query.next : '/territory';
              return response.redirect(next);
            });
          });
        });
      });
    });
  },

  destroy : function(request, response) {
    pageOptions.breadcrumbs = [{name : 'Territories', link : '/territory'}, {name: 'Remove territory', link:null}];
    pageOptions.currentUsername = request.user[0].username; 
    if(!request.user || request.user[0].username != "admin") {
      return response.send("Forbidden", 403);
    }    
    if(request.method == 'GET') {
      Territory.find().exec(function(err, t) {
        return response.view({
          territories : t,
          viewOptions : pageOptions,
          actionResult : "Please select a territory to be removed."
        });
      });

    } else if(request.method == 'POST') {
      if(!request.body.input_id) {
        return response.send("The territory is not specified", 500);
      }
      Territory.destroy({ 'id' : request.body.input_id }).done(function(err){
        if(err) response.send(err, 500);
        console.log("Removed " + request.body.input_id);
        return response.redirect('/territory/destroy');
      });
    }
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
          type : request.body.input_type, 
          covered : request.body.input_covered_date,
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
              lastNumber : data.territoryNumber,
              lastLat : data.lat,
              lastLng : data.lng,
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
              if(!h) {
                return response.json("Holder " + request.body.input_holder +  " is not in the system. Add her first.", 500);
              }
              if(t.holder != h.id) {
                t.reallyTaken = new Date();
              }
              if(!t.holderHistory) {
                t.holderHistory = [];
              }
              var now = new Date();
              var lastCoveredTime_old = t.lastCoveredTime;
              if(t.holder != sails.config.default_territory_holder_id) {
                var taken = new Date(t.taken);
                t.lastCoveredTime = now.getTime() - taken.getTime();
              }
              // If the last covered time was less than 15 min, we will remove the
              // data from territory history
              if(t.holderHistory.length >= 1 && t.lastCoveredTime < 1000*60*15 && t.lastCoveredTime != 0) {
                console.log("Mistake holder change detected: " + t.territoryCode);
                t.lastCoveredTime = lastCoveredTime_old;
                t.holderHistory.splice(-1,1);
              }
              t.holderHistory.push([t.holder, now]);
              t.holder = h.id;
              t.taken = new Date();
              async.parallel([
                function(cb) {
                  t.save(function(err) {
                    if(err) cb(err);
                    cb();
                  });
                }, function(cb) {
                  Trace.create(common.createTrace(request.user[0].username, "Territory " + t.territoryCode + " assigned to " + request.body.input_holder))
                  .exec(function(err, trace) { 
                    if(err) cb("error" + err);
                    cb();
                  });
                }
              ], function(err) {
                if(err) return response.send(err, 500);
                return response.redirect('territory/' + request.body.input_letter + '/' + request.body.input_number);
              })
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
        new_t.holder_is_default = (t[i].holder == sails.config.default_territory_holder_id ? true : false);
        new_t.holder = undefined;
        new_t.description = undefined;
        new_t.history = undefined;
        anon_t.push(new_t);
      }
      if(!err && anon_t.length > 0) {
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

  mapdata : function(request, response) {
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
        new_t.holder_is_default = (t[i].holder == sails.config.default_territory_holder_id ? true : false);
        new_t.holder = undefined;
        new_t.description = undefined;
        new_t.history = undefined;
        anon_t.push(new_t);
      }
      if(!err && anon_t.length > 0) {
        return response.json(anon_t);
      } else {
        return response.send("Error: " + err, 500)
      }
    });
  },

  reset : function(request, response) {
    if(!request.user || request.user[0].username != "admin") {
      return response.send("Forbidden", 403);
    } else {
      var today = new Date();
      Territory.update(
        {},
        {
          lastCoveredTime:0,
          notificationEmailDate: today,
          taken: today,
          reallyTaken: today,
          holderHistory:[],
          holder: sails.config.default_territory_holder_id
        }
      )
      .exec(function(err, t) {
        if(!err) {
          return response.send("All territory data is now reset.", 200);
        } else {
          return response.send("Error: " + err, 500)
        }
      });
    }
  },

  s13 : function(request, response) {
    pageOptions.defaultHolderName = sails.config.default_territory_holder;
    var possibleLetters = figureOutPossibleLetters();
    Territory.find().sort('territoryLetter').sort('territoryNumber')
    .exec(function(err, t) {
      Holder.find()
      .exec(function(err, h) {
        // Match current holder id's with holder names
        var t_with_holder_names = convertHolderIDtoName(t, h);

        // Match territory holderHistory[0] with holder id and replace with name
        for(var i = 0; i < t_with_holder_names.length; i++) {
          if(Object.prototype.toString.call( t_with_holder_names[i].holderHistory ) === '[object Array]') { 
            t_with_holder_names[i].holderHistoryWithNames = [];
            for(var k = 0; k < t_with_holder_names[i].holderHistory.length; k++) {
              for(var j = 0; j < h.length; j++) {
                if(h[j].id == t_with_holder_names[i].holderHistory[k][0]) {
                  // t_with_holder_names[i].holderHistory[k][0] = h[j].name;
                  t_with_holder_names[i].holderHistoryWithNames.push([h[j].name, t_with_holder_names[i].holderHistory[k][1]]);
                  break;
                } else if( j == h.length - 1) {
                  // t_with_holder_names[i].holderHistory[k][0] = 'Removed holder';
                  t_with_holder_names[i].holderHistoryWithNames.push(['Removed holder', t_with_holder_names[i].holderHistory[k][1]]);
                }
              }
            }
          } else {
            t_with_holder_names[i].holderHistory = [];
            t_with_holder_names[i].holderHistoryWithNames = [];
          }
        } 
        if(!err && t_with_holder_names.length > 0) {
          if(request.wantsJSON) {
            return response.json(t_with_holder_names);
          }
          return response.view({
            viewOptions : pageOptions,
            availableLetters : possibleLetters,
            territories : t_with_holder_names
          }); 
        } else {
          return response.send("Error: " + err, 500)
        }        
      })

    });
  },

  stats : function(request, response) {
    pageOptions.defaultHolderName = sails.config.default_territory_holder;
    pageOptions.breadcrumbs = [{name : 'Territories', link : '/territory'}, {name : 'Stats', link : null}];
    Territory.find().exec(function(err, t) {
      var average_covered_time = 0;
      var average_holding_time = 0;
      var total_count = t.length;
      var available_count = 0;
      var not_covered_count = 0;
      var covered_sometime_count = 0;
      var phone_count = 0;
      var business_count = 0;
      var not_covered_bp_count = 0;
      var now = new Date();
      var not_covered_limit = now.getTime() - (1000 * 60 * 60 * 24 * sails.config.limit_for_rarely_covered_territory);
      for(var i = 0; i < t.length; i++) {
        var covered = new Date(t[i].taken);
        covered = covered.getTime();
        if (typeof t[i].lastCoveredTime != 'undefined' && t[i].lastCoveredTime != 0) {
          average_covered_time += t[i].lastCoveredTime;
          covered_sometime_count++;
        } 
        if(t[i].type && t[i].type == "Phone") {
          phone_count++;
          if(covered < not_covered_limit) {
            not_covered_bp_count++;
          }
        } else if(t[i].type && t[i].type == "Business") {
          business_count++;
          if(covered < not_covered_limit) {
            not_covered_bp_count++;
          }
        } 
        if (covered < not_covered_limit) {
          not_covered_count++;
        }
        if(t[i].holder != sails.config.default_territory_holder_id) {
          var holding = new Date(t[i].reallyTaken);
          average_holding_time += ( now.getTime() - holding.getTime() );
        } else {
          available_count++;
        }
      }
      if(covered_sometime_count != 0)
        average_covered_time = average_covered_time / covered_sometime_count;
      if((t.length - available_count) != 0)
        average_holding_time = average_holding_time / ( t.length - available_count );
      not_covered_count -= not_covered_bp_count;
      total_count -= (phone_count + business_count);
      App.find().exec(function(err, a) {
        if(err || a.length == 0) return response.send("error", 500);
        var now = new Date();
        var msInDay = 24*60*60*1000;        
        if(a[0].lastStats == null) {
          var lastTime = new Date(now.getTime() - msInDay - 1);
        } else {
          var lastTime = new Date(a[0].lastStats);
        }
        if(now.getTime() - lastTime.getTime() > msInDay) {
          a[0].lastStats = now;
          a[0].save(function(err) {
            if(err) return response.send("error", 500);
            Stats.create({
              statistic_date : new Date(),
              average_covered_time : average_covered_time,
              average_holding_time : average_holding_time,
              total_count : total_count,
              not_covered_count : not_covered_count,
              phone_count : phone_count,
              business_count : business_count,
              not_covered_bp_count : not_covered_bp_count,
              available_count : available_count
            }).done(function(err, s) {
              if(err) return response.send("error", 500);
              Stats.find().exec(function(err, all_stats) {
                if(err) return response.send("error", 500);
                if(request.wantsJSON) {
                  return response.json(all_stats);
                }
                Trace.create(common.createTrace(request.user[0].username, "Checked the statistics, and created new stats for current day."))
                .exec(function(err, trace) { 
                  return response.view({
                    viewOptions : pageOptions,
                    all_stats : all_stats,
                    average_covered : formDaysMonthsYearsObject(average_covered_time),
                    average_holding : formDaysMonthsYearsObject(average_holding_time),
                    count : total_count,
                    available_count : available_count,
                    phone_count : phone_count,
                    business_count : business_count,
                    not_covered_bp_count : not_covered_bp_count,
                    not_covered_count : not_covered_count
                  });
                });
              });
            });            
          })
        } else {
          Stats.find().exec(function(err, all_stats) {
            if(err) return response.send("error", 500);
            if(request.wantsJSON) {
              return response.json(all_stats);
            }
            Trace.create(common.createTrace(request.user[0].username, "Checked the statistics."))
            .exec(function(err, trace) { 
              return response.view({
                viewOptions : pageOptions,
                all_stats : all_stats,
                average_covered : formDaysMonthsYearsObject(average_covered_time),
                average_holding : formDaysMonthsYearsObject(average_holding_time),
                count : total_count,
                available_count : available_count,
                phone_count : phone_count,
                business_count : business_count,
                not_covered_bp_count : not_covered_bp_count,
                not_covered_count : not_covered_count
              });
            });
          });
        }
      });
    });
  },

  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to TerritoryController)
   */
  _config: {}

};
