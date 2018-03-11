// memory.js Memory Game module for SpongeBot
// By Archcannon

var utils = require('../lib/utils.js');
var cons = require('../lib/constants.js');


module.exports = {
	v: { 
		grid: [],
		visible: [],
		active: false
	},
	subCmd: {},
	do: function(message, parms, gameStats, bankroll) {
		
		parms = parms.split(' ');
		if (parms[0] === '') {
			utils.chSend(message, 'Please see `!help memory` for help that isn\'t there.');
			return;
		}
		
		var sub = parms[0].toLowerCase(); // sub is the possible subcommand
		parms.shift(); // lop off the command that got us here
		
		if (this.subCmd.hasOwnProperty(sub)) {
			//we've found a found sub-command, so do it...
			// our default behavior: again, lop off the subcommand,
			// then put the array back together and send up a String
			// that has lopped off the command and subcommand,
			// and otherwise left the user's input unharmed
			parms = parms.join(' ');
			utils.debugPrint('>> calling subcommand .' + sub + '.do(' + parms + ')');
			this.subCmd[sub].do(message, parms, gameStats, this);
			return;
		} else {
			utils.chSend(message, 'What are you trying to do to your memory?!');
			return;
		}
	}
};