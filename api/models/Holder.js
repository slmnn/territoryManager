/**
 * Holder
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

  attributes: {
  	
  	name : {
  		type : "STRING",
  		required : true,
      unique : true
  	},

  	email : {
  		type : "email",
  		required : true
  	},

    emailValid : {
      type : "boolean",
      required : true
    }
  	
  }

};
