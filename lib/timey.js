const cons = require('../lib/constants.js');
const utils = require('../lib/utils.js');

module.exports = {
	timeStr: function(parms, when) {		
		if (!parms[0]) {
			return when.toTimeString();
		}
		
		if (parms[0] === 'long') {
			return when.toString();
		}
		
		if (parms[0] === 'iso') {
			return when.toISOString();
		}
		
		if (parms[0] === 'raw') {
			return when.valueOf();
		}
		
		if (parms[0] === 'diff') {
			// <t1, t2>, returns difference between the two -- either order (abs value)
			var timeElapsed = msToTime(Math.abs(parseInt(parms[1]) - parseInt(parms[2])));
			return timeElapsed;
		}
		
		if ((parms[0] === 'nextWeek') || (parms[0] === 'nextDay')) {
			// <time> tells how long from now until <time + (1 day | 1 week)> or if it's already passed
			var howMuch;
			if (parms[0] === 'nextWeek') {howMuch = cons.ONE_WEEK;} else {howMuch = cons.ONE_DAY;}
			when = parseInt(parms[1]) + howMuch - when.valueOf();
			if (when < 0) {
				return 'That was ' + msToTime(Math.abs(when)) + ' ago';
			} else {
				return 'Coming up in ' + msToTime(when);	
			}
		}
	}
};