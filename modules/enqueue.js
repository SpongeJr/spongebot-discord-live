const cons = require('../lib/constants.js');
const utils = require('../lib/utils.js');
var queue = require('../' + cons.DATA_DIR + cons.ENQUEUE_FILE);


const Command = utils.Command;
const Song = function(config) {
	
	if (!config) {config = {};}
	
	this.performer = config.performer || 'An unnamed performer',
	this.song = config.song || 'An unnamed song'
};

module.exports = {
	commands: {
		q: {
			help: 'Works with the karoke/live performance queue',
			longHelp: false,
			disabled: false,
			accessRestrictions: false,
			cmdGroup: 'Fun and Games',
			do: function(message, parms, gameStats) {
				parms = parms.split(' ');		
				if (parms[0] === '') {
					
					if (queue.length === 0) {
						utils.chSend(message, 'The queue is empty.');
						return;
					}
					
					utils.chSend(message, 'Showing queue...');
					
					let str = '```';
					for (let i = 0; i < queue.length; i++) {
						str += '[ ' + (i + 1) + ' ] ';
						str += queue[i].performer + " ··· " + queue[i].song;
						str += '\n';
						
					}
					str += '```';
					utils.chSend(message, str);

					return;
				}
				parms[0] = parms[0].toLowerCase();
				let subCmd = parms[0];
				
				if (this.subCmd.hasOwnProperty(parms[0])) {
					//we've found a found sub-command, so do it...
					parms.shift();
					parms = parms.join(' ');
					this.subCmd[subCmd].do(message, parms, gameStats);
				} else {
					utils.chSend(message, 'Please see `!help q` for help with the queue command.');
				}
			},
			subCmd: {
				"+": {
					do: function(message, parms, gameStats) {
						
						parms = parms.split(' ');
						let who = parms[0];
						parms.shift();
						let song = parms.join(' ');
						
						queue.push(new Song({"performer": who, "song": song}));
						utils.saveObj(queue, cons.ENQUEUE_FILE);
						utils.chSend(message, 'Added a song to queue. .length is now: ' + queue.length);
					}
				},
				"-": {
					do: function(message, parms, gameStats) {
						
						if (queue.length === 0) {
							utils.chSend(message, 'The queue is already empty!');
							return;
						}
						
						let num = parseInt(parms);
						
						if ((num > queue.length) || (num < 1) || (isNaN(num))) {
							utils.chSend(message, 'Can\'t remove that number. There are ' + queue.length + ' in the queue.');
							return;
						}
						
						let removed = queue.splice(num - 1, 1);
						utils.chSend(message, 'OK, removing song #' + num + ' (' + removed[0].song +
						  ' by ' + removed[0].performer + ')');
					}
				}
			}
		}
	}
};