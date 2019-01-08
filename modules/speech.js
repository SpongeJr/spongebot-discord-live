const cons = require('../lib/constants.js');
const utils = require('../lib/utils.js');

module.exports = {
	commands: {
		speak: {
			disabled: true,
			do: function(message, parms, gameStats) {
				
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
		}
		
	}
};