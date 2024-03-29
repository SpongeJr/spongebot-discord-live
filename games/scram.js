const cons = require('../lib/constants.js');
const utils = require('../lib/utils.js');
const i18n = require('../modules/i18n.js');
let savedObs = require('../' + cons.OBJECTS_FILENAME);

let scram = {};
let scramWordLists = {
	"278588293321326594": cons.ESO_SCRAMWORDS,
	"402126095056633859": cons.PLANET_SCRAMWORDS,
	"687863497995976713": cons.SCRAMWORDS_NOKHAN
};

let scramConfigs = {
	"default": {
		wordDelay: 105000,
		wordDelayVariation: 15000,
		baseAward: 600,
		letterBounus: 100,
		guessTime: 29000,
		extraGuessTime: 2500,
		maxMultiplier: 2,
		minMultiplier: 1,
		description: "Default Configuration (Standard timing, standard credits)"
	},
	"lightning": {
		wordDelay: 1000,
		wordDelayVariation: 0,
		baseAward: 0,
		letterBounus: 0,
		guessTime: 29000,
		extraGuessTime: 2500,
		maxMultiplier: 2,
		minMultiplier: 1,
		description: "Lightning (Instant reset, no credits)"
	},
	"lightning-scored": {
		wordDelay: 1000,
		wordDelayVariation: 0,
		baseAward: 0,
		letterBounus: 1,
		guessTime: 28200,
		extraGuessTime: 2200,
		maxMultiplier: 20,
		minMultiplier: 1,
		description: "Lightning scored (Instant reset, reduced credits)"
	}
};
const getNextResetTime = function() {
	/*
	let now = new Date();
	let monthlyReset = new Date();
	let month = monthlyReset.getMonth();

	// is it December? If so, increment year and reset month to 0 (Jan.)
	if (month === 11) {
		let year = monthlyReset.getFullYear();
		year++;
		monthlyReset.setYear(year);
		month = 0;
	} else {
		// otherwise, just increment month
		month++;
	}
	monthlyReset.setMonth(month);
	monthlyReset.setDate(1);
	monthlyReset.setHours(0);
	monthlyReset.setMinutes(0);
	monthlyReset.setSeconds(0);
	monthlyReset.setMilliseconds(0);
	let msUntilReset = monthlyReset.valueOf() - now.valueOf();
	console.log(`-- scram.getNextResetTime(): Next monthly stat reset will be: ${monthlyReset.toString()}`);
	return msUntilReset;
	*/
};
//-----------------------------------------------------------------------------
const scrambler = function(inputWord) {
	let wordArray = inputWord.split("");
	let newWord = '';

	let letter = 0;
	while (wordArray.length > 0 ) {
		newWord += wordArray.splice(Math.random() * wordArray.length, 1);
		letter++;
	}
	return newWord;
};
//-----------------------------------------------------------------------------
module.exports = {
	getNextResetTime: getNextResetTime,
	monthlyTimer: {},
	resetMonthlyTimer: function(gameStats) {
		
		// eventually, we want to track just the players that have played scram this month
		// instead of iterating over all of gamestats! for now though, that's what we do...
		for (let who in gameStats) {
			let monthlyStats = utils.getStat(who, 'scram', 'monthly', gameStats);
			if (monthlyStats) {
				console.log(`Resetting ${who}'s montly scram stat!'`);
				// we don't use setStat() because it writes to disk every time
				// utils.setStat(who, 'scram', 'monthly', {}, gameStats);
				gameStats[who].scram.monthly = {};
			}
			utils.saveStats(cons.STATS_FILENAME, gameStats);
		}
		let nextTime = getNextResetTime();
		//this.monthlyTimer = setTimeout(() => {this.resetMonthlyTimer(gameStats)}, nextTime);
		console.log(` -- Just reset the scram monthly timer! Next is in ${nextTime} milliseconds!`);
		
	},
	subCmd: {
		loadconfig: {
			do: function(message, parms, gameStats) {
				let who = message.author.id;
				let server = message.guild;
				let userLang = utils.getStat(who, "i18n", "language", gameStats);
				let outStr = '';
				let configs = Object.keys(scramConfigs);
				if (configs.includes(parms[1])) {
					scram[server.id].currentConfig = parms[1];
					//outStr += ' Config successfully changed to: ' + parms[1];
					outStr += i18n.st(["scram", "configChangeOk"], userLang, [parms[1]]);
				} else {
					if (parms[1]) {
						//outStr += ` I see no scram config called ${parms[1]} here!`;
						outStr += i18n.st(["scram", "configChangeNotExist"], userLang, [parms[1]]);
					}

					//outStr += "These are the valid configurations:";
					outStr += i18n.st(["scram", "configList"], userLang);

					configs.forEach(function(config, ind) {
						outStr += `\`${config}\`: ${scramConfigs[config].description}\n`;
					});
				}
				utils.chSend(message, outStr);
			}
		},
		saveconfig: {
			do: function(message, parms, gameStats) {
				let server = message.guild;
				let outStr = 'You find yourself unable to do that at this time. Strange.';
				utils.chSend(message, outStr);
			}
		},
		mreset: {
			do: function(message, parms, gameStats) {
				utils.chSend(message, "Doing it...");
				this.resetMonthlyTimer(gameStats);
				
			}
		},
		monthtop: {
			do: function(message, parms, gameStats) {
				let who = message.author.id;
				let userLang = utils.getStat(who, "i18n", "language", gameStats);
				let scramStats = {};
				let scramServerStats = {};
				let monthlyStats = {};
				let outStr = '';
				let topWins = [];
				let fastest = [];
				let monthlyTopWins = [];
				let thisServer = message.guild;

				// build scramStats and scramServerStats from gameStats

				let game = 'scram';
				for (let who in gameStats) {
					for (let stat in gameStats[who][game]) {
						if (!scramStats.hasOwnProperty(stat)) {
							scramStats[stat] = {};
						}
						if (stat === "monthly") {
							// user has a monthly stat, add it to the monthlyStats
							// ...but only if it's from this server

							let monthlyStat = "wins";
							if (gameStats[who][game][stat].hasOwnProperty(thisServer.id)) {
								monthlyStats[monthlyStat] = monthlyStats[monthlyStat] || {};
								monthlyStats[monthlyStat][who] = monthlyStats[monthlyStat][who] || {};

								for (let monthlyStat in gameStats[who][game][stat][thisServer.id]) {
									// Ex: monthlyStats[monthlyStat].12345678 = gameStats.12345678.scram.monthly.server123[monthlyStat]
									monthlyStats[monthlyStat][who] = gameStats[who][game][stat][thisServer.id][monthlyStat];
								}
							}
						}
					}
				}

				// build array and sort
				for (let who in monthlyStats.wins) {
					monthlyTopWins.push( {"who": who, "wins": monthlyStats.wins[who]} );
				}

				monthlyTopWins.sort(utils.objSort("wins", -1));

				// output top 10 for THIS SERVER for THIS MONTH
				if (monthlyTopWins.length > 0) {
					let monthlyTopNick = utils.idToNick(monthlyTopWins[0].who, gameStats);
					outStr += "```";
					outStr += i18n.st(["scram", "top10monthly"], userLang, [thisServer.name, monthlyTopNick, monthlyTopWins[0].wins]);
					/* outStr += '```TOP 10 DESCRAMBLERS on ' + thisServer.name + ':\n';
					outStr += ` !SCRAM MASTER:  ->  ${serverTopNick}  <-  with ${serverTopWins[0].wins} wins! \n`;
					*/
					for (let num = 1; (num < 10 && num < monthlyTopWins.length); num++) {
						let nick = utils.idToNick(monthlyTopWins[num].who, gameStats);
						outStr += ` #${num + 1}: (${monthlyTopWins[num].wins}) ... ${nick} \n`;
					}
					outStr += '```';
					utils.chSend(message, outStr);
				}
			}
		},
		oldtop: {
			do: function(message, parms, gameStats) {
				let who = message.author.id;
				let userLang = utils.getStat(who, "i18n", "language", gameStats);
				let scramStats = {};
				let outStr = '';
				let topWins = [];
				let fastest = [];

				// build scramStats from gameStats
				for (let who in gameStats) {
					let game = 'scram';
					for (let stat in gameStats[who][game]) {
						if (!scramStats.hasOwnProperty(stat)) {
							scramStats[stat] = {};
						}
						scramStats[stat][who] = gameStats[who][game][stat];
					}
				}

				// build arrays and sort
				for (let who in scramStats.wins) {
					topWins.push( {"who": who, "wins": scramStats.wins[who]} );
					fastest.push( {"who": who, "speed": scramStats.fastest[who]} );
				}

				topWins.sort(utils.objSort("wins", -1));
				fastest.sort(utils.objSort("speed"));

				// output top 10
				let topNick = utils.idToNick(topWins[0].who, gameStats);
				//outStr += '```TOP 10 DESCRAMBLERS:\n';
				outStr += "```";
				outStr += i18n.st(["scram", "top10global"], userLang, [topNick, topWins[0].wins]);
				//outStr += ` !SCRAM MASTER:  ->  ${topNick}  <-  with ${topWins[0].wins} wins! \n`;
				for (let num = 1; (num < 10 && num < topWins.length); num++) {
					let nick = utils.idToNick(topWins[num].who, gameStats);
					outStr += ` #${num + 1}: (${topWins[num].wins}) ... ${nick} \n`;
				}

				// output top 10 fastest
				let fastestNick = utils.idToNick(fastest[0].who, gameStats);
				let speed = fastest[0].speed / 1000;
				outStr += "---\n";
				outStr += i18n.st(["scram", "top10globalFastest"], userLang, [fastestNick, speed.toFixed(3)]);
				//outStr += `SUPERSONIC SCRAM CHAMP:  ->  ${fastestNick}  <-  in ${speed.toFixed(3)} seconds! \n`;
				for (let num = 1; (num < 10 && num < fastest.length); num++) {
					let nick = utils.idToNick(fastest[num].who, gameStats);
					speed = fastest[num].speed / 1000;
					outStr += ` #${num + 1}: (${speed.toFixed(3)} s) ... ${nick} \n`;
				}
				outStr += '```';
				utils.chSend(message, outStr);
			}
		},
		words: {
			do: function(message, parms, gameStats) {
				let thisServer = message.guild;
				let outP = "";
				outP += `These are the active !scram word lists for this server:\n`;
				let wordList;

				if (scramWordLists.hasOwnProperty(thisServer.id)) {
					wordList = scramWordLists[thisServer.id];
				} else {
					wordList = cons.SCRAMWORDS;
				}
				let listWordCount;
				let totalWordCount = 0;

				for (let category in wordList) {
					listWordCount = wordList[category].split(",").length;
					totalWordCount += listWordCount;
					outP += `Category \`${category}\` has ${listWordCount} words.\n`
				}
				outP += `\n  TOTAL: \`${totalWordCount}\` WORDS`;
				utils.chSend(message, outP);
			}
		},
		top: {
			do: function(message, parms, gameStats) {
				let who = message.author.id;
				let userLang = utils.getStat(who, "i18n", "language", gameStats);
				let scramStats = {};
				let scramServerStats = {};
				let outStr = '';
				let topWins = [];
				let fastest = [];
				let serverTopWins = [];
				let serverFastest = [];
				let thisServer = message.guild;

				// build scramStats and scramServerStats from gameStats
				for (let who in gameStats) {
					let game = 'scram';
					for (let stat in gameStats[who][game]) {
						if (!scramStats.hasOwnProperty(stat)) {
							scramStats[stat] = {};
						}
						if (scramStats.hasOwnProperty(stat) && (scramStats[stat] !== "wins" && scramStats[stat] !== "fastest" && scramStats[stat] !== "monthly")) {
							// per-server stat found -- "stat" is the server id in this case
							if (!scramServerStats.hasOwnProperty(stat)) {
								scramServerStats[stat] = {};
							}
							scramServerStats[stat][who] = gameStats[who][game][stat];
						} else {
							// "global" scram stats
							scramStats[stat][who] = gameStats[who][game][stat];
						}
					}
				}

				// build arrays and sort
				// why do we do this here? we never use it here, only oldtop!
				/*
				for (let who in scramStats.wins) {
					topWins.push( {"who": who, "wins": scramStats.wins[who]} );
					fastest.push( {"who": who, "speed": scramStats.fastest[who]} );
				}
				*/

				// build per-server arrays and sort
				for (let who in scramServerStats[thisServer.id]) {
					serverTopWins.push( {
						"who": who,
						"wins": scramServerStats[thisServer.id][who].wins
					});

					serverFastest.push( {
						"who": who,
						"speed": scramServerStats[thisServer.id][who].fastest
					});
				}

				topWins.sort(utils.objSort("wins", -1));
				fastest.sort(utils.objSort("speed"));

				serverTopWins.sort(utils.objSort("wins", -1));
				serverFastest.sort(utils.objSort("speed"));

				// output top 10 for THIS SERVER
				if (serverTopWins.length > 0) {
					let serverTopNick = utils.idToNick(serverTopWins[0].who, gameStats);
					outStr += "```";
					outStr += i18n.st(["scram", "top10server"], userLang, [thisServer.name, serverTopNick, serverTopWins[0].wins]);
					/* outStr += '```TOP 10 DESCRAMBLERS on ' + thisServer.name + ':\n';
					outStr += ` !SCRAM MASTER:  ->  ${serverTopNick}  <-  with ${serverTopWins[0].wins} wins! \n`;
					*/
					for (let num = 1; (num < 10 && num < serverTopWins.length); num++) {
						let nick = utils.idToNick(serverTopWins[num].who, gameStats);
						outStr += ` #${num + 1}: (${serverTopWins[num].wins}) ... ${nick} \n`;
					}
				}

				// output top 10 fastest for THIS SERVER
				if (serverFastest.length > 0) {
					let serverFastestNick = utils.idToNick(serverFastest[0].who, gameStats);
					let speed = serverFastest[0].speed / 1000;
					outStr += "---\n";
					outStr += i18n.st(["scram", "top10serverFastest"], userLang, [thisServer.name, serverFastestNick, speed.toFixed(3)]);
					/*
					outStr += '---\nFASTEST DESCRAMBLERS on ' + thisServer.name + ':\n';
					outStr += `SUPERSONIC SCRAM CHAMP:  ->  ${serverFastestNick}  <-  in ${speed.toFixed(3)} seconds! \n`;
					*/
					for (let num = 1; (num < 10 && num < serverFastest.length); num++) {
						let nick = utils.idToNick(serverFastest[num].who, gameStats);
						speed = serverFastest[num].speed / 1000;
						outStr += ` #${num + 1}: (${speed.toFixed(3)} s) ... ${nick} \n`;
					}
				}
				outStr += '```';
				utils.chSend(message, outStr);
			}
		}
	},
	s: {
		do: function(message, parms, gameStats, bankroll) {
			let who = message.author.id;
			let server = message.guild;
			let userLang = utils.getStat(who, "i18n", "language", gameStats);
			let theWord;
			let minMultiplier;
			let maxMultiplier;

			if (!server) {
				utils.auSend(message, i18n.st(["scram", "noDMplay"], userLang));
				return;
			}

			parms = parms.toLowerCase();

			if (!scram.hasOwnProperty(server.id)) {
				utils.debugPrint('!s: No key ' + server.id + ' in scram variable! Someone probably ran !s before !scram.');
				utils.chSend(message, i18n.st(["scram", "startScramFirst"], userLang));
				//utils.chSend(message, 'Please start `!scram` before guessing a scrambled word.');
				return;
			}

			if (!scram[server.id].hasOwnProperty('runState')) {
				utils.debugPrint(`!s: No key .runState in scram.${server.id} - Maybe someone ran !s before !scram.`);
				utils.chSend(message, i18n.st(["scram", "startScramFirst"], userLang));
				return;
			}

			if (scram[server.id].runState !== 'guessing') {
				utils.chSend(message, i18n.st(["scram", "cantGuessNow"], userLang));
				/*utils.chSend(message, 'You can\'t guess the scrambled word now! ' +
				  'You need to wait for a new word to unscramble!');
				*/
				return;
			}

			theWord = scram[server.id].word;
			minMultiplier = scramConfigs[scram[server.id].currentConfig].minMultiplier;
			maxMultiplier = scramConfigs[scram[server.id].currentConfig].maxMultiplier;

			if (parms === theWord) {

				clearTimeout(scram[server.id].guessTimer);

				let user = message.author;
				let who = message.author.id;
				scram[server.id].runState = 'gameover';

				let outStr = ":tada: ";

				let now = new Date();
				let speed = now - scram[server.id].guessStartTime;
				let fastest = utils.getStat(who, 'scram', 'fastest', gameStats) || 0;
				let serverStats = utils.getStat(who, 'scram', server.id, gameStats) || { "wins": 0, "fastest": 0 };
				let monthlyStats = utils.getStat(who, 'scram', 'monthly', gameStats) || {};
				let monthlyServerStats = monthlyStats[server.id] || { "wins": 0 };
				let monthlyServerWins = monthlyServerStats.wins;
				let serverFastest = serverStats.fastest;
				let serverWins = serverStats.wins;

				let guessTime = scramConfigs[scram[server.id].currentConfig].guessTime + scramConfigs[scram[server.id].currentConfig].extraGuessTime * theWord.length; // max allowed time
				let multiplier = 1 - speed / guessTime;
				multiplier = (multiplier * (scramConfigs[scram[server.id].currentConfig].maxMultiplier - scramConfigs[scram[server.id].currentConfig].minMultiplier) + minMultiplier);
				let baseAward = scramConfigs[scram[server.id].currentConfig].baseAward + scramConfigs[scram[server.id].currentConfig].letterBounus * theWord.length;
				let award = Math.round(baseAward * multiplier);


				utils.addBank(message.author.id, award, bankroll);

				outStr += i18n.st(
					["scram", "victory"],
					userLang,
					[
						`**${user.username}**`,
						(speed / 1000).toFixed(1),
						award,
						baseAward,
						multiplier.toFixed(2),
						theWord
					]
				);

				// check for global record
				if (fastest <= 0 || speed < fastest) {
					outStr += "\n :zap: ";
					outStr += i18n.st(["scram", "globalFastestPersonal"], userLang);
					outStr += " :zap:";
					//outStr += '\n :zap: That\'s a new global fastest time for them! :zap:';
					utils.setStat(user, 'scram', 'fastest', speed, gameStats);
				}

				// per-server
				if (serverFastest <= 0 || speed < serverFastest) {
					outStr += "\n :zap: ";
					outStr += i18n.st(["scram", "serverFastestPersonal"], userLang, [server.name]);
					outStr += " :zap:";
					//That\'s a new fastest time for them on ' + server.name + '! :zap:';
					serverStats.fastest = speed;
					utils.setStat(user, 'scram', server.id, serverStats, gameStats);
				}

				utils.alterStat(message.author.id, 'scram', 'wins', 1, gameStats); //global
				serverStats.wins += 1;
				utils.setStat(user, 'scram', server.id, serverStats, gameStats); // per-server
				monthlyServerStats.wins += 1;
				monthlyStats[server.id] = monthlyServerStats;
				utils.setStat(user, 'scram', 'monthly', monthlyStats, gameStats); // monthly-per-server

				if (gameStats[message.author.id].scram.wins % 25 === 0) {
					outStr += `\n WOW, amazing! That makes ${gameStats[message.author.id].scram.wins} wins!`;
				} else {
				outStr += '\n**' + user.username + '** has now unscrambled ' +
				  gameStats[message.author.id].scram[server.id].wins + ' words! ' +
				  '(' + gameStats[message.author.id].scram.wins + ' global wins)';
				outStr += `\n And that makes ${monthlyServerStats.wins} wins for them this month!`;
				}

				let theDelay = Math.floor(Math.max(1, scramConfigs[scram[server.id].currentConfig].wordDelay - (scramConfigs[scram[server.id].currentConfig].wordDelayVariation / 2) +
				  Math.random() * scramConfigs[scram[server.id].currentConfig].wordDelayVariation));
				outStr += '\n Next word available in ' + Math.floor(theDelay / 1000) + ' second(s).';
				scram[server.id].timer = setTimeout(function() {
					if (scram[server.id].runState !== 'ready') {
						scram[server.id].runState = 'ready';
						if (scram[server.id].announce) {
							utils.chSend(message, 'There\'s a new `!scram` word ready!');
						}
					}
				}, theDelay);

				utils.chSend(message,  outStr);
			} else {
				//utils.chSend(message, 'Not the word.');
			}
		}
	},
	do: function(message, parms, gameStats, bankroll) {
		let who = message.author.id;
		let server = message.guild;
		let userLang = utils.getStat(who, "i18n", "language", gameStats);
		if (!server) {
			utils.auSend(message, i18n.st(["scram", "noDMplay"], userLang));
			return;
		}
		if (!scram.hasOwnProperty(server.id)) {
			// key doesn't exist for this server, so init
			utils.debugPrint('!scram: Adding instance for ' + server.id + ' (' +
			  server.name + ')');
			scram[server.id] = {};
			scram[server.id].announce = true;
			scram[server.id].runState = 'ready';
			scram[server.id].currentConfig = 'default';
		}

		parms = parms.split(' ');
		if (parms[0] !== '') {
			parms[0] = parms[0].toLowerCase();
			if (this.subCmd.hasOwnProperty(parms[0])) {
				//we've found a found sub-command, so do it...
				this.subCmd[parms[0]].do(message, parms, gameStats);
				return; // we're done here
			}
			// ignore non-sub-command extra stuff they type
		}

		if (scram[server.id].runState === 'ready') {
			let wordList;
			// does this server have a custom word list? use if so
			if (scramWordLists.hasOwnProperty(server.id)) {
				wordList = scramWordLists[server.id];
			} else {
				// use default list
				wordList = cons.SCRAMWORDS;
			}
			let keys = Object.keys(wordList);
			let theCat = keys[Math.floor(Math.random() * keys.length)];
			let catWords = wordList[theCat].split(',');
			let theWord = utils.listPick(catWords)[0];
			scram[server.id].word = theWord;

			// find all the blanks and put their positions into an array
			// do the scramble
			// remove all the blanks again, and splice back into places
			let spaceArr = [];
			let theMess = '';
			let scramConfig = scramConfigs[scram[server.id].currentConfig];
			for (let i = 0; i < theWord.length; i++) {
				if (theWord.charAt(i) === ' ') {spaceArr.push(i);}
			}
			let scramWord = scrambler(theWord);
			scramWord = scramWord.replace(/ /g, '');
			spaceArr.forEach(function(spaceInd) {
				scramWord = scramWord.slice(0, spaceInd) + ' ' + scramWord.slice(spaceInd);
			});
			let guessTime = scramConfig.guessTime + scramConfig.extraGuessTime * theWord.length;
			let formattedGuessTime = Math.round(guessTime / 100) / 10;
			theMess += i18n.st(
				["scram", "unscrambleThis"],
				userLang,
				[utils.bigLet(scramWord), theCat, formattedGuessTime]
			);
			/* theMess += '\nYou have ' + Math.round(guessTime / 100) / 10 +
			  ' seconds to guess by typing `!s <guess>`.'; */
			utils.chSend(message, theMess);
			scram[server.id].runState = 'guessing';
			scram[server.id].guessStartTime = new Date();
			let theDelay = Math.max(1, Math.round(scramConfig.wordDelay - (scramConfig.wordDelayVariation / 2) +
			  Math.random() * scramConfig.wordDelayVariation));
			scram[server.id].guessTimer = setTimeout(function() {
				if (scram[server.id].runState === 'guessing') {
					/*
					utils.chSend(message, 'The `!scram` word was not guessed' +
					  ' in time! The word was: ' + scram[server.id].word +
					  '\n Next word available in ' + Math.round(theDelay / 1000) + ' second(s).');
					*/
					let theMess = i18n.st(
						["scram", "notGuessed"],
						userLang,
						[scram[server.id].word, Math.round(theDelay / 1000)]
					);

					utils.chSend(message, theMess);

					scram[server.id].runState = 'gameover';
					scram[server.id].timer = setTimeout(function() {
						if (scram[server.id].runState !== 'ready') {
							scram[server.id].runState = 'ready';
							if (scram[server.id].announce) {
								utils.chSend(message, 'There\'s a new `!scram` word ready!');
							}
						}
					}, theDelay);
				}
			}, guessTime);
		} else {
			utils.chSend(message, i18n.st(["scram", "notReadyYet"], userLang));
		}
	}
}
