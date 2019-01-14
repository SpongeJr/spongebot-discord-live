const cons = require('../lib/constants.js');
const utils = require('../lib/utils.js');
var scram = {};
var scramWordLists = {
	"278588293321326594": cons.ESO_SCRAMWORDS,
	"402126095056633859": cons.PLANET_SCRAMWORDS
};

var scramConfigs = {
	"default": {
		wordDelay: 105000,
		wordDelayVariation: 15000,
		baseAward: 600,
		letterBounus: 100, 
		guessTime: 29000,
		extraGuessTime: 2500,
		maxMultiplier: 2,
		minMultiplier: 1
	},
	"lightning": {
		wordDelay: 1000,
		wordDelayVariation: 0,
		baseAward: 0,
		letterBounus: 0, 
		guessTime: 29000,
		extraGuessTime: 2500,
		maxMultiplier: 2,
		minMultiplier: 1
	}
};
//-----------------------------------------------------------------------------
var scrambler = function(inputWord) {
	var wordArray = inputWord.split("");
	var newWord = '';

	var letter = 0;
	while (wordArray.length > 0 ) {
		newWord += wordArray.splice(Math.random() * wordArray.length, 1);
		letter++;
	}
	return newWord;
};
//-----------------------------------------------------------------------------
module.exports = {
	subCmd: {
		loadconfig: {
			do: function(message, parms) {
				var server = message.guild;
				var outStr = '';
				var configs = Object.keys(scramConfigs);
				if (configs.includes(parms[1])) {
					scram[server.id].currentConfig = parms[1];
					outStr += ' Config successfully changed to: ' + parms[1];
				} else {
					outStr += ` I see no scram config called ${parms[1]} here!`;
				}
				utils.chSend(message, outStr);
			}
		},
		saveconfig: {
			do: function(message, parms) {
				var server = message.guild;
				var outStr = 'You find yourself unable to do that at this time. Strange.';
				utils.chSend(message, outStr);
			}
		},
		oldtop: {
			do: function(message, parms, gameStats) {
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
				outStr += '```TOP 10 DESCRAMBLERS:\n';
				outStr += ` !SCRAM MASTER:  ->  ${topNick}  <-  with ${topWins[0].wins} wins! \n`;
				for (let num = 1; (num < 10 && num < topWins.length); num++) {
					let nick = utils.idToNick(topWins[num].who, gameStats);
					outStr += ` #${num + 1}: (${topWins[num].wins}) ... ${nick} \n`;
				}
				
				// output top 10 fastest
				let fastestNick = utils.idToNick(fastest[0].who, gameStats);
				let speed = fastest[0].speed / 1000;
				outStr += '---\nFASTEST DESCRAMBLERS:\n';
				outStr += `SUPERSONIC SCRAM CHAMP:  ->  ${fastestNick}  <-  in ${speed.toFixed(3)} seconds! \n`;
				for (let num = 1; (num < 10 && num < fastest.length); num++) {
					let nick = utils.idToNick(fastest[num].who, gameStats);
					speed = fastest[num].speed / 1000;
					outStr += ` #${num + 1}: (${speed.toFixed(3)} s) ... ${nick} \n`;
				}
					
				outStr += '```';
					  
				utils.chSend(message, outStr);
		
			}
		},
		top: {
				do: function(message, parms, gameStats) {
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
						if (scramStats.hasOwnProperty(stat) && (scramStats[stat] !== "wins" && scramStats[stat] !== "fastest")) {
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
				for (let who in scramStats.wins) {
					topWins.push( {"who": who, "wins": scramStats.wins[who]} );
					fastest.push( {"who": who, "speed": scramStats.fastest[who]} );
				}
				
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
					outStr += '```TOP 10 DESCRAMBLERS on ' + thisServer.name + ':\n';
					outStr += ` !SCRAM MASTER:  ->  ${serverTopNick}  <-  with ${serverTopWins[0].wins} wins! \n`;
					for (let num = 1; (num < 10 && num < serverTopWins.length); num++) {
						let nick = utils.idToNick(serverTopWins[num].who, gameStats);
						outStr += ` #${num + 1}: (${serverTopWins[num].wins}) ... ${nick} \n`;
					}
				}
				
				// output top 10 fastest for THIS SERVER
				if (serverFastest.length > 0) {
					let serverFastestNick = utils.idToNick(serverFastest[0].who, gameStats);
					let speed = serverFastest[0].speed / 1000;
					outStr += '---\nFASTEST DESCRAMBLERS on ' + thisServer.name + ':\n';
					outStr += `SUPERSONIC SCRAM CHAMP:  ->  ${serverFastestNick}  <-  in ${speed.toFixed(3)} seconds! \n`;
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
			var server = message.guild;
			var theWord;
			var minMultiplier;
			var maxMultiplier;

			if (!server) {
				utils.auSend(message, 'The word scramble game is meant to be played in public, and '+
				'not direct messages. Sorry! It\'s more fun with others, anyway!');
				return;
			}

			parms = parms.toLowerCase();
			
			if (!scram.hasOwnProperty(server.id)) {
				utils.debugPrint('!s: No key ' + server.id + ' in scram variable! Someone probably ran !s before !scram.');
				utils.chSend(message, 'Please start `!scram` before guessing a scrambled word.');
				return;
			}
			
			if (!scram[server.id].hasOwnProperty('runState')) {
				utils.debugPrint('!s: No key .runState in scram.' + server.id + ' Maybe someone ran !s before !scram.');
				utils.chSend(message, 'Please start `!scram` before guessing a scrambled word.');
				return;
			}
			
			if (scram[server.id].runState !== 'guessing') {
				utils.chSend(message, 'You can\'t guess the scrambled word now! ' +
				  'You need to wait for a new word to unscramble!');
				return;
			}
			
			theWord = scram[server.id].word;
			minMultiplier = scramConfigs[scram[server.id].currentConfig].minMultiplier;
			maxMultiplier = scramConfigs[scram[server.id].currentConfig].maxMultiplier;
			
			if (parms === theWord) {
				
				clearTimeout(scram[server.id].guessTimer);
				
				var user = message.author;
				var who = message.author.id;
				scram[server.id].runState = 'gameover';
				var outStr = `:tada: ${message.author} just unscrambled the word in `;
				var now = new Date();
				var speed = now - scram[server.id].guessStartTime;
				var fastest = utils.getStat(who, 'scram', 'fastest', gameStats) || 0;
				var serverStats = utils.getStat(who, 'scram', server.id, gameStats) || {"wins": 0, "fastest": 0};
				var serverFastest = serverStats.fastest;
				var serverWins = serverStats.wins;
				
				outStr += (speed / 1000).toFixed(1) + ' seconds and wins ';
				var guessTime = scramConfigs[scram[server.id].currentConfig].guessTime + scramConfigs[scram[server.id].currentConfig].extraGuessTime * theWord.length; // max allowed time
				var multiplier = 1 - speed / guessTime;
				multiplier = (multiplier * (scramConfigs[scram[server.id].currentConfig].maxMultiplier - scramConfigs[scram[server.id].currentConfig].minMultiplier) + minMultiplier);
				var baseAward = scramConfigs[scram[server.id].currentConfig].baseAward + scramConfigs[scram[server.id].currentConfig].letterBounus * theWord.length;
				var award = parseInt(baseAward * multiplier);

				outStr +=  `${award} credits! ( ${baseAward} x ~${multiplier.toFixed(2)} speed multiplier )`;
				outStr += '\n The word was: ' + theWord;
				utils.addBank(message.author.id, award, bankroll);
				
				// global
				if (fastest <= 0 || speed < fastest) {
					outStr += '\n :zap: That\'s a new global fastest time for them! :zap:';
					utils.setStat(user, 'scram', 'fastest', speed, gameStats);
				}
				
				// per-server
				if (serverFastest <= 0 || speed < serverFastest) {
					outStr += '\n :zap: That\'s a new fastest time for them on ' + server.name + '! :zap:';
					serverStats.fastest = speed;
					utils.setStat(user, 'scram', server.id, serverStats, gameStats);
				}
				
				utils.alterStat(message.author.id, 'scram', 'wins', 1, gameStats); //global
				serverStats.wins += 1;
				utils.setStat(user, 'scram', server.id, serverStats, gameStats); // per-server
				
				if (gameStats[message.author.id].scram.wins % 25 === 0) {
					outStr += `\n WOW, amazing! That makes ${gameStats[message.author.id].scram.wins} wins!`;
				} else {
				outStr += '\n' + message.author + ' has now unscrambled ' +
				  gameStats[message.author.id].scram[server.id].wins + ' words! ' +
				  '(' + gameStats[message.author.id].scram.wins + ' global wins)';
				}
				
				var theDelay = parseInt(Math.max(1, scramConfigs[scram[server.id].currentConfig].wordDelay - (scramConfigs[scram[server.id].currentConfig].wordDelayVariation / 2) +
				  Math.random() * scramConfigs[scram[server.id].currentConfig].wordDelayVariation));
				outStr += '\n Next word available in ' + parseInt(theDelay / 1000) + ' second(s).';			
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
		var server = message.guild;
		if (!server) {
			utils.auSend(message, 'The word scramble game is meant to be played in public, and '+
			'not direct messages. Sorry! It\'s more fun with others, anyway!');
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
			var wordList;
			// does this server have a custom word list? use if so
			if (scramWordLists.hasOwnProperty(server.id)) {
				wordList = scramWordLists[server.id];
			} else {
				// use default list
				wordList = cons.SCRAMWORDS;
			}
			var keys = Object.keys(wordList);
			var theCat = keys[parseInt(Math.random() * keys.length)];
			var catWords = wordList[theCat].split(',');
			var theWord = utils.listPick(catWords)[0];
			scram[server.id].word = theWord;
			
			// find all the blanks and put their positions into an array
			// do the scramble
			// remove all the blanks again, and splice back into places
			var spaceArr = [];
			for (var i = 0; i < theWord.length; i++) {
				if (theWord.charAt(i) === ' ') {spaceArr.push(i);}
			}
			var scramWord = scrambler(theWord);
			scramWord = scramWord.replace(/ /g, '');
			spaceArr.forEach(function(spaceInd) {
				scramWord = scramWord.slice(0, spaceInd) + ' ' + scramWord.slice(spaceInd);
			});		  
			utils.chSend(message, 'Unscramble this: ' + utils.bigLet(scramWord) + 
			  '   *Category*: ' + theCat);
			  

			var guessTime = scramConfigs[scram[server.id].currentConfig].guessTime + scramConfigs[scram[server.id].currentConfig].extraGuessTime * theWord.length;
			var theMess = 'You have ' + parseInt(guessTime / 1000) + 
			  ' seconds to guess by typing `!s <guess>`.';
			utils.chSend(message, theMess);
			scram[server.id].runState = 'guessing';
			
			scram[server.id].guessStartTime = new Date();
			var theDelay = Math.max(1, parseInt(scramConfigs[scram[server.id].currentConfig].wordDelay - (scramConfigs[scram[server.id].currentConfig].wordDelayVariation / 2) +
			  Math.random() * scramConfigs[scram[server.id].currentConfig].wordDelayVariation));
			scram[server.id].guessTimer = setTimeout(function() {
				if (scram[server.id].runState === 'guessing') {
					utils.chSend(message, 'The `!scram` word was not guessed' +
					  ' in time! The word was: ' + scram[server.id].word + 
					  '\n Next word available in ' + parseInt(theDelay / 1000) + ' second(s).');
					
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
			utils.chSend(message, '`!scram` is not ready just yet.');
		}
	}
}