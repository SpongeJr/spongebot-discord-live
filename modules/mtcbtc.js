const cons = require('../lib/constants.js');
const ut = require('../lib/utils.js');
const request = require('request');
const mtcWatches = require('../' + cons.DATA_DIR + cons.MTC_WATCHFILE);

const parseMtc = function(str) {
	if (!str || !str.name) {
		// console.log('parseMtc(): input string or .name property undefined, returning.');
		return false;
	}
	let _str = str.name.match(/\d|\./g);
	if (!_str) {
		// console.log('parseMtc(): No match on regex, returning.');
		return false;
	}
	return parseFloat(_str.join(''));
};

const v = {};
v.timers = {};
v.mtctickerEnabled = true;

module.exports = {
	init: function(vars) {

		if (vars.client) {
			client = vars.client
		} else {
			client = vars;
		}

		v.timers.mtcLookupTimer = setInterval( () => {
			// surely will be replaced with setTimeout because reasons

			//let mtcServer = client.guilds.cache.get(MTCBOT_WATCH_SERVER);
			let mtcBot = client.users.cache.get(cons.MTCBOT_ID);
			let presence = mtcBot.presence;
			let activity = presence.activities[0]
			//console.log("--- MTC UPDATE ---");
			let activityName = activity;
			//console.log(activityName);
			let newMtcVal = parseMtc(activityName);
			if (newMtcVal) {
				if (!v.hasOwnProperty("oldMtcVal")) {
					// v.oldMtcVal = newMtcVal;
				}
				v.oldMtcVal = v.newMtcVal;
				v.newMtcVal = newMtcVal;
			}

			let oldVal = v.oldMtcVal;
			let newVal = v.newMtcVal;

			if (oldVal && newVal) {
				//console.log(`  mtc update: ${oldVal} -> ${newVal}`);

				if (v.mtctickerEnabled) {
					let tickerMess = '`MTC: ' + newVal + '`';
					let change = Math.abs(newVal - oldVal);

					if (newVal > oldVal) {
						tickerMess += ` [ :arrow_up_small: ${change.toFixed(3)} ]`;
					} else if (newVal < oldVal) {
						tickerMess += ` [ :small_red_triangle_down: ${change.toFixed(3)} ]`;
					} else {
						tickerMess += ` [ :heavy_minus_sign: 0.000 ] `;
					}
					client.channels.cache.get(cons.MTCTICKERCHAN_ID).send(tickerMess);
				}

				if (newVal > oldVal) { module.exports.commands.mtc.rise(newVal, client); }
				else if (oldVal > newVal) { module.exports.commands.mtc.fall(newVal, client); }
			} else {
				// console.log(`! mtc update FAIL: ${oldVal} -> ${newVal}`);
			}
		}, cons.MTC_LOOKUP_INTERVAL)

		console.log('-- mtcbtc.init(): Hello world.');
	},
	commands: {
		btc: {
			subCmd: {},
			do: function(message, args, gameStats) {

				let author = message.author;

				if (!ut.collectTimer(message, author.id, 'btc', this.timedCmd, gameStats)) {
					return false; // can't use it yet!
				}

				console.log(`!btc: Doing a btc lookup at ${cons.URLS.getBtc}...`);
				request({url: cons.URLS.getBtc, json: true}, function (err, body, response) {
					let rate = response.data.amount;
					ut.chSend(message, `${author.username}, 1 btc is currently trading for ${rate} USD.`);
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
					ut.chSend(message, theMess);
				} else {
					ut.chSend(message, 'What are you trying to do to that mitcoin?!');
				}
			},
			rise: function(mtc, client) {
				this.subCmd.notify.triggerEvt('above', mtc, client);
			},
			fall: function(mtc, client) {
				this.subCmd.notify.triggerEvt('below', mtc, client);
			},
			subCmd: {
				value: {
					do: function(message, args, gameStats) {
						let theMess = '';
						let author = message.author;
						let nickname = author.username;

						let mtcValue;
						mtcValue = v.newMtcVal;

						if (!mtcValue) {
							theMess += `${nickname}, I don't know the current value of mtc.`;
						} else {
							theMess += `${nickname}, mtc is at: ${mtcValue}`;
						}
						ut.chSend(message, theMess);
					}
				},
				notify: {
					v: {
						triggers: mtcWatches
					},
					triggerEvt: function(event, mtc, client) {
						let triggers = this.v.triggers[event];
						let up = ':chart_with_upwards_trend:';
						let down = ':chart_with_downwards_trend:';

						let tellUser = function(who, serverId, str) {
							let server = client.guilds.cache.get(serverId);
							let user = server.members.cache.get(who);

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
						ut.saveObj(this.v.triggers, cons.MTC_WATCHFILE);
					},
					register: function(event, who, server, amt) {
						if (!this.v.triggers[event]) {
							// that event didn't exist, create it
							this.v.triggers[event] = {};
						}
						this.v.triggers[event][who] = {"val": amt, "server": server};
						ut.saveObj(this.v.triggers, cons.MTC_WATCHFILE);
						//console.log(JSON.stringify(this.v));
					},
					do: function(message, args, gameStats) {
						const up = ':chart_with_upwards_trend:';
						const down = ':chart_with_downwards_trend:';
						let theMess = '';
						let author = message.author;
						let nickname = author.username;

						let server;

						args.shift();

						if (!args[0]) {
						ut.chSend(message, `${nickname}, try ` +
						  '`mtc notify above`, `mtc notify below`, or `mtc notify list`.');
						  return;
						}

						if (args[0] !== '') {
							args[0] = args[0].toLowerCase();
						}

						if (args[0] === 'list') {
							theMess += `Your mtc alerts, ${nickname}:\n`;
							['above', 'below'].forEach((event) => {

								if (this.v.triggers[event][author.id]) {
									amt = this.v.triggers[event][author.id].val;
									if (amt) {
										theMess += `\`${event}: ${amt}\`\n`
									}
								}
							});
							ut.chSend(message, theMess);
						} else if (args[0] === 'above' || args[0] === '>') {

							if (!message.guild) {
								// if (!this.v.triggers[event][author.id].server) {}
								theMess += `I'm not comfortable doing that in DM just yet, can you do that in a channel?`
								ut.chSend(message, theMess);
								return;
							}

							server = message.guild.id;

							if (!args[1] || args[1] <= 0 || isNaN(args[1])) {
								theMess += `${nickname}, tell me what you want mtc to go above and I'll alert you.`
								theMess += '\nExample: `!mtc notify above 1.75` if you want to be DMed when it rises above 1.25';
							} else {
								let amt = parseFloat(args[1]);
								this.register('above', author.id, server, amt);
								theMess += `${up} ${nickname}, I'll DM you when mtc rises above ${amt}. `;
								theMess += ut.listPick(['To the moon!', 'Good luck!', 'Hope it works out for ya!',
									'Time to HODL!', 'Don\'t forget who helped you when you cash out!',
									'Hmm... think I should buy in', '', '', '', '', '', '', '']);
							}
							ut.chSend(message, theMess);
						} else if (args[0] === 'below' || args[0] === '<') {

							if (!message.guild) {
								// if (!this.v.triggers[event][author.id].server) {}
								theMess += `I'm not comfortable doing that in DM just yet, can you do that in a channel?`
								ut.chSend(message, theMess);
								return;
							}

							server = message.guild.id;

							if (!args[1] || args[1] <= 0 || isNaN(args[1])) {
								theMess += `${nickname}, tell me what you want mtc to go below and I'll alert you.`
								theMess += '\nExample: `!mtc notify below 1.25` if you want to be DMed when it falls below 1.25';
							} else {
								let amt = parseFloat(args[1]);
								this.register('below', author.id, server, amt);
								theMess += `${down} ${nickname}, I'll DM you when mtc falls below ${amt}. `;
								theMess += ut.listPick(['Got my digits crossed for ya! :fingers_crossed:', 'Good luck!', '',
									'Down! Down!', 'I think we\'re set for a fall, too.', 'Best of luck!', '', '', '', '', '']);
							}
							ut.chSend(message, theMess);
						} else {
							theMess += `${nickname}, you can ask me to `;
							theMess += '`notify above`, `notify below`, or `notify list`.';
							ut.chSend(message, theMess);
						}
					}
				}
			}
		}
	}
};
