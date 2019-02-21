const cons = require('../lib/constants.js');
const utils = require('../lib/utils.js');

module.exports = {
	timeStr: function(args, when) {		
		if (!args[0]) {
			return when.toTimeString();
		}
		
		if (args[0] === 'long') {
			return when.toString();
		}
		
		if (args[0] === 'iso') {
			return when.toISOString();
		}
		
		if (args[0] === 'raw') {
			return when.valueOf();
		}
		
		if (args[0] === 'diff') {
			// <t1, t2>, returns difference between the two -- either order (abs value)
			var timeElapsed = utils.msToTime(Math.abs(parseInt(args[1]) - parseInt(args[2])));
			return timeElapsed;
		}
		
		if ((args[0] === 'nextWeek') || (args[0] === 'nextDay')) {
			// <time> tells how long from now until <time + (1 day | 1 week)> or if it's already passed
			let howMuch;
			if (args[0] === 'nextWeek') {howMuch = cons.ONE_WEEK;} else {howMuch = cons.ONE_DAY;}
			when = parseInt(args[1]) + howMuch - when.valueOf();
			if (when < 0) {
				return 'That was ' + utils.msToTime(Math.abs(when)) + ' ago';
			} else {
				return 'Coming up in ' + utils.msToTime(when);
			}
		}
	}
};