/**
 * Stats
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

  attributes: {
  	
  	/* e.g.
  	nickname: 'string'
  	*/

  	statistic_date: 'datetime',
  	average_covered_time: 'integer',
  	average_holding_time: 'integer',
  	total_count: 'integer',
  	not_covered_count: 'integer',
  	available_count: 'integer'
    
  }

};
