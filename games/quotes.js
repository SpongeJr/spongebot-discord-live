let cons = require('../lib/constants.js');
let utils = require('../lib/utils.js');
let v = {};
let quotes = require('../' + cons.DATA_DIR + cons.QUOTES_FILE);
let Quote = function(theQ) {
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
			let message = react.message;
			let idAdded = userAdded.id;
			let said = react.message.content;
			let whoSaid = react.message.author;
			let quotesBySameUser;
			let theMess;
			let theQ = new Quote({
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
				userAdded.send(`That is already a quote by ${whoSaid.username}, ${userAdded.username}.`);
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

			userAdded.send(theMess);
			utils.saveObj(quotes, cons.QUOTES_FILE);
		},
		subCmd: {
			random: {
				do: function(message, parms, client, gameStats) {
					
					let who;
					if (!quotes.hasOwnProperty(message.guild.id)) {
						quotes[message.guild.id] = {};
					}
					
					if (!parms) {
						
						let guildQuotesArr = Object.entries(quotes[message.guild.id]);
						//console.log(guildQuotesArr);
						who = guildQuotesArr[Math.floor(Math.random() * guildQuotesArr.length)][0];
					} else {					
						who = utils.makeId(parms);
					}
					
					let addedBy;
					
					if (quotes[message.guild.id].hasOwnProperty(who)) {
						let theStr = '';
						let userQs = JSON.stringify(quotes[message.guild.id][who]);
						userQs = JSON.parse(userQs); 
						let oneQ = utils.listPick(userQs)[0];
						theStr += `"${oneQ.quote}" _- **${utils.idToNick(who, gameStats)}**_ `;
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
					let server = cons.SERVER_ID;
					let filename = cons.QUOTES_FILE;
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
			
			let sub = parms[0].toLowerCase(); // sub is the possible subcommand
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