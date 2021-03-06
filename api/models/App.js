/**
 * App
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

  attributes: {
  	
  	lastBackup : "DATE",
  	backupInterval : "INTEGER",
  	backupEmail : "string",

  	lastStats : "DATE",

  	notCoveredLimit : "INTEGER",
  	notCoveredWarningEmailLimit : "INTEGER"
    
  }

};
