// Location: /config/passport.js
var passport    = require('passport'),
  LocalStrategy = require('passport-local').Strategy;

if(process.env.USE_BCRYPT == 'true') {
  var bcrypt = require('bcrypt');
} else {
  var simplecrypt = require('simplecrypt');
}

passport.serializeUser(function(user, done) {
  done(null, user[0].id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findByUsername(username).done(function(err, user) {
      if (err) { console.log(err); return done(null, err); }
      if (!user || user.length < 1) { 
        Trace.create(common.createTrace('unknown', "Failed log in attempt because of incorrect username ("+ username +")", true))
        .exec(function(err, trace) { 
          return done(null, false, { message: 'Incorrect User'}); 
        });
      }
      if(process.env.USE_BCRYPT == 'true') {
        bcrypt.compare(password, user[0].password, function(err, res) {
          if (!res) {
            Trace.create(common.createTrace(username, "Failed log in attempt because of wrong password.", true))
            .exec(function(err, trace) { 
              return done(null, false, { message: 'Invalid Password'}); 
            });
          }
          return done(null, user);
        });
      } else {
        try {
          var sc = simplecrypt({salt:sails.config.sc_salt, password:sails.config.sc_password});
        } catch(err) {
          console.log(err);
          return done(null, false, { message: err});
        }
        if(user[0] && sc.encrypt(password) == user[0].password) {
          return done(null, user);
        } else {
          Trace.create(common.createTrace(username, "Failed log in attempt because of wrong password.", true))
          .exec(function(err, trace) { 
            return done(null, false, { message: 'Invalid Password'}); 
          });
        }
      }
    });
  })
);

module.exports = {
 express: {
    customMiddleware: function(app){
      app.use(passport.initialize());
      app.use(passport.session());
    }
  }
};