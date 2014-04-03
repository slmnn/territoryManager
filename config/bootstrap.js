/**
 * Bootstrap
 *
 * An asynchronous boostrap function that runs before your Sails app gets lifted.
 * This gives you an opportunity to set up your data model, run jobs, or perform some special logic.
 *
 * For more information on bootstrapping your app, check out:
 * http://sailsjs.org/#documentation
 */

module.exports.bootstrap = function (cb) {

  // It's very important to trigger this callack method when you are finished 
  // with the bootstrap!  (otherwise your server will never lift, since it's waiting on the bootstrap)
  App.find().exec(function(err, a) {
  	sails.config.limit_for_rarely_covered_territory = a[0].notCoveredLimit || 365;
  	sails.config.limit_for_email_notification = a[0].notCoveredWarningEmailLimit || 180;
	  cb();  	
  })
};