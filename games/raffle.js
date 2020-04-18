// raffle.js Raffle module for SpongeBot
// By SpongeJr

const utils = require('../lib/utils.js');
const cons = require('../lib/constants.js');
const raffleData = require('../../data/raffle.json');
const giveaways = require('../../data/giveaways.json');
const sortRaffleData = function(rData) {
	// pass a raffleData object,
	// get back an Array with .id and .date properties, sorted by date
	let raffleDataArr = [];
	for (let raffleId in rData) {
		raffleDataArr.push({"id": raffleId, "date": rData[raffleId].date});
	}
	raffleDataArr.sort(utils.objSort("date"));
	return raffleDataArr;
};

module.exports = {
	startNum: 1,
	v: {},
	runraffle: {
		do: function(message, parms, gameStats) {
			let who = message.author.id;
			if (who !== cons.SPONGE_ID) {
				utils.chSend(message, "Sorry, only Sponge can start raffles right now!");
				return;
			}

			let raffleId = parms;

			if (!raffleData[raffleId]) {
				utils.chSend(message, "That's not a valid raffle ID.");
				return;
			}

			let when = raffleData[raffleId].date;
			let now = new Date().valueOf();
			let diff = Math.abs(now - when);

			if (now < when) {
				utils.chSend(message, `:hourglass: It's not time for the **${raffleId}** raffle for another ${utils.msToTime(diff)}!`);
				return;
			}
			utils.chSend(message, ":tickets: :tickets: :tickets: RAFFLE TIME! :tickets: :tickets: :tickets:");

			let entrants = [];
			let str = '\n Who is entered: ';
			for (let playerId in gameStats) {
				if (gameStats[playerId].raffle) {
					if (gameStats[playerId].raffle.entered) {
						if (gameStats[playerId].raffle.entered[raffleId]) {
							entrants.push({
								"who": playerId,
								"tickets": gameStats[playerId].raffle.entered[raffleId]
							});
						}
					}
				}
			}

			let totalEntrants = 0;
			let totalTickets = 0;
			let currentNum = 0;
			for (let entrantNum = 0; entrantNum < entrants.length; entrantNum++) {

				let nick = "";
				let who = entrants[entrantNum].who
				if (gameStats[who].profile) {
					nick = gameStats[who].profile.nick || "?";
				}
				let tix = entrants[entrantNum].tickets;
				let endNum = currentNum + tix - 1;

				let rangeStr = "\n#" + `${currentNum + 1} - ${endNum + 1}`.padStart(12, " ");

				str += "\n`" + rangeStr + "`";
				str += `(:tickets: x ${tix}): **${nick}** (${who})`;
				currentNum = endNum + 1;
				totalEntrants++;
				totalTickets += tix;
			}

			str += `\n\n TOTAL ENTRANTS: [ **${totalEntrants}** ]  ...  TOTAL TICKETS ENTERED: [ **${totalTickets}** ]`;
			utils.chSend(message, str);
		}
	},
	list: {
		do: function(message, parms, gameStats) {

			let who = message.author.id;
			let raffleStat = gameStats[who].raffle || {};
			let now = new Date();
			raffleStat.entered = raffleStat.entered || {};

			str = "";
			str += "` LIST OF SCHEDULED RAFFLES:` ";
			str += "(use `raffle info` followed by an ID to get details!)";

			// build arrays and sort
			let raffleDataArr = sortRaffleData(raffleData);

			if (raffleDataArr.length === 0) {
				str = "There are no raffles to list right now, sorry. Check back later.";
				utils.chSend(message, str);
				return;
			}

			let pastHadRaffles = (raffleDataArr[0].date < now.getTime());

			if (pastHadRaffles) {
				str += "`\n --- Recent past raffles: ---`"
			}
			let futureRaffleTextShown = false;
			for (let raffleItem of raffleDataArr) {
				if (pastHadRaffles && !futureRaffleTextShown) {
					if (raffleItem.date >= now.getTime()) {
						str += "\n` --- Upcoming raffles: ---`"
						futureRaffleTextShown = true;
					}
				}
				str += `\nID: **${raffleItem.id}**\n`;
				whenStr = new Date(raffleItem.date);
				str += `  is scheduled to take place on: ${whenStr}\n`;
				tixEntered =  raffleStat.entered[raffleItem.id];
				if (tixEntered) {
					str += `  _You have ${tixEntered} tickets entered._\n`;
				}
			}
			console.log(`--- !raffle list message length was ${str.length}`);
			utils.chSend(message, str);
		}
	},
	enter: {
		do: function(message, parms, gameStats) {
			let who = message.author.id;

			if (!gameStats[who]) {
				utils.chSend(message, "You don't seem to have any raffle tickets yet!");
				return;
			}

			let raffleStat = gameStats[who].raffle;

			if (!raffleStat) {
				utils.chSend(message, "You don't seem to have any raffle tickets yet!");
				return;
			}

			raffleStat.ticketCount = raffleStat.ticketCount || 0;
			let ticketsOwned = raffleStat.ticketCount;

			parms = parms.split(' ');
			let numTickets = parseInt(parms[0], 10) || 0;
			parms.shift();
			parms = parms.join(' ');
			let raffleId = parms;

			if (numTickets < 1) {
				utils.chSend(message, 'Use `enter <# of tickets> <raffle ID>` to enter a raffle.\n' +
				  'Example: `enter 7 awesomegame` to enter a raffle called "awesomegame" with 7 of your tickets.');
				return;
			} else if (numTickets > ticketsOwned) {
				utils.chSend(message, `You can't enter ${numTickets} because you only have ${ticketsOwned}!`);
				return;
			}

			// if we're here, we have legitimate ticket number. check raffleId next.

			if (!raffleData.hasOwnProperty(raffleId)) {
				utils.chSend(message, `${raffleId} That's not a valid Raffle ID. Check the list.`);
				return;
			}

			raffleStat.ticketCount -= numTickets;

			if (!raffleStat.entered) {
				raffleStat.entered = {};
			}

			if (!raffleStat.entered[raffleId]) {
				raffleStat.entered[raffleId] = 0;
			}

			raffleStat.entered[raffleId] += numTickets;
			utils.chSend(message, `Okay! I've entered ${numTickets} of your raffle tickets into the "${raffleId}" raffle.` +
			  `\nYou now have ${raffleStat.entered[raffleId]} tickets entered into that raffle, and you have ${raffleStat.ticketCount} tickets left.`);

			utils.setStat(who, "raffle", "ticketCount", raffleStat.ticketCount, gameStats);
			utils.setStat(who, "raffle", "entered", raffleStat.entered, gameStats);
		}
	},
	giveaways: {
		do: function(message, parms, gameStats) {
			utils.chSend(message, "I'm transitioning to a new raffle system right now. " +
			  " The !giveaways command is being replaced by new commands.\n\n" +
			  " Try: \n`!list` instead of `!giveaways list`" +
			  " \n`!addrole giveaways` instead of `!giveaways addrole`");
		}
	},
	subCmd: {
		enter: {
			do: function(message, parms, gameStats) {
				module.exports.enter.do(message, parms, gameStats);
			}
		},
		list: {
			do: function(message, parms, gameStats) {
				module.exports.list.do(message, parms, gameStats);
			}
		},
		info: {
			do: function(message, parms, gameStats) {
				let who = message.author.id;
				let raffleStat = gameStats[who].raffle || {};
				raffleStat.entered = raffleStat.entered || {};
				let str = "";
				let raffleId = parms;
				if (raffleId === "" || typeof raffleId === "undefined") {
					str += "To get more info about a raffle, use: `!raffle info <raffleId>`\n";
					str += "(to list valid raffles, use `!raffle list`)";
				} else {
					if (raffleData.hasOwnProperty(raffleId)) {
						let then = new Date(raffleData[raffleId].date);
						let now = new Date();
						let diffRaw = Math.abs(then - now);
						let diffStr = utils.msToTime(diffRaw);
						let howSoon = "";
						let totalTix = 0;
						let peopleEntered = 0;
						let tixEntered =  raffleStat.entered[raffleId] || 0;
						for (let playerId in gameStats) {
							if (gameStats[playerId].raffle) {
								if (gameStats[playerId].raffle.entered) {
									if (gameStats[playerId].raffle.entered[raffleId]) {
										totalTix += gameStats[playerId].raffle.entered[raffleId];
										peopleEntered++;
									}
								}
							}
						}
						howSoon += (then < now) ? `${diffStr} ago ` : `coming up in ${diffStr}`;
						str += " :tickets: RAFFLE INFO :tickets:\n";
						str += `\`RAFFLE ID:\` ${raffleId}\n`;
						str += `\`SCHEDULED FOR:\` ${then} _( ${howSoon})_\n`;
						str += "\`INFO:\`\n";
						str += raffleData[raffleId].longDesc || " _(no description provided)_";
						str += `\n Total tickets entered: ${totalTix} tickets, by ${peopleEntered} entrants.`;
						str += `\n  Your tickets entered: ${tixEntered}`;
					} else {
						str += `No raffle with id \`${raffleId}\` was found.`;
						str += " Use `raffle list` to list raffles.";
					}
				}
				utils.chSend(message, str);
			}
		},
		remove: {
			do: function(message, parms, gameStats) {
				let str = "";

				// TODO: replace with access check someday
				if (message.author.id !== cons.SPONGE_ID) {
					utils.chSend(message, "Access denied.");
					return;
				}

				let raffleId = parms;

				if (raffleId === "" || typeof raffleId === "undefined") {
					str += "Syntax: `!raffle remove <raffleId>`";
				} else {
					if (raffleData.hasOwnProperty(raffleId)) {
						delete raffleData[raffleId];
						str += `:open_mouth: Raffle with id \`${raffleId}\` removed!`;
						utils.saveObj(raffleData, "raffle.json"); // write to disk
					} else {
						str += ":thinking: I don't see a raffle with that id. You could try `!list`.";
					}
				}
				utils.chSend(message, str);
			}
		},
		add: {
			do: function(message, parms, gameStats) {
				let str = "";

				// TODO: replace with access check someday
				if (message.author.id !== cons.SPONGE_ID) {
					utils.chSend(message, "Access denied.");
					return;
				}

				parms = parms.split(" ");
				let when = parms[0];
				let raffleId = parms[1];
				parms.shift();
				parms.shift();
				let longDesc = parms.join(" ");

				if (when === "" || typeof when === "undefined") {
					str += "Syntax: `!raffle add <timestamp> <raffleId-one-word> <long description>`";
				} else {
					let now = new Date().valueOf();
					when = parseInt(when, 10);
					if (when < now) {
						str += `That raffle would take place in the past, try again. (${when} <= ${now})`;
					} else {
						if (raffleId === "" || typeof raffleId === "undefined") {
							str += "No raffleId supplied. Syntax: `!!raffle add <timestamp> <raffleId-one-word> <long description>";
						} else {
							let howSoon = utils.msToTime(when - now);

							if (raffleData.hasOwnProperty(raffleId)) {
								str += `\nRaffle with id \`${raffleId}\` already existed, updating...\n`;
							}
							str += `Raffle \`${raffleId}\` will take place in: ${howSoon}!`;

							raffleData[raffleId] = {
								"date": when,
								"longDesc": longDesc
							}

							utils.saveObj(raffleData, "raffle.json"); // write to disk
						}
					}
				}
				utils.chSend(message, str);
			}
		},
		ticket: {
			do: function(message, parms, gameStats) {
				// TODO: replace with access check someday
				if (message.author.id === cons.SPONGE_ID) {
					let who;
					let amt;
					let str;
					if (!parms) {
						utils.chSend(message, 'You forgot the target to for !ticket.');
						return;
					}

					parms = parms.split(' ');
					who = utils.makeId(parms[0]);

					if (message.mentions.users.has(who)) {
						// there's an @ mention, and it matches the id sent up
						// so we can pass a user up to alterStat for nick nicking
						who = message.mentions.users.find('id', who);
					}

					if (parms[1] === '' || typeof parms[1] === 'undefined') {
						amt = 1;
					} else {
						amt = parseInt(parms[1], 10);
					}

					str = who + ' now has ';
					str += utils.alterStat(who, 'raffle', 'ticketCount', amt, gameStats);
					str += ' raffle tickets.';
					utils.chSend(message, str);
				}
			}
		},
		next: {
			do: function(message) {
				let raffleArr = sortRaffleData(raffleData);
				let next;
				let now = new Date().getTime();
				let mess = "";
				let done = false;
				let nextRaffleId;

				if (raffleArr.length === 0) {
					utils.chSend(message, "There are no upcoming raffles.");
					return;
				}

				// some more inefficient stuff here, but...
				// why implement a b-tree or something for this small dataset rn?
				let ind = 0;
				let found = false;
				while (!done) {
					if (raffleArr[ind].date >= now) {
						found = true;
						done = true;
					} else {
						if (ind === raffleArr.length - 1) {
							done = true;
						}
						ind++;
					}
				}
				if (!found) {
					mess = "There are no upcoming raffles.";
				} else {
					next = new Date(raffleArr[ind].date);
					let nextRaffleId = raffleArr[ind].id;
					let diffRaw = Math.abs(next - now);
					let diffStr = utils.msToTime(diffRaw);
					let howSoon = "";
					// no reason to check for ago/past, is there?
					howSoon += (next < now) ? `${diffStr} ago ` : `coming up in ${diffStr}`;
					mess = `:mega: The next scheduled raffle is: **${nextRaffleId}**\n` +
					  `It is scheduled for: **${next}** ( _${diffStr}_)\n` +
					  `For more details, do the command: \`raffle info ${nextRaffleId}\``;
				}
				utils.chSend(message, mess);
			}
		},
		hype: {
			do: function(message) {
				module.exports.subCmd.next.do(message);
			}
		},
		drawing: {
			do: function(message, parms, gameStats, raf) {
				// raf is "this" from previous scope, which is global module context
				// OUR "this" refers to the "subCmd" object

				parms = parms.split(' ');
				if (parms[0] === '') {
					utils.chSend(message, ' Use: `!raffle drawing list` or `!raffle drawing run`');
					return;
				} else if (parms[0] !== 'list' && parms[0] !== 'run') {
					utils.chSend(message, ' Only `!raffle drawing list` and `run` work right now.');
					return;
				}

				var str = '';
				var str2 = '';
				var tNum = raf.startNum;
				var tix = [];
				var numTix = {};
				var numUsers = 0;
				var newTix = [];

				// go find all the tickets by iterating over gameStats
				for (let who in gameStats) {
					if (gameStats[who].hasOwnProperty('raffle')) {
						if (!gameStats[who].raffle.hasOwnProperty('ticketCount')) {
							utils.debugPrint('!raffle: ' + who + ' has .raffle but no .ticketCount');
						} else {
							var tCount = parseInt(gameStats[who].raffle.ticketCount, 10);
							if (isNaN(tCount)) {
								utils.debugPrint('WARNING: ' + who + '.raffle.ticketCount was NaN: ' + tCount);
							} else if (tCount >= 1) {
								// only count users that have at least 1 ticket
								numUsers++;
								// push one new object onto tix[] for every ticket they have
								// user is this user, ticket is sequential from startNum
								// IOW, the tickets are "handed out in order" first
								numTix[who] = gameStats[who].raffle.ticketCount;
								for (let i = 0; i < numTix[who]; i++) {
									tix.push({"num": tNum, "user": who});
									tNum++;
								}
							}
						}
					}
				}

				str2 += ':tickets: :tickets: :tickets:   `RAFFLE TIME!`   :tickets: :tickets: :tickets:\n';
				str += ' I have ' + tix.length + ' tickets here in my digital bucket, numbered from `' +
				  raf.startNum + '` through `' + (raf.startNum + tix.length - 1);
				str += '`! They belong to ' + numUsers + ' users:\n```';


				str2 += '```\n';

				var column = 0;
				// for each user with tickets...
				for (let who in numTix) {

					// builds second message user sections
					str2 += '\n';
					var fixedLuser = '                    ';
					if (gameStats[who].hasOwnProperty('profile')) {
						// they have .profile...
						if (gameStats[who].profile.hasOwnProperty('nick')) {
							// they have .profile.nick, use it
							fixedLuser += gameStats[who].profile.nick;
							fixedLuser = fixedLuser.slice(-20);
							str2 += fixedLuser + ': ';
						}
					} else {
						fixedLuser += who;
						fixedLuser = fixedLuser.slice(-20);
						str2 += fixedLuser +': ';
					}

					// show user & number of tickets they have in parenthesis
					// use their stored nick if possible
					if (gameStats[who].hasOwnProperty('profile')) {
						// they have .profile...
						if (gameStats[who].profile.hasOwnProperty('nick')) {
							// they have .profile.nick, use it
							str += gameStats[who].profile.nick;
						} else {
							// profile but no .nick, just put an @ and their id (don't ping them)
							str += '@' + who;
						}
					} else {
						// no .profile, just put an @ and their id (don't ping them)
						str += '@' + who;
					}
					str += ' (x' + numTix[who] + ')\n'; // number of tickets in parens
					column++;
					//if (column % 3 === 0) {str += '\n'}

					// for each ticket belonging to them...
					for (let i = 0; i < numTix[who]; i++) {
						// pick 1 random ticket from those left in original array,
						// yank it out and put in ranTick. It's an object.
						// .slice() is destructive to the original array. good.
						let ranTick = tix.splice(Math.floor(Math.random() * tix.length), 1);
						ranTick = ranTick[0]; // .splice() gave us an array with 1 element

						// modify the "user" property to match the new owner
						ranTick.user = who;
						newTix.push(ranTick); // push it into new array
						str2 += ' [#' + ranTick.num + '] | ';
					}
				} // end for each user w/tix

				// finally output the strings we built
				if (parms[0] === 'list') {
					str += '```';
					utils.chSend(message, str);
				} else if (parms[0] === 'run') {
					str2 += '```';
					utils.chSend(message, str2);
				}

			}
		}
	},
	do: function(message, parms, gameStats, bankroll) {

		parms = parms.split(' ');
		if (parms[0] === '') {
			utils.chSend(message, 'Use raffle commands to get info about or enter raffles on this server. Try `help raffle` for more info!');
			return;
		}

		let sub = parms[0].toLowerCase(); // sub is the possible subcommand
		parms.shift(); // lop off the command that got us here

		if (this.subCmd.hasOwnProperty(sub)) {
			//we've found a found sub-command, so do it...
			// our default behavior: again, lop off the subcommand,
			// then put the array back together and send up a String
			// that has lopped off the command and subcommand,
			// and otherwise left the user's input unharmed
			parms = parms.join(' ');
			utils.debugPrint('>> calling subcommand .' + sub + '.do(' + parms + ')');
			this.subCmd[sub].do(message, parms, gameStats, this);
			return;
		} else {
			utils.chSend(message, 'What are you trying to do to that raffle?!');
			return;
		}
	}
};
