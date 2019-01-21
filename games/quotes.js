var cons = require('../lib/constants.js');
var utils = require('../lib/utils.js');
var v = {};
var quotes = require('../' + cons.DATA_DIR + cons.QUOTES_FILE);
var Quote = function(theQ) {
	this.quote = theQ.quote || "";
	this.addedBy = {
		id: theQ.id || "unknown",
		nick: theQ.nick || "unknown",
	};
	this.timestamp = theQ.timestamp || new Date();
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
			var message = react.message;
			var idAdded = userAdded.id;
			var said = react.message.content;
			var whoSaid = react.message.author;
			var quotesBySameUser;
			var theMess;
			var theQ = new Quote({
				"quote": said,
				"id": idAdded,
				"nick": userAdded.username
			});
	
			if (!quotes[message.guild.id]) {
				quotes[message.guild.id] = {};
			}
				
			quotesBySameUser = quotes[message.guild.id][whoSaid.id];
			
			if (!quotesBySameUser) {quotesBySameUser = [];}
			
			// look for said in qBSU		
			if (quotesBySameUser.find(function(element){return element.quote === said;})) {
				utils.chSend(message, `That is already a quote by ${whoSaid.username}, ${userAdded.username}.`);
				return;
			}

			if (!quotes[message.guild.id][whoSaid.id]) {
				quotes[message.guild.id][whoSaid.id] = [];
			}
			
			quotes[message.guild.id][whoSaid.id].push(theQ);
			theMess = `**Added:** "${theQ.quote}" _- ${whoSaid.username}_ on ` +
			  `${theQ.timestamp} (added by **${userAdded.username}**)`;
			
			if (quotesBySameUser.length >= cons.QUOTE_SERVER_LIMITS[message.guild.id]) {
				theMess += `\nThe server is configured for ${cons.QUOTE_SERVER_LIMITS[message.guild.id]} quotes per user maximum.\n`;
				let bumped = quotes[message.guild.id][whoSaid.id].shift();
				theMess += `The oldest quote has been knocked off. It was "${bumped.quote}".`;
			}

			utils.chSend(react.message, theMess);
			utils.saveObj(quotes, cons.QUOTES_FILE);
		},
		subCmd: {
			random: {
				do: function(message, parms, client, gameStats) {
					var who = utils.makeId(parms);
					var addedBy;

					if (!quotes.hasOwnProperty(message.guild.id)) {
						quotes[message.guild.id] = {};
					}

					if (quotes[message.guild.id].hasOwnProperty(who)) {
						var theStr = '';
						var userQs = JSON.stringify(quotes[message.guild.id][who]);
						userQs = JSON.parse(userQs); 
						var oneQ = utils.listPick(userQs)[0];
						theStr += `"${oneQ.quote}" _- ${utils.idToNick(who, gameStats)}_ `;
						when = new Date(oneQ.timestamp);
						when = when.toString().split(' GMT')[0];
						addedBy = oneQ.addedBy;

						theStr += ` on: ${when} (added by **${addedBy.nick}**)`;
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
		do: function(message, parms, client, gameStats) {
		
			parms = parms.split(' ');
			if (parms[0] === '') {
				utils.chSend(message, 'React with :record_button: to a message to add it the quotes databse! Or, type !quote random <user> to see a random quote from a user.');
				return;
			}
			
			var sub = parms[0].toLowerCase(); // sub is the possible subcommand
			parms.shift(); // lop off the command that got us here
			
			if (this.subCmd.hasOwnProperty(sub)) {
				parms = parms.join(' ');
				this.subCmd[sub].do(message, parms, client, gameStats);
				return;
			} else {
				utils.chSend(message, 'What are you trying to do to that quote?!');
				return;
			}
		}
	}
};