// raffle.js Raffle module for SpongeBot
// By SpongeJr

const utils = require('../lib/utils.js');
const cons = require('../lib/constants.js');
var giveaways = require('../../data/giveaways.json');

module.exports = {
	startNum: 1,
	v: {},
	giveaways: {
		do: function(message, parms, gameStats) {
			var str = '';
			var count = 0;
			if (!parms) {
				utils.chSend(message, 'Type `!giveaways list` to see what is available for winning a raffle. ' + 
				  ' Items listed there will be options  you can pick if you win a standard raffle.' +
				  ' Standard raffles are usually on the second and fourth friday of every month.' +
				  '\n\n Also see `!help giveaways` for help on options like `!giveaways addrole` and ' +
				  '`!giveaways categories`.');
			}
			
			parms = parms.split(' ');
			
			if (parms[0] === 'suggest') {
				utils.chSend(message, ' Talk to @sponge to suggest something for !giveaways.');
				return;
			}
			
			if (parms[0] === 'list') {
				
				parms.shift();
				parms = parms.join(' ');
				
				str = 'Use `!giveaways info <item>` for more info.\n';
				for (let item in giveaways) {
					if ((giveaways[item].hasOwnProperty('type') && giveaways[item].type === parms) || parms === '') {
						if ((giveaways[item].hasOwnProperty('disabled') && giveaways[item].disabled !== "true") || (!giveaways[item].hasOwnProperty('disabled'))) {
							str += '`' + item + '`   ';
							count++;
						}
					}
				}
				str += '\n';
				
				count = count || 'No';
				str += count + ' item(s) found';
				if (parms !== '') {
					str += ' for category: **' + parms + ' **';
				}
				str += '\nList subject to change.';
				utils.chSend(message, str);
				return;
			}
			
			if (parms[0] === 'info') {
				parms.shift();
				parms = parms.join(' ');
				if (giveaways.hasOwnProperty(parms)) {
					str = '`' + parms + '`: ';
					str += giveaways[parms].info.description + '\n';
					str += ' **Category**: ' + (giveaways[parms].type || '(none)');
					str += '   **More info**: ' + giveaways[parms].info.infoUrl;
					utils.chSend(message, str);
				} else {
					utils.chSend(message, 'Couldn\'t find any info for that giveaway, ' + message.author +
					  '. Make sure you type (or copy/paste) the _exact_ title. Use `!giveaways list` for a list.');
				}
			} else if (parms[0] === 'addrole') {
				
				if (message.channel.type === 'dm') {
					utils.chSend(message, 'Sorry, ' + message.author + ', you need to do this on the server, ' +
					'and not in DM, because I don\'t know where to give you the giveaways role otherwise!');
					return;
				}

				let role = message.guild.roles.find('name', 'giveaways');
				if (message.member.roles.has(role.id)) {
					utils.debugPrint('!giveaways addrole: Did not add role or award ticket because they had it already.');
					utils.chSend(message, message.author + ' I think you already had that role.');
				} else {
					message.member.addRole(role);
					utils.chSend(message, message.author + ', I\'ve given you the `giveaways` role. ' + 
					' You might be pinged at any time of day for giveaways, raffles, and related announcements and info.' +
					'\n If something went wrong, you don\'t have the role, or you didn\'t really want it, please ping ' +
					' <@167711491078750208> to sort it out. And... good luck in the giveaways!');
					utils.chSend(message, message.author + ', I\'m also giving you a free :tickets: with your new role! You now have ' +
					  utils.alterStat(message.author.id, 'raffle', 'ticketCount', 1, gameStats) + ' raffle tickets!');
				}
			} else if (parms[0] === 'categories') {
				let cats = {};
				var theStr = ' Raffle item categories: ';
				for (let item in giveaways) {
					if (giveaways[item].hasOwnProperty('type')) {
						cats[giveaways[item].type] = true;
					}
				}
				for (let cat in cats) {
					theStr += '`' + cat + '` ';
				}
				utils.chSend(message, theStr);
			}
		}
	},
	subCmd: {
		ticket: {
			do: function(message, parms, gameStats) {
				// replace with access check someday
				if (message.author.id === cons.SPONGE_ID) {
					var who;
					var amt;
					var str;
					if (!parms) {
						utils.chSend(message, 'You forgot the target to for !ticket.');
						return;
					}
					
					parms = parms.split(' ');
					who = utils.makeId(parms[0]);

					if (message.mentions.users.has(who)) {
						// there's an @ mention, and it matches the id sent up
						// so we can pass a user up to alterStat for nick nicking
						who = message.mentions.users.find('id', who);
					}

					if (parms[1] === '' || typeof parms[1] === 'undefined') {
						amt = 1;
					} else {
						amt = parseInt(parms[1]);	
					}
					
					str = who + ' now has ';
					str += utils.alterStat(who, 'raffle', 'ticketCount', amt, gameStats);
					str += ' raffle tickets.';
					
					utils.chSend(message, str);
				}
			}
		},
		next: {
			do: function(message) {
				var when = new Date(cons.NEXT_RAFFLE);
				utils.chSend(message, 'Next raffle is scheduled for: ' + when + ' , but' +
				  ' this is subject to bugs, unexpected circumstances, and whimsy.');
			}
		},
		hype: {
			do: function(message) {
				var when = new Date(cons.NEXT_RAFFLE);
				utils.chSend(message, 'The next raffle is on ' + when + '! Are you ready?!\n' +
				  '(use !time to find out official server time)');
			}
		},
		drawing: {
			do: function(message, parms, gameStats, raf) {
				// raf is "this" from previous scope, which is global module context
				// OUR "this" refers to the "subCmd" object
				
				parms = parms.split(' ');
				if (parms[0] === '') {
					utils.chSend(message, ' Use: `!raffle drawing list` or `!raffle drawing run`');
					return;
				} else if (parms[0] !== 'list' && parms[0] !== 'run') {
					utils.chSend(message, ' Only `!raffle drawing list` and `run` work right now.');
					return;
				}

				var str = '';
				var str2 = '';
				var tNum = raf.startNum;
				var tix = [];
				var numTix = {};
				var numUsers = 0;
				var newTix = [];
				
				// go find all the tickets by iterating over gameStats
				for (let who in gameStats) {
					if (gameStats[who].hasOwnProperty('raffle')) {
						if (!gameStats[who].raffle.hasOwnProperty('ticketCount')) {
							utils.debugPrint('!raffle: ' + who + ' has .raffle but no .ticketCount');
						} else {
							var tCount = parseInt(gameStats[who].raffle.ticketCount);
							if (isNaN(tCount)) {
								utils.debugPrint('WARNING: ' + who + '.raffle.ticketCount was NaN: ' + tCount);
							} else if (tCount >= 1) {
								// only count users that have at least 1 ticket
								numUsers++;
								// push one new object onto tix[] for every ticket they have
								// user is this user, ticket is sequential from startNum
								// IOW, the tickets are "handed out in order" first
								numTix[who] = gameStats[who].raffle.ticketCount;
								for (let i = 0; i < numTix[who]; i++) {
									tix.push({"num": tNum, "user": who});
									tNum++;
								}
							}
						}
					}
				}
				
				str2 += ':tickets: :tickets: :tickets:   `RAFFLE TIME!`   :tickets: :tickets: :tickets:\n';
				str += ' I have ' + tix.length + ' tickets here in my digital bucket, numbered from `' +
				  raf.startNum + '` through `' + (raf.startNum + tix.length - 1);
				str += '`! They belong to ' + numUsers + ' users:\n```';
				

				str2 += '```\n';
				
				var column = 0;
				// for each user with tickets...
				for (let who in numTix) {
					
					// builds second message user sections
					str2 += '\n';
					var fixedLuser = '                    ';
					if (gameStats[who].hasOwnProperty('profile')) {
						// they have .profile...
						if (gameStats[who].profile.hasOwnProperty('nick')) {
							// they have .profile.nick, use it
							fixedLuser += gameStats[who].profile.nick;
							fixedLuser = fixedLuser.slice(-20);
							str2 += fixedLuser + ': ';
						}
					} else {
						fixedLuser += who;
						fixedLuser = fixedLuser.slice(-20);
						str2 += fixedLuser +': ';
					}
					
					// show user & number of tickets they have in parenthesis
					// use their stored nick if possible
					if (gameStats[who].hasOwnProperty('profile')) {
						// they have .profile...
						if (gameStats[who].profile.hasOwnProperty('nick')) {
							// they have .profile.nick, use it
							str += gameStats[who].profile.nick;
						} else {
							// profile but no .nick, just put an @ and their id (don't ping them)
							str += '@' + who;
						}
					} else {
						// no .profile, just put an @ and their id (don't ping them)
						str += '@' + who;
					}
					str += ' (x' + numTix[who] + ')\n'; // number of tickets in parens
					column++;
					//if (column % 3 === 0) {str += '\n'}

					// for each ticket belonging to them...
					for (let i = 0; i < numTix[who]; i++) {
						// pick 1 random ticket from those left in original array,
						// yank it out and put in ranTick. It's an object.
						// .slice() is destructive to the original array. good.
						let ranTick = tix.splice(Math.floor(Math.random() * tix.length), 1);
						ranTick = ranTick[0]; // .splice() gave us an array with 1 element
						
						// modify the "user" property to match the new owner
						ranTick.user = who;
						newTix.push(ranTick); // push it into new array
						str2 += ' [#' + ranTick.num + '] | ';
					}	
				} // end for each user w/tix
				
				// finally output the strings we built
				if (parms[0] === 'list') {
					str += '```';
					utils.chSend(message, str);
				} else if (parms[0] === 'run') {
					str2 += '```';
					utils.chSend(message, str2);
				}
				
			}
		}
	},
	do: function(message, parms, gameStats, bankroll) {
		
		parms = parms.split(' ');
		if (parms[0] === '') {
			utils.chSend(message, 'Please see `!help raffle` for help that isn\'t there.');
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
			utils.chSend(message, 'What are you trying to do to that raffle?!');
			return;
		}
	}
};