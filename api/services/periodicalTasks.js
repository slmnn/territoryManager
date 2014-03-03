var schedule = require('node-schedule');

var p = schedule.scheduleJob('*/5 * * * *', function(){
    console.log('The answer to life, the universe, and everything!');
});

module.exports = {
	printJob : p
};