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

			if (!message.guild) {
				utils.chSend(message, "You can't add quotes from DM. Try reacting to a message in a public channel.");
				return;
			}

			if (!message.guild.id) {
				utils.chSend(message, "Hm, something didn't work. You can't add quotes from DM. Try reacting to a message in a public channel.");
				return;
			}

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
			
			if (theMess.length > 1990) {
				console.log(`quotes.q.addByReact: Truncating ${theMess.length} length message to 1990 chars.`);
				theMess = theMess.substring(0, 1990);
			}

			userAdded.send(theMess);
			utils.saveObj(quotes, cons.QUOTES_FILE);
		},
		subCmd: {
			random: {
				do: function(message, parms, client, gameStats) {

					let who;

					if (!message.guild) {
						utils.chSend(message, "This feature can only be used in a server, not DM. Try it there?");
						return;
					}



					if (!quotes.hasOwnProperty(message.guild.id)) {
						quotes[message.guild.id] = {};
					}

					if (!parms) {

						let guildQuotesArr = Object.entries(quotes[message.guild.id]);

						if (guildQuotesArr.length === 0) {
							utils.chSend(message, 'I have no quotes stored for this server.\n' +
							  `React with ${cons.QUOTE_SAVE_EMO_TEXT} on a message in a channel I can see to save a quote.`);
							return;
						}

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
						utils.chSend(message, `No quotes found by that user.`);
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
				utils.chSend(message, `React with ${cons.QUOTE_SAVE_EMO_TEXT} to a message to add it the quotes databse!` +
				  '\nOr, type !quote random <user> to see a random quote from a user.');
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
