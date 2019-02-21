// this var is local to the module
var utils = require('../lib/utils.js');

// as is this "v" object, where I'm putting the other variables
// that I want the function to use.
// why inside another object? I can then save or move around
// all the variables easily

//-----------------------------------------------------------------------------
// this whole .z object, .zlcear object, and .zstoryup object are all going to
// be accessible in the global context.
//
// You get to it via require, e.g.:
// var ific = require('ific.js'); 
// ific.js is this file
// ific is a variable that now holds the whole module.exports object below

// The actual organiation in one of these modules is up to you,
// but there's are useful patterns we're working on coming up with.
//
// In this example, I'm keeping a story in an object v that is local
// to this whole module, not accessible to the outside, but fully
// visible to everything within. I do this so it can be accessed by
// mutliple commands in this module.
//
// If I need a value back in the global scope, I should return it

module.exports = {
	runState: false,
	timer: {},
	letters: '',
	freq: 'aaaaaabbbbbbccccccddddddeeeeeeeffffffgggggghhhhhhiiiiijjkllllllmmmmmmnnnnnnooooopppppqqrrrrrrrsssssstttttttuuuuuvvvvwwwwyyyz',
	pickLetters: function(count) {
		var letters = '';
		for (var i = 0; i < count; i++) {
			letters += this.freq.charAt(
			  Math.floor(Math.random() * this.freq.length));
		}
		return letters;
	},
	pickLettersCustom: function(count, table) {
		var letters = '';
		for (var i = 0; i < count; i++) {
			letters += table.charAt(
			  Math.floor(Math.random() * table.length));
		}
		return letters;
	},
	entries: {},
	players: {},
	votes: {},
	config: {
		voteOwn: false,
		minPlayersForCredits: 3,
		winCredits: 3500,
		categories: true
	},
	categories: [
		'food and drink', 'animals', 'people', 'places', 'games and sports',
		'movies and television', 'news and current events',	'occupations',
		'technology and science', 'memes and fads', 'fantasy', 'general/any'
	],
	acroccfg: function() {
		
	},
	avote: function(message, parms, gameStats) {
		var author = message.author;
		if (!this.runState) {
			utils.chSend(message, author.username + ', the game is not running.' +
			  ' You can start a new game with `!acro`');
			return;
		}
		
		if (this.runState !== 'vote') {
			utils.chSend(message, author.username + ', wait for the voting to start!');
			return;
		}
		
		var theVote = parseInt(parms);
		
		if ((theVote > this.entries.length - 1) || (theVote < 0) || (isNaN(theVote))) {
			utils.chSend(message, ':warning: Not a valid vote, ' + author.username);
			return;
		}
		
		if (this.entries[theVote].author === message.author.id && !this.config.voteOwn) {
			utils.chSend(message, author.username + ', you can\'t vote for yourself!');
			return;
		}
		
		if (typeof this.votes[message.author.id] === 'undefined') {
			utils.chSend(message, message.author + ' your vote was recorded.');
		} else {
			utils.chSend(message, message.author + ', I changed your vote for you.');
		}
		this.votes[message.author.id] = theVote;
	},
	do: function(message, parms, gameStats, bankroll) {
		var author = message.author;
		// the !acro command itself
		parms = parms.split(' ');
		
		if (this.runState) {
			utils.chSend(message, ':warning: I think the `!acro` is already running.');
			return;
		}
		var letters = '';
		var timeAllowed = 0;
		var CATEGORY_DEFAULT = 'None / General'
		var category = CATEGORY_DEFAULT;
		
		var acroLen = 0;
		var table = '';
		
		for(var i = 0; i < parms.length; i++) {
			if(parms[i] === '') {
				continue;
			}
			var parts = parms[i].split(':');
			var parameter = parts[0];
			var argument = parts[1];
			if(!parameter || !argument) {
				if(!parameter && !argument) {
					utils.chSend(message, author.username + ', missing parameter and argument');
				}
				else if(!parameter) {
					utils.chSend(message, author.username + ', missing parameter');
				} else if(!argument) {
					utils.chSend(message, author.username + ', missing argument');
				}
				return;
			}
			parameter = parameter.toLowerCase();
			argument = argument.toLowerCase();
			if(parameter === 'letters') {
				//https://stackoverflow.com/questions/23476532/check-if-string-contains-only-letters-in-javascript
				//Check alphabetic only
				if(/^[a-z]+$/.test(argument)) {
					letters = argument;
					//Update acroLen
					acroLen = letters.length;
				} else {
					utils.chSend(message, author.username + ', invalid `letters` argument');
					return;
				}
			} else if(parameter === 'table') {
				if(/^[a-z]+$/.test(argument)) {
					//We only change "table" if we haven't yet set the letters
					if(letters !== '') {
						utils.chSend(message, author.username + ', warning: `table` argument overridden by `letters` argument');
						continue;
					}
					table = argument;
				} else {
					utils.chSend(message, author.username + ', invalid `table` argument');
					return;
				}
			} else if(parameter === 'playtime') {
				argument = parseInt(argument);
				if(!argument) {
					utils.chSend(message, author.username + ', invalid `playtime` argument');
					return;
				}
				if(argument <= 0) {
					utils.chSend(message, author.username + ', `playtime` argument must be greater than 0');
				}
				timeAllowed = argument;
				
			} else if(parameter === 'length') {
				
				var argument = parseInt(argument);
				if(argument) {
					if(argument <= 0) {
						utils.chSend(message, author.username + ', `length` argument must be greater than 0');
					}
					//We only change "table" if we haven't yet set the letters
					if(letters !== '') {
						utils.chSend(message, author.username + ', warning: `length` argument overridden by `letters` argument');
						continue;
					}
					acroLen = argument;
				} else {
					utils.chSend(message, author.username + ', invalid `length` argument');
					return;
				}
			} else if(parameter === 'category') {
				category = argument;
			} else {
				utils.chSend(message, author.username + ', unknown parameter');
			}
		}
		
		// start a new game after we know the arguments work
		this.votes = {};
		this.players = {};
		this.runState = 'main';
		this.entries = [];
		
		//Check if we have a custom category before assigning one
		if (this.config.categories && category === CATEGORY_DEFAULT) {
			var catNo = Math.floor(Math.random() * this.categories.length);
			category = this.categories[catNo];
		}
		//Initialize the letters if we haven't chosen a custom set
		if(letters === '') {
			//If we use custom letters, then acroLen has already been initialized
			if(acroLen <= 0) {
				acroLen = 3 + Math.floor(Math.random() * 3);
			}
			//Check for custom table
			if(table === '') {
				letters = this.pickLetters(acroLen);
			} else {
				letters = this.pickLettersCustom(acroLen, table);
			}
		}
		
		if(!timeAllowed) {
			timeAllowed = acroLen * 14 + 20;
		}
		
		this.letters = letters;
		
		//Recycle this variable
		letters = '';
		for (var i = 0; i < this.letters.length; i++) {
			letters += this.letters.charAt(i).toUpperCase();
		}
		
		utils.chSend(message, ' Let\'s play the `!acro` game!\n' + 
		  '\nLetters: ' + utils.bigLet(letters) + 
		  '   Category: ' + category +
		  '\nYou have ' + timeAllowed + 
		  ' seconds to make an acronym with them and submit it with `!a`');

		var acro = this; // save the "this" pointer from this scope
		this.timer = setTimeout(function() {
			var theText = ':stopwatch: Time to vote in `!acro`!\n' +
			'=-=-=-=-=-=-=-=-=\n'
			
			// Array-ify our object, order now matters
			var tempArr = [];
			for (var entry in acro.entries) {
				tempArr.push({
					author: entry,
					entry: acro.entries[entry]
				});
			}
			acro.entries = tempArr; // overwrite the old Object with Array
			
			if (acro.entries.length > 0) {
				var voteTimeAllowed = 15 + acro.entries.length * 5;					
				for (var i = 0; i < acro.entries.length; i++) {
					theText += '`!avote ' + i + '`: ';
					theText += acro.entries[i].entry + '\n';
					//theText += ' (by ' + utils.makeTag(acro.entries[i].author) + ')\n';
					acro.entries[i].voteCount = 0;
				}
				theText += '=-=-=-=-=-=-=-=-=\n';
				theText += 'Vote for your favorite with `!avote`!';
				theText += '\n You have ' + voteTimeAllowed + ' seconds.';
				utils.chSend(message, theText);
				acro.runState = 'vote';
				acro.voteTimer = setTimeout(function() {
					acro.runState = false;
					clearTimeout(acro.voteTimer); 
					utils.chSend(message, ':stopwatch: `!acro` voting time is up!' + 
					  ':stopwatch: \n Here are the results:');
					
					//count the votes
					for (var who in acro.votes) {
						acro.entries[acro.votes[who]].voteCount++;;
					}
					
					//show results						
					var winner = false;
					var winArr = [];
					for (var i = 0; i < acro.entries.length; i++) {
						utils.chSend(message, '`[#' + i +
						  '] ' + acro.entries[i].voteCount + 
						  ' votes for: ' + acro.entries[i].entry +
						  '` (by ' + utils.makeTag(acro.entries[i].author) + ')\n');

						if (winner === false) {
							if (acro.entries[i].voteCount > 0) {
								winner = i;
								winArr.push(i);
							}
						} else {
							if (acro.entries[i].voteCount > acro.entries[winner].voteCount) {
								winner = i;
								winArr = [];
								winArr.push(i);
							}
							else if (acro.entries[i].voteCount === acro.entries[winner].voteCount) {
								winArr.push(i);
							}
						}
					}			
					
					if (winner === false) {
						utils.chSend(message, 'Looks like no one won `!acro`. Sad!');
					} else {
						//utils.chSend(message, 'Number of !acro winners: ' + winArr.length);
						if (winArr.length === 1) {
							utils.alterStat(acro.entries[winner].author, 'acro', 'wins', 1, gameStats);
							utils.chSend(message, utils.makeTag(acro.entries[winner].author) + ' won `!acro`!' +
							  ' That makes ' + gameStats[acro.entries[winner].author].acro.wins + ' wins!');
						} else {
							var winStr = 'Looks like we have a tie in `!acro`! Winners: ';
							for (var i = 0; i < winArr.length; i++) {
								winStr += utils.makeTag(acro.entries[winArr[i]].author) + ' ';
							}
							utils.chSend(message, winStr);
						}
						if ((acro.entries.length >= acro.config.minPlayersForCredits) && winArr.length === 1) {
							utils.chSend(message, utils.makeTag(acro.entries[winner].author) + ' won `!acro` with ' +
							  'at least ' + acro.config.minPlayersForCredits + ' entries, and' +
							  ' won ' + acro.config.winCredits + ' credits!');
							utils.addBank(acro.entries[winner].author, acro.config.winCredits, bankroll);
							utils.alterStat(acro.entries[winner].author, 'acro', 'credwins', 1, gameStats);
							utils.chSend(message, utils.makeTag(acro.entries[winner].author) +
							  ' got a crediting acro win and now has ' +
							  gameStats[acro.entries[winner].author].acro.credwins +
							  ' crediting acro wins!');
						}
					}
				}, voteTimeAllowed * 1000);
			} else {
				utils.chSend(message, '`!acro` has ended, and no one submitted an entry.');					
				acro.runState = false;
			}
		}, timeAllowed * 1000);
	},
	a: function(message, parms) {
		let author = message.author;
		if (!this.runState) {
			utils.chSend(message, 'Acro not running. Start it with `!acro`.');
			return;
		}
		
		if (this.runState === 'vote') {
			utils.chSend(message, 'Too slow, ' + author.username +
			  ', voting has begun :slight_frown:');
			  return;
		}

		theirAcro = message.content.slice(3);
		theirAcro = theirAcro.split(' ');
			
		var letter;
		
		var i = 0;
		var isLegit = true;
		
		if (theirAcro.length !== this.letters.length) {
			utils.chSend(message, author.username +
			  ', that acro is the wrong length!');
			  isLegit = false;
		}
		
		while ((i < theirAcro.length) && isLegit) {
			letter = this.letters.charAt(i);
			if (!theirAcro[i].toLowerCase().startsWith(letter)) {
				isLegit = false;
			}
			i++;
		}
		
		if (isLegit) {
			if (this.players[message.author]) {
				utils.chSend(message, author.username + ', I am' +
				  'replacing your old submission.');
			}
			this.entries[message.author.id] = message.content.slice(2);
			utils.chSend(message, 'Got it, ' + author.username + '!');
		} else {
			utils.chSend(message, ':warning: ' + author.username +
			  ', your invalid acro was not accepted :.');
		}
	}
};