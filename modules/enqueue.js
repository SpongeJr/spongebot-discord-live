const cons = require('../lib/constants.js');
const utils = require('../lib/utils.js');
const chSend = utils.chSend;

var Command = utils.Command;

module.exports = {
	commands: {
		q: {
			help: 'Works with the karoke/live performance queue',
			longHelp: false,
			disabled: false,
			accessRestrictions: false,
			cmdGroup: 'Fun and Games',
			do: function(message, parms, gameStats) {
				chSend(message, 'WIP :rip:');
			}
		}
	}
};