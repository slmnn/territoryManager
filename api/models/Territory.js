/**
 * Territory
 *
 * @module      :: Model
 * @description :: A single territory
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

  attributes: {
  	
  	/* Tells the rough direction of a territory */
  	territoryLetter : {
  		type : "STRING"
  	},

  	/* Identifies the territory */
  	territoryNumber : {
  		type : "INTEGER",
  		min : 0
  	},

  	/* Territory code (letter+number) */
  	territoryCode : {
  		type : "STRING"
  	},

    /* How long it took to cover the territory */
    lastCoveredTime : "INTEGER",

  	/* When the territory is "taken" to a person or admin */
    taken : "DATE",

    /* When the holder was really changed last time? */
  	reallyTaken : "DATE",

    /* Not active anymore */
    archived : "BOOLEAN",

    /* type: normal, phone, business */
    type : "STRING",

    /* History of holders */
    holderHistory : {
      type : "ARRAY"
    },

  	/* Holder id */
    holder : "STRING",

    /* Coordinates */
    lat : "FLOAT",
  	lng : "FLOAT",

    /* Description */
    description : "STRING"
    
  }

};
