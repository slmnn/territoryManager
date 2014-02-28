// Location: /config/passport.js
var passport    = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
  simplecrypt = require('simplecrypt');

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
        return done(null, false, { message: 'Incorrect User'}); 
      }
      try {
        var sc = simplecrypt({salt:sails.config.sc_salt, password:sails.config.sc_password});
      } catch(err) {
        console.log(err);
        return done(null, false, { message: err});
      }
      if(sc.encrypt(password) == user[0].password) {
        return done(null, user);
      } else {
        return done(null, false, { message: 'Invalid Password'});
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