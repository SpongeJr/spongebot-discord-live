const cons = require('../lib/constants.js');
const utils = require('../lib/utils.js');
const request = require('request');
const mtcWatches = require('../' + cons.DATA_DIR + cons.MTC_WATCHFILE);

const MAX_KHAN_SUBS = 8;
const badId = function(id) {
	id = parseInt(id, 10);							
	if (id < 0) {
		return {message: 'Project id cannot be less than 0!'};
	} else if (id === 0) {
		return {message: 'Project id cannot be 0!'};
	} else if (isNaN(id)) {
		return {message: 'Project id needs to be a number!'};
	} else return false;
}

module.exports = {
	init: function(vars) {	
		console.log('-- mtcbtc.init(): Hello world.');
	},
	commands: {
		btc: {
			subCmd: {},
			do: function(message, args, gameStats) {
						
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
		},
		mtc: {
			help: "Try `!mtc notify` or something.",
			longHelp: "Works with mitcoin notifications. Try `!mtc notify` or something.",
			do: function(message, args, gameStats) {
				
				if (args[0] === '') {
					let theMess = '`!mtc` commands let you do things like set up DM notifications for when ';
					theMess += ' mitcoin prices rise above or fall below a value you set.';
					theMess += '\n Try `!mtc notify` for more info for now! Let @spongejr know about any bugs!';
					utils.chSend(message, theMess);
				} else {
					utils.chSend(message, 'What are you trying to do to that mitcoin?!');
				}
			},
			rise: function(mtc, client) {
				this.subCmd.notify.triggerEvt('above', mtc, client);
			},
			fall: function(mtc, client) {
				this.subCmd.notify.triggerEvt('below', mtc, client);
			},
			subCmd: {
				notify: {
					v: {
						triggers: mtcWatches
					},
					triggerEvt: function(event, mtc, client) {
						let triggers = this.v.triggers[event];
						let up = ':chart_with_upwards_trend:';
						let down = ':chart_with_downwards_trend:';
						
						let tellUser = function(who, serverId, str) {
							let server = client.guilds.get(serverId);
							let user = server.members.get(who);
							
							if (!user) {
								console.log('WARNING! server.members.get(' + who + ') is undefined!');
								return false;
							}
							user.send(str);
						}
						
						switch (event) {
							case 'above':
								for (id in triggers) {
									if (mtc > triggers[id].val) {
										tellUser(id, triggers[id].server,
										  `${up} Hey, mtc rose above ${triggers[id].val}! It's at ${mtc} now! ${up}` +
										  `\n I'll remove that alert trigger. Set a new one if you want!`);
										this.unregister(event, id);
									}
								}
								break;
							case 'below':
								for (id in triggers) {
									if (mtc < triggers[id].val) {
										tellUser(id, triggers[id].server,
										  `${down} Hey, mtc fell below ${triggers[id].val}! It's at ${mtc} now! ${down}` +
										  `\n I'll remove that alert trigger. Set a new one if you want!`);
										this.unregister(event, id);
									}
								}
								break;
							default:
								console.log('??? Somehow trigged a mtc event called: ' + event);
						}
					},
					unregister: function(event, who) {
						if (!this.v.triggers[event]) {
							console.log(`-- Tried to mtc.unregister(${event},${who}) but no triggers.${event}!`);
							return;
						}
						
						if (!this.v.triggers[event][who]) {
							console.log(`-- Tried to mtc.unregister(${event},${who}) but no triggers.${event}.${who}!`);
							return;
						}
						delete(this.v.triggers[event][who]);
						utils.saveObj(this.v.triggers, cons.MTC_WATCHFILE);
					},
					register: function(event, who, server, amt) {
						if (!this.v.triggers[event]) {
							// that event didn't exist, create it
							this.v.triggers[event] = {};
						} 
						this.v.triggers[event][who] = {"val": amt, "server": server};
						utils.saveObj(this.v.triggers, cons.MTC_WATCHFILE);
						//console.log(JSON.stringify(this.v));
					},					
					do: function(message, args, gamesStats) {
						const up = ':chart_with_upwards_trend:';
						const down = ':chart_with_downwards_trend:';
						let theMess = '';
						let author = message.author;
						let server;

						args.shift();
						
						if (!args[0]) {
						utils.chSend(message, `${author.username}, try ` +
						  '`mtc notify above`, `mtc notify below`, or `mtc notify list`.');
						  return;
						}
						
						if (args[0] !== '') {
							args[0] = args[0].toLowerCase();
						}
						
						if (args[0] === 'list') {
							theMess += `Your mtc alerts, ${author.username}:\n`;
							['above', 'below'].forEach((event) => {
								
								if (this.v.triggers[event][author.id]) {
									amt = this.v.triggers[event][author.id].val;
									if (amt) {
										theMess += `\`${event}: ${amt}\`\n`
									}
								}
							});
							utils.chSend(message, theMess);
						} else if (args[0] === 'above' || args[0] === '>') {
							
							if (!message.guild) {
								// if (!this.v.triggers[event][author.id].server) {}
								theMess += `I'm not comfortable doing that in DM just yet, can you do that in a channel?`
								utils.chSend(message, theMess);
								return;
							}
							
							server = message.guild.id;
							
							if (!args[1] || args[1] <= 0 || isNaN(args[1])) {
								theMess += `${author.username}, tell me what you want mtc to go above and I'll alert you.`
								theMess += '\nExample: `!mtc notify above 1.75` if you want to be DMed when it rises above 1.25';
							} else {
								let amt = parseFloat(args[1]);
								this.register('above', author.id, server, amt);
								theMess += `${up} ${author.username}, I'll DM you when mtc rises above ${amt}. `;
								theMess += utils.listPick(['To the moon!', 'Good luck!', 'Hope it works out for ya!',
									'Time to HODL!', 'Don\'t forget who helped you when you cash out!',
									'Hmm... think I should buy in', '', '', '', '', '', '', '']);
							}
							utils.chSend(message, theMess);
						} else if (args[0] === 'below' || args[0] === '<') {
							
							if (!message.guild) {
								// if (!this.v.triggers[event][author.id].server) {}
								theMess += `I'm not comfortable doing that in DM just yet, can you do that in a channel?`
								utils.chSend(message, theMess);
								return;
							}
							
							server = message.guild.id;
							
							if (!args[1] || args[1] <= 0 || isNaN(args[1])) {
								theMess += `${author.username}, tell me what you want mtc to go below and I'll alert you.`
								theMess += '\nExample: `!mtc notify below 1.25` if you want to be DMed when it falls below 1.25';
							} else {
								let amt = parseFloat(args[1]);
								this.register('below', author.id, server, amt);
								theMess += `${down} ${author.username}, I'll DM you when mtc falls below ${amt}. `;
								theMess += utils.listPick(['Got my digits crossed for ya! :fingers_crossed:', 'Good luck!', '',
									'Down! Down!', 'I think we\'re set for a fall, too.', 'Best of luck!', '', '', '', '', '']);
							}
							utils.chSend(message, theMess);
						} else {
							theMess += `${author.username}, you can ask me to `;
							theMess += '`notify above`, `notify below`, or `notify list`.';
							utils.chSend(message, theMess);
						}
					}
				}
			}
		}
	}
};