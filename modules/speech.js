const cons = require('../lib/constants.js');
const utils = require('../lib/utils.js');
const request = require('request'); 

module.exports = {
	commands: {
		speak: {
			disabled: true,
			do: function(message, parms, gameStats) {
				
				// refactor into:  if (this.timeYet()) ... ?
				if (!utils.collectTimer(message, message.author.id, 'speak', this.timedCmd, gameStats)) {
					return false; // can't use it yet!
				}
				
				if (parms) {
					utils.chSend(message, "Okay: " + parms);
				} else {
					utils.chSend(message, "WOOF!");
				}
			},
			help: "Make me speak",
			longHelp: "This command makes me speak",
			timedCmd: {
				howOften: 1000 * 30,
				gracePeriod: 1000,
				failResponse: 'I can only speak every <<howOften>>.'
			},
			subCmd: {
				loud: {
					do: function(message, parms, gameStats) {
							utils.chSend(message, "AHHHHH! " + parms);
					}
				},
				quiet: {
					do: function (message, parms, gameStats) {
						utils.chSend(message, parms + " (*shh*)");
					}
				}
			}
		},
		btc: {
			disabled: true,
			do: function(message, parms, gameStats) {
				
				let author = message.author;
				
				if (!utils.collectTimer(message, author.id, 'btc', this.timedCmd, gameStats)) {
					return false; // can't use it yet!
				}
				
				console.log(`!btc: Doing a btc lookup at ${cons.URLS.getBtc}...`);
				request({url: cons.URLS.getBtc, json: true}, function (err, body, response) {
					let rate = response.data.amount;					
					utils.chSend(message, `${author.username}, 1 btc is currently trading for ${rate} USD.`);
					
				});
			},
			help: "Check current btc:usd exchange rate",
			longHelp: "Check current btc:usd exchange rate so you know when to HODL.",
			timedCmd: {
				howOften: 45000,
				gracePeriod: 0,
				failResponse: 'You can only use this command every <<howOften>>.'
			}
		}
		
	}
};