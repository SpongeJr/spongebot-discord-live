const cons = require('../lib/constants.js');
const utils = require('../lib/utils.js');
const events = require('../' + cons.EVENTS_FILENAME);
const vars = {
	unsavedEvents: {},
	requiredProps: ["title", "eventName", "eventTime", "announceTime", "announceText", "announceChannels"]
};
const setTimeoutForEvent = function(event, BOT) {
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
			
			if (typeof event.announceChannels === "string") {
				// single channel string
				BOT.channels.get(event.announceChannels).send(event.announceText);
			} else {
				// assume array of channel strings
				event.announceChannels.forEach((chanId) => {
					BOT.channels.get(chanId).send(event.announceText);
				});
			}
		}, event.announceTime - now);
	}
	return "success";
};
module.exports = {
	setTimeoutForEvent: setTimeoutForEvent,
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
		/*
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
		*/
		if (timeCmd === 'whenis') {
			// tries to make a new Date object with the rest of the command line
			// outputs:
			//	- The date again, in ISO format
			//	- The date in raw format (milliseconds)
			//	- How long until that date in milliseconds
			//	- How long until that date word form (msToTime)
			
			// Other possible arguments / improvements:
			// 	- one week for one week from now, one day, etc.
			//	- a whole date language parser? (!time whenis 3 months 2 weeks 1 day 8 hours 3 seconds)
			
			/*
					ISO STRING (RAW 23478923789 ms)
					"is coming up in / was X ago" (msToTime)  (RAW 234789 ms)
			*/
			
			let then = new Date(when);
			if (isNaN(then.valueOf())) {
				return;
			} else {
				let now = new Date().valueOf();
				let outStr = "";
				let diffRaw = Math.abs(then - now);
				let diffStr = utils.msToTime(diffRaw);
				outStr += `\n${then.toISOString()} | RAW: ${then.valueOf()} ms\n`;
				outStr += (then < now) ? `was ${diffStr} ago` : `Coming up in ${diffStr}`;
				outStr += ` | RAW: ${diffRaw}`;
				return outStr;
			}
		}
	},
	commands: {
		uptime: {
			subCmd: {},
			help: "See how long since SpongeBot came online.",
			longHelp: "See how since SpongeBot came online.",
			do: function(message, args, gameStats, gbl) {
				let outStr = "";
				
				let onTime = new Date(gbl.onlineTimestamp);
				let nowTime = new Date();
				let sinceDown = utils.msToTime(nowTime - onTime);
				outStr += `I woke up at ${onTime}. `;
				outStr += `It has been \` ${sinceDown}\` since the last crash or restart.`;
				utils.chSend(message, outStr);
			}
		},
		setevent: {
			subCmd: {},
			help: "Setup an event.",
			longHelp: "Setup an event. Syntax: setevent <property> <value>\nUse `addevent` to save." +
			  "\n setevent <property> with no value specified queries a property.",
			do: function(message, args, gameStats, bankroll, BOT) {
				let userId = message.author.id;
				let outP = "";
				let prop = args[0];
				args.shift();
				let value = args.join(" ");
				let unsaved = vars.unsavedEvents;
				
				if (args[0] === "" || typeof args[0] === "undefined") {
					// no property specified, so list everything	
					if (typeof unsaved[userId] !== "object") {
						outP += "Sorry, you don't have an event set up. Use `setevent <property> <value> to start setting one up`!";
					} else {
						outP += ` \`EVENT: ${unsaved[userId].title}\``;
						for (let prop in unsaved[userId]) {
							outP += `\n${prop}: ${unsaved[userId][prop]}`;
						}
					}
				} else {
					// property specified...
					if (value === "" || typeof value === "undefined") {
						// query
						if (typeof unsaved[userId][prop] !== "object") {
							outP += `Your unsaved event does not have a property \`${prop}\`.`;
							outP += `\nYou can create one with \`setevent ${prop} <value>\``;
						} else {
							let queriedVal = unsaved[userId][prop];
							outP += `Your unsaved event property \`${prop}\`: ${queriedVal}`;
						}
					} else {
						// set
						if (typeof unsaved[userId] !== "object") {
							outP += "Created a new unsaved event for you.\n";
							vars.unsavedEvents[userId] = {};
						}
						vars.unsavedEvents[userId][prop] = value;
						outP += `Set property \`${prop}\` of your unsaved event to: ${value}`;
					}
				}
				utils.chSend(message, outP);
			}
		},
		addevent: {
			subCmd: {},
			help: "Add an event.",
			longHelp: "Save an event that you have setup with `setevent`.",
			do: function(message, args, gameStats, bankroll, BOT) {
				let requiredProps = vars.requiredProps;
				let userId = message.author.id;
				let outP = "";
				let unsaved = vars.unsavedEvents;
				
				if (typeof unsaved[userId] !== "object") {
					outP += "Sorry, you don't have an event set up to save. Use `setevent` first!";
				} else {
					let failed = false;
					requiredProps.forEach(function(prop) {
						if (typeof unsaved[userId][prop] === "undefined") {
							failed = true;
							outP += ` :no_entry_sign: Missing property: ${prop}\n`;
						}
					});
					
					if (!failed) {
						// for now we use .title as the key in events, and all the other properties under that
						let title = unsaved[userId].title;
						events[title] = {};
						
						for (let prop in unsaved[userId]) {
							events[title][prop] = unsaved[userId][prop];
						}
						
						console.log('!addevent: Adding the following record to events.json:');
						console.log(events[title]);
						
						utils.saveObj(events, cons.EVENTS_FILENAME);
						
						let thisEvent = events[title];
						let success = setTimeoutForEvent(events[title], BOT);
						
						if (success === "fail") {
							outP += `-- timey.init(): Event announceTime and eventTime for "${thisEvent.eventName}" ` +
							  `are both in the past! announceTime: ${thisEvent.announceTime}; now: ${Date.now()}`;
						} else if (success === "announcedLate") {
							outP += `-- timey.init(): Event announceTime for "${thisEvent.eventName}" ` +
							  `is in the past! Announcing immediately! announceTime: ${thisEvent.announceTime}; now: ${Date.now()}`;
						} else {
							outP += `Event \`${title}\` has been added... hopefully!`;
						}
					} else {
						outP += "\nEvent not saved, there were errors.";
					}
				}
				utils.chSend(message, outP);
			}
		}
	}
};