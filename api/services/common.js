module.exports = {
  createTrace : function(in_username, in_description, in_only_admin) {
	  var now = new Date();
	  in_only_admin = in_only_admin ? true : false;
	  return {
	  	username: in_username, 
	  	description: in_description, 
	  	trace_date: now, 
	  	only_admin: in_only_admin
	  }
  }
};