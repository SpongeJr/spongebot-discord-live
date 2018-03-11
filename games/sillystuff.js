var sponge = {};
spongeBot.sponge = {
	timedCmd: {
		howOften: 20000,
		gracePeriod: 0,
		failResponse:  '   :warning:  You cannot polymorph back yet.'
	},
	cmdGroup: 'Miscellaneous',
	do: function(message, args) {
		var author = message.author.id;
		var found = false;
		if (!utils.collectTimer(message, author, 'sponge', spongeBot.sponge.timedCmd, gameStats)) {
			return false; // can't use it yet!
		}		
		
		
		for(var key in sponge) {
			if(key === author) {
				found = true;
				delete sponge[key];
			}
		}
		if(!found) {
			sponge[author] = true;
			utils.chSend(message, utils.makeTag(author) + ', you have been polymorphed into a sponge!');
		} else {
			utils.chSend(message, utils.makeTag(author) + ', you have been polymorphed back to normal!');
		}
	},
	help: 'TODO',
	longHelp: 'TODO'
};
//-----------------------------------------------------------------------------