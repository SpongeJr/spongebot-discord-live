const cons = require('../lib/constants.js');
const utils = require('../lib/utils.js');
var scram = {};
var scramWordLists = {
	"278588293321326594": cons.ESO_SCRAMWORDS,
	"402126095056633859": cons.PLANET_SCRAMWORDS
};

var scramConfig = {
	wordDelay: 105000,
	wordDelayVariation: 15000,
	baseAward: 600,
	letterBounus: 100, 
	guessTime: 29000,
	extraGuessTime: 2500
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
	s: {
		do: function(message, parms, gameStats, bankroll) {
			var server = message.guild;
			
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
			
			if (parms === scram[server.id].word) {
				var who = message.author.id;
				scram[server.id].runState = 'gameover';
				utils.addBank(message.author.id, parseInt(scramConfig.baseAward + scramConfig.letterBounus * scram[server.id].word.length), bankroll);
				var outStr = message.author + ' just unscrambled the word in ';
				var now = new Date();
				var speed = now - scram[server.id].guessStartTime;
				var fastest = utils.getStat(who, 'scram', 'fastest', gameStats) || 0;
				outStr += (speed / 1000).toFixed(1) + ' seconds and wins ';
				outStr += parseInt(scramConfig.baseAward + scramConfig.letterBounus * scram[server.id].word.length ) + ' credits!';
				if (fastest <= 0 || speed < fastest) {
					outStr += '\n :zap: That\'s a new fastest time for them! :zap:';
					utils.setStat(who, 'scram', 'fastest', speed, gameStats);
				}
				
				utils.alterStat(message.author.id, 'scram', 'wins', 1, gameStats);
				outStr += '\n' + message.author + ' has now unscrambled ' +
				  gameStats[message.author.id].scram.wins + ' words!';
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
		
		parms = parms.split(' ');
		if (parms[0] !== '') {
			parms[0] = parms[0].toLowerCase();
			if (this.subCmd.hasOwnProperty(parms[0])) {
				//we've found a found sub-command, so do it...
				this.subCmd[parms[0]].do(message, parms);
				return; // we're done here
			}
			// ignore non-sub-command extra stuff they type
		}
		
		if (!scram.hasOwnProperty(server.id)) {
			// key doesn't exist for this server, so init
			utils.debugPrint('!scram: Adding instance for ' + server.id + ' (' +
			  server.name + ')');
			scram[server.id] = {};
			scram[server.id].announce = true;
			scram[server.id].runState = 'ready';
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
			  
			var theDelay = parseInt(scramConfig.wordDelay - (scramConfig.wordDelayVariation / 2) +
			  Math.random() * scramConfig.wordDelayVariation);
			var guessTime = scramConfig.guessTime + scramConfig.extraGuessTime * theWord.length;
			var theMess = 'You have ' + parseInt(guessTime / 1000) + 
			  ' seconds to guess by typing `!s <guess>`. Next word available in ' + 
			  parseInt(theDelay / 1000) + ' seconds.';
			utils.chSend(message, theMess);
			scram[server.id].runState = 'guessing';
			
			scram[server.id].timer = setTimeout(function() {
				if (scram[server.id].runState !== 'ready') {
					scram[server.id].runState = 'ready';
					if (scram[server.id].announce) {
						utils.chSend(message, 'There\'s a new `!scram` word ready!');
					}
				}
			}, theDelay);
			scram[server.id].guessStartTime = new Date();
			scram[server.id].guessTimer = setTimeout(function() {
				if (scram[server.id].runState === 'guessing') {
					utils.chSend(message, 'The `!scram` word was not guessed' +
					' in time! The word was: ' + scram[server.id].word);
					scram[server.id].runState = 'gameover';
				}
			}, guessTime);
		} else {
			utils.chSend(message, '`!scram` is not ready just yet.');
		}
	}
}