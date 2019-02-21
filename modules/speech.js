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
	commands: {
		speak: {
			disabled: true,
			do: function(message, args, gameStats) {
				
				// refactor into:  if (this.timeYet()) ... ?
				if (!utils.collectTimer(message, message.author.id, 'speak', this.timedCmd, gameStats)) {
					return false; // can't use it yet!
				}
				
				if (args[0] === '') {
					utils.chSend(message, "WOOF!");
				} else {
					utils.chSend(message, "Okay: " + args);
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
					do: function(message, args, gameStats) {
							utils.chSend(message, "AHHHHH! " + args);
					}
				},
				quiet: {
					do: function (message, args, gameStats) {
						utils.chSend(message, args + " (*shh*)");
					}
				}
			}
		},
		subscribe: {
			disabled: true,
			do: function(message, args, gameStats) {

				if (args[0] === '' || args[0] === 'help') {
					utils.chSend(message, 'Try `!subscribe add`, `!subscribe list`, `!subscribe check` or `!subscribe del`.');
				}
				
				if (args[0] !== '') {
					args[0] = args[0].toLowerCase();
					if (this.subCmd.hasOwnProperty(args[0])) {
						//we've found a found sub-command, so do it...
						this.subCmd[args[0]].do(message, args, gameStats);
						return; // we're done here
					}
				}	
			},
			help: "Work with your KA project subscriptions.",
			longHelp: "Work with your KA project subscriptions.",
			timedCmd: {
				howOften: 45000,
				gracePeriod: 0,
				failResponse: 'You can only use this command every <<howOften>>.'
			},
			subCmd: {
				del: {
					do: function(message, args, gameStats) {
						let author = message.author;
						let projectIdToDel = args[1];
						let currentSubs = utils.getStat(author.id, 'khan', 'subscriptions', gameStats);
						let matchIndex;
						let theMess = '';
						
						// check for bad IDs
						let isBad = badId(projectIdToDel);
						if (isBad) {
							utils.chSend(message, `That's invalid, ${author.username}, ${isBad.message}`);
							return;
						}
						
						// check for no subs or missing sub stat
						if (!Array.isArray(currentSubs) || currentSubs.length === 0) {
							utils.chSend(message, `${author.username}, you have no subscriptions.`);
							return;
						}
						
						matchIndex = currentSubs.findIndex(function(sub) {
							return sub.projectId === projectIdToDel;
						});
						if (matchIndex === -1) {
							theMess += `${author.username}, you don't seem to be subscribed to that scratchpad.\n`
							theMess += 'Make sure you use `!subscribe del <scratchpadID>`. ';
							theMess += 'You can `!subscribe list` to see your subscriptions.';
							utils.chSend(message, theMess);
							return;
						}
						currentSubs.splice(matchIndex, 1);
						theMess += `${author.username}, I removed it. You now have ${currentSubs.length} subscriptions.`;
						utils.chSend(message, theMess);
					}
				},
				add: {
					do: function(message, args, gameStats) {
						
						let author = message.author;
						let projectIdToAdd = args[1];
						let currentSubs = utils.getStat(author.id, 'khan', 'subscriptions', gameStats);
						let updatedDate;
						let matchIndex;
						let theMess = '';
	
						let isBad = badId(projectIdToAdd);
						if (isBad) {
							utils.chSend(message, `No, ${author.username}, ${isBad.message}`);
							return;
						}
						if (!Array.isArray(currentSubs)) { currentSubs = 0; }
						if (currentSubs.length >= MAX_KHAN_SUBS) {
							theMess += `${author.username}, you are only allowed ${MAX_KHAN_SUBS}. `;
							theMess += '\nYou need to remove some with `!subscribe del` before adding another.';
							utils.chSend(message, theMess);
							return;
						}

						request({url: cons.URLS.ka.scratchpad + projectIdToAdd, json: true}, function(err, body, response) {
						
							// do valid project check here. if we got a String back, assume invalid.
							if (typeof response === 'string') {
								
								if (body.statusCode === 404) {
									theMess += `[404] ${author.username}, that's not a valid scratchpad!`
								} else {								
									theMess += `${author.username}, I couldn't subscribe you to that.`;
									theMess += `\n Here's what the server said to me: ${response}`;
								}
								
								utils.chSend(message, theMess);
								return;
							}							
							
							// convert into integer timestamp or ?
							updatedDate = new Date(response.date).valueOf();
							if (isNaN(updatedDate)) { updatedDate = '?';}
									
							if (!Array.isArray(currentSubs)) { currentSubs = []; }
							
							matchIndex = currentSubs.findIndex(function(sub) {
								return sub.projectId === projectIdToAdd;
							});
	
							if (matchIndex === -1) {
								// no match, push new
								theMess += `Ok, adding "${response.title}" (${projectIdToAdd})`
								theMess += ` to your subscriptions, ${author.username}!`;
								currentSubs.push({
									'projectId': projectIdToAdd,
									'updated': updatedDate,
									'title': response.title
								});
								utils.setStat(author.id, 'khan', 'subscriptions', currentSubs, gameStats);
							} else {
								theMess += `${author.username}, you are already subscribed to ${projectIdToAdd}.`;
							}
							
							utils.chSend(message, theMess);
							
						});
					}
				},
				list: {
					do: function(message, args, gameStats) {
						let author = message.author;
						let currentSubs;
						let theMess;
						
						currentSubs = utils.getStat(author.id, 'khan', 'subscriptions', gameStats);
						if (!Array.isArray(currentSubs)) { currentSubs = []; }
						theMess = `You have ${currentSubs.length} subscriptions.`
						
						for (var i = 0; i < currentSubs.length; i++) {
							theMess += `\n [${i + 1}]: "${currentSubs[i].title}" (${currentSubs[i].projectId})`;
						}
						
						if (currentSubs.length > 0) { theMess = '```' + theMess + '```'; }
						
						utils.chSend(message, theMess);
					}
				},
				check: {					
					do: function(message, args, gameStats) {

						let author = message.author;
						let currentSubs;
						let updatedSubs = [];
						let theMess = '';
						var niceDate = function(raw) {
							return new Date(raw).toDateString();
						}
						
						currentSubs = utils.getStat(author.id, 'khan', 'subscriptions', gameStats);						
						if (!Array.isArray(currentSubs)) { currentSubs = []; }

						var handleResponse = function(error, body, response, ind) {
							currentSubs[ind].isDone = true;
							let oneSub = {};
							if (error) {
								oneSub = {
									"title": ' -ERROR- ',
									"projectId": currentSubs[ind].projectId,
									"updated": '?'							
								};
							} else {
								oneSub = {
									"title": response.title || '?',
									"projectId": currentSubs[ind].projectId,
									"updated": new Date(response.date).valueOf(),
									"ind": ind
								};
							}
							if (isNaN(oneSub.updated)) { oneSub.updated = '?';}
							updatedSubs.push(oneSub);

							// was that the last one?
							if (currentSubs.length === updatedSubs.length) {
								let updatedCount = 0;								
								theMess += `${author.username}, I've checked all your subscriptions.\n`;
								theMess += '```';

								for (let i = 0; i < updatedSubs.length; i++) {
									let was = currentSubs[updatedSubs[i].ind].updated;
									let now = updatedSubs[i].updated;
									
									if (now > was) {
										theMess += `\nUPDATED: "${updatedSubs[i].title}" (${updatedSubs[i].projectId})`
										theMess += `: ${niceDate(was)} ==> ${niceDate(now)}`;
										currentSubs[updatedSubs[i].ind].updated = now;
										currentSubs[updatedSubs[i].ind].title = updatedSubs[i].title;
										updatedCount++;
									} else if (now === '?') {
										console.log(`!subscribe update: ${updatedSubs[i].projectId} has invalid date!`);
									}
								}
								theMess += '\n  PROJECTS THAT WERE UPDATED: ' + updatedCount + '```';
								utils.chSend(message, theMess);
								
								if (updatedCount) {
									utils.setStat(author.id, 'khan', 'subscriptions', currentSubs, gameStats);
								}
							}							
						}
						
						// MAIN of .subCmd.check()
						for (let i = 0; i < currentSubs.length; i++) {
							// for each sub, fire off call to get date, compare when it comes back
							
							currentSubs[i].isDone = false;
							
							let options = {
								url: cons.URLS.ka.scratchpad + currentSubs[i].projectId,
								json: true
							};
							
							request(options, function(error, body, response) {
								handleResponse(error, body, response, i)
							});
						}
					}
				}
			}
		}
	}
};