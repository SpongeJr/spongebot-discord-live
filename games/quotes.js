var cons = require('../lib/constants.js');
var utils = require('../lib/utils.js');
var v = {};
var quotes = require('../' + cons.DATA_DIR + cons.QUOTES_FILE);
var Quote = function(theQ) {
	this.quote = theQ.quote || "",
	this.addedBy = theQ.addedBy || "unknown",
	this.timestamp = theQ.timestamp || new Date()
}


// 	!quote
//	!quote 	random	 		displays a random quote from the whole database, all users
//	!quote	random	<user>	random quote from that user
//  !quote	add		<user>	add message ID to quotes
//	!quote	undo			undoes last quote that YOU added
//	!quote	count			total of all quotes
//	!quote	count	<user>	total of all of <user>'s quotes

module.exports = {
	q: {
		addByReact: function(react, userAdded, client) {
			var idAdded = userAdded.id;
			var said = react.message.content;
			var whoSaid = react.message.author.id;
			
			var theQ = new Quote({
				"quote": said,
				"addedBy": idAdded,
			});
			
			if (!quotes.guild[whoSaid]) {
				quotes.guild[whoSaid] = [];
			}
			
			quotes.guild[whoSaid].push(theQ);
			utils.chSend(react.message, '**Added:** "' + theQ.quote + '" _-' + whoSaid +
			  '_ on ' + theQ.timestamp + ' (added by ' + userAdded + ')');
			  
			console.log('**Added:** "' + theQ.quote + '" _-' + whoSaid +
			  '_ on ' + theQ.timestamp + ' (added by ' + idAdded+ ')');
			  
			utils.saveObj(quotes, cons.QUOTES_FILE);
		},
		subCmd: {
			random: {
				do: function(message, parms) {
					var who = utils.makeId(parms);
					
					if (!quotes.hasOwnProperty('guild')) {
						quotes.guild = {};
					}
					
					if (quotes.guild.hasOwnProperty(who)) {
						var theStr = '';
						var userQs = JSON.stringify(quotes.guild[who]);
						userQs = JSON.parse(userQs); 
						var oneQ = utils.listPick(userQs)[0];
						theStr += '"' + oneQ.quote + '" _-' + who +'_ ';
						when = new Date(oneQ.timestamp);
						theStr += ' on: ' + when + ' (added by ' + oneQ.addedBy + ')';
						utils.chSend(message, theStr);
					} else {
						utils.chSend(message, ' No quotes found by ' + parms);
					}	
				}
			},
			add: {
				do: function() {
				}
			},
			undo: {
				do: function() {
					console.log('Picked undo!');
				}
			},
			count: {
				do: function() {
					console.log('Picked count ha ha haaa!');
				}
			},
			save: {
				do: function(message, parms) {
					var server = cons.SERVER_ID;
					var filename = cons.QUOTES_FILE;
					//utils.saveObj(server, 'quotes', quotes.guild, filename);
					utils.saveObj(quotes, cons.QUOTES_FILE);
					console.log(quotes.guild);
					utils.chSend(message, 'Probably saved quotes file. This shouldn\'t need to be done manually, though.');
				}
			}
		},
		do: function(message, parms, client) {
		
			parms = parms.split(' ');
			if (parms[0] === '') {
				utils.chSend(message, 'Quote someone .');
				return;
			}
			
			var sub = parms[0].toLowerCase(); // sub is the possible subcommand
			parms.shift(); // lop off the command that got us here
			
			if (this.subCmd.hasOwnProperty(sub)) {
				parms = parms.join(' ');
				this.subCmd[sub].do(message, parms, client);
				return;
			} else {
				utils.chSend(message, 'What are you trying to do to that quote?!');
				return;
			}
		}
	}
};