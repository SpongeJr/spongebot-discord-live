const cons = require('../lib/constants.js');
const utils = require('../lib/utils.js');
const events = require('../../data/events.json');

module.exports = {
	setTimeoutForEvent: function(event, BOT) {
		// returns: a string indicating result:
		// "fail", "success", or "announcedLate"

		let now = new Date().valueOf();	
		let apologyText = cons.TIMEY.lateEventAnnounceText;
		if (event.announceTime < now) {
			// has eventTime passed? If not, announce late...
			if (event.eventTime < now ) {
				return "fail";
			} else {
				event.announceChannels.forEach((chanId) => {
					BOT.channels.get(chanId).send(apologyText + event.announceText);
				});
				return "announcedLate";
			}
		} else {		
			setTimeout(function() {
				event.announceChannels.forEach((chanId) => {
					BOT.channels.get(chanId).send(event.announceText);
				});
			}, event.announceTime - now);
		}
		return "success";
	},
	init: function(BOT) {	
		console.log("-- timey.init(): Setting event timers from event.json...");
		
		let eventCount = 0;
		let failedCount = 0;
		let announcedLateCount = 0;
		for (let event in events) {
			let thisEvent = events[event];
			eventCount++;
			let success = this.setTimeoutForEvent(events[event], BOT);
			
			if (success === "fail") {
				console.log(`-- timey.init(): Event announceTime and eventTime for "${thisEvent.eventName}" ` +
				  `are both in the past! announceTime: ${thisEvent.announceTime}; now: ${Date.now()}`);
				failedCount++;
			} else if (success === "announcedLate") {
				console.log(`-- timey.init(): Event announceTime for "${thisEvent.eventName}" ` +
				  `is in the past! Announcing immediately! announceTime: ${thisEvent.announceTime}; now: ${Date.now()}`);
				announcedLateCount++;
			}
		}
		console.log(`-- timey.init: Event timers set for ${eventCount - (failedCount + announcedLateCount)}` +
		  ` of ${eventCount} events. (${failedCount} failed, ${announcedLateCount} announcedLate)`);
	},
	timeStr: function(args) {
		
		// TODO: this is kind of a mess, redo someday
		
		let timeCmd = args[0];
		args.shift();
		let when = args.join(" ");
		
		if (when === "" || typeof when === "undefined") {
			when = new Date();
		} else {
			when = new Date(when);
		}

		if (!timeCmd) {
			return when.toTimeString();
		}
		
		if (timeCmd === 'long') {
			return when.toString();
		}
		
		if (timeCmd === 'iso') {
			return when.toISOString();
		}
		
		if (timeCmd === 'raw') {
			return when.valueOf();
		}
		
		if (timeCmd === 'diff') {
			// <t1, t2>, returns difference between the two -- either order (abs value)
			var timeElapsed = utils.msToTime(Math.abs(parseInt(args[0]) - parseInt(args[1])));
			return timeElapsed;
		}
		
		if ((timeCmd === 'nextWeek') || (timeCmd === 'nextDay')) {
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
	},
	commands: {
		uptime: {
			subCmd: {},
			help: "See how since SpongeBot came online.",
			longHelp: "See how since SpongeBot came online.",
			do: function(message, args, gameStats, gbl) {
				let outStr = "";
				outStr += `I woke up at ${gbl.onlineTimestamp}.`;
				
				utils.chSend(message, outStr);
			},
		},
		downtime: {
			subCmd: {},
			help: "See how since SpongeBot was down.",
			longHelp: "See how since SpongeBot was down.",
			do: function(message, args, gameStats, gbl) {
				let outStr = "";
				let onTime = new Date(gbl.onlineTimestamp);
				let nowTime = new Date();
				let sinceDown = utils.msToTime(nowTime - onTime);
				outStr += `It has been \` ${sinceDown}\` since the last crash or restart.`;
				
				utils.chSend(message, outStr);
			},
		}
		
	}
};