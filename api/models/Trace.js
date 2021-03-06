/**
* Trace.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
  	
  	username: {
  		type:"string",
  		required: true
  	}, 

  	description: {
  		type: "string",
  		required: true
  	}, 

  	trace_date: {
  		type: "datetime",
  		required: true
  	},

    only_admin: {
      type: "boolean"
    }

  }
};

