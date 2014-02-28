/**
 * User
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

var simplecrypt = require('simplecrypt');

module.exports = {

  attributes: {
  	
    username: {
      type: 'string',
      required: true,
      unique: true
    },

    password: {
      type: 'string',
      required: true
    },

    //Override toJSON method to remove password from API
    toJSON: function() {
      var obj = this.toObject();
      // Remove the password object value
      delete obj.password;
      // return the new object without password
      return obj;
    }
  },
  beforeUpdate: function(user, cb) {
    var sc = simplecrypt({salt:sails.config.sc_salt, password:sails.config.sc_password});
    user.password = sc.encrypt(user.password);
    cb(null, user);
  },
  beforeCreate: function(user, cb) {
    var sc = simplecrypt({salt:sails.config.sc_salt, password:sails.config.sc_password});
  	user.password = sc.encrypt(user.password);
  	cb(null, user);
  }

};
