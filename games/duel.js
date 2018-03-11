var duelManager = {
	challengerID: {
		opponentID: 'opponentID',	//the ID of the @opponent whom the @challenger wants to duel
		status:	'idle|challenging|ready|dueling',
		/* status
		 * idle:		@challenger is not dueling and not challenging anyone to a duel
		 * challenging:	@challenger has challenged @opponent to a duel and is waiting for reciprocation
		 * ready:		@challenger and @opponent are ready and waiting for the duel to start
		 * dueling: 	@challenger and 
		 */
		duelTimer: {},				//shared by both @challenger and @opponent
		targetNumber: 0,			//Random number between 0 and 1000. @challenger's hit chance depends on the difference between their input and this number
		kills: 0,
		deaths: 0
	}
};
spongeBot.duel = {
		cmdGroup: 'Fun and Games',
		do: function(message, args) {
			/*
			 * args
			 * 0	challenge	info
			 * 1	opponent	subject
			 */
			var challenger = message.author.id;
			//If the challenger isn't in the duelManager record, we initialize them
			if(!duelManager[challenger]) {
				duelManager[challenger] = {
					status: 'idle',
					kills: 0,
					deaths: 0
				};
			}
			if (!args) {
				utils.chSend(message, 'Who are you trying to duel, ' + utils.makeTag(challenger) + '? (`!help duel` for help)');
				return;
			}
			
			args = args.split(' ');
			
			if(!args[0]) {
				utils.chSend(message, utils.makeTag(challenger) + ', use `!help duel`');
				return;
			}
			var action = args[0];
			
			if(action === 'info') {
				var subject = challenger;
				if(args[1]) {
					subject = utils.makeId(args[1]);
				}
				//Quit if the subject isn't in the bank record
				if(!bankroll[subject]) {
					utils.chSend(message, utils.makeTag(challenger) + ', is that one of your imaginary friends?');
					return;
				}
				//If subject isn't in the duelManager record, we initialize them
				if(!duelManager[subject]) {
					duelManager[subject] = {
						status: 'idle',
						kills: 0,
						deaths: 0
					};
				}
				var subjectEntry = duelManager[subject];
				var status = subjectEntry.status;
				var reply = '`!duel` info about ' + utils.makeTag(subject);
				if(status === 'idle') {
					reply += '\nStatus: Idle';
				} else if(status === 'challenging') {
					reply += '\nStatus: Waiting to duel ' + utils.makeTag(subjectEntry.opponentID) + ' with a bet of ' + subjectEntry.bet + ' credits';
				} else {
					reply += '\nStatus: Currently dueling ' + utils.makeTag(subjectEntry.opponentID + ' with a bet of ' + subjectEntry.bet + ' credits');
				}
				
				for(var user in duelManager) {
					var userEntry = duelManager[user];
					if(userEntry.status === 'challenging' && userEntry.opponentID === subject) {
						reply += '\nPending challenge from ' + utils.makeTag(user) + 'with a bet of ' + userEntry.bet + ' credits.'; 
					}
				}
				reply += '\nKills: ' + subjectEntry.kills;
				reply += '\nDeaths: ' + subjectEntry.deaths;
				reply += '\nKill/Death Ratio: ' + (subjectEntry.kills/subjectEntry.deaths);
				utils.chSend(message, reply);
			} else if(action === 'challenge') {
				if (!args[1]) {
					utils.chSend(message, utils.makeTag(challenger) + ', you can\'t duel nobody. (`!help duel` for help)' );
					return;
				}
				var opponent = utils.makeId(args[1]);
				
				//If the opponent isn't in the bank record, we assume they don't exist
				if(!(bankroll[opponent] >= 0)) {
					utils.chSend(message, utils.makeTag(challenger) + ', is that one of your imaginary friends?' );
					return;
				}
				var challengerEntry = duelManager[challenger];
				var bet = parseInt(args[2]);
				//Check for NaN
				if(isNaN(bet)) {
					bet = 0;
				}
				if(bet < 0) {
					utils.chSend(message, utils.makeTag(challenger) + ', if you\'re looking for a loan, please look somewhere else.');
					return;
				} else if(bet > 0) {
					if(bankroll[challenger] < bet) {
						utils.chSend(message, utils.makeTag(challenger) + ', you can\'t bet what you don\'t have!');
						return;
					}
					//If everything's good, then we prepare the bets later
				}
				
				//If opponent isn't in the duelManager record, we initialize them
				if(!duelManager[opponent]) {
					duelManager[opponent] = {
						status: 'idle',
						kills: 0,
						deaths: 0
					};
				}
				//If the challenger is already dueling someone, then they can't challenge anyone else until they are done dueling.
				if(challengerEntry.status === 'ready' || challengerEntry.status === 'dueling') {
					utils.chSend(message, utils.makeTag(challenger) + ' you are already dueling somebody! There\'s no backing out now!');
					return;
				} else if(challengerEntry.status === 'challenging' && challengerEntry.opponentID === opponent) {
					//If @challenger already challenged the opponent, then this means they are canceling the challenge
					utils.chSend(message, utils.makeTag(challenger) + ' has backed out of their challenge against ' + utils.makeTag(opponent) + ' because they are too chicken!');
					challengerEntry.status = 'idle';
					//Return bet
					if(challengerEntry.bet > 0) {
						utils.chSend(message, utils.makeTag(challenger) + ', your previous bet of ' + challengerEntry.bet + ' credits was returned.');
						utils.addBank(challenger, challengerEntry.bet, bankroll);
					}
					
					delete challengerEntry.opponentID;
					delete challengerEntry.bet;
					return;
				} else if(challengerEntry.status === 'challenging' && challengerEntry.opponentID !== opponent) {
					//If @challenger has already challenged someone else, then they cancel their previous challenge
					utils.chSend(message, utils.makeTag(challenger) + ' has lost interest in dueling ' + utils.makeTag(challengerEntry.opponentID) + ' and has challenged ' + utils.makeTag(opponent) + ' instead' + ((bet > 0) ? (' with a bet of ' + bet + ' credits!') : '!'));
					challengerEntry.opponentID = opponent;
					//Return bet
					if(challengerEntry.bet > 0) {
						utils.chSend(message, utils.makeTag(challenger) + ', your previous bet of ' + challengerEntry.bet + ' credits was returned.');
						utils.addBank(challenger, challengerEntry.bet, bankroll);
					}
					
					
					//Update the bet
					utils.addBank(challenger, -bet, bankroll);
					challengerEntry.bet = bet;
				}
				//We allow the player to challenge people who are busy dueling
				
				challengerEntry.opponentID = opponent;
				challengerEntry.status = 'challenging';
				
				var opponentEntry = duelManager[opponent];
				//If @opponent previously sent @challenger a request, then the challenge is accepted
				if(opponentEntry.status === 'challenging' && opponentEntry.opponentID === challenger) {
					challengerEntry.status = 'ready';
					opponentEntry.status = 'ready';
					utils.chSend(message, utils.makeTag(challenger) + ' to ' + utils.makeTag(opponent) + ': *Challenge accepted!*');
					utils.chSend(message, utils.makeTag(challenger) + ': Get ready!');
					utils.chSend(message, utils.makeTag(opponent) + ': Get ready!');
					utils.chSend(message, 'You will be assigned a random unknown \'target\' number between 0 and 1000. When I say \"Draw!\", enter numbers with `!d <number>` to fire at your opponent! The closer your input is to the target, the more likely you will hit your opponent!');
					//Start the duel!
					var duelTimer = setTimeout(function() {
						utils.chSend(message, utils.makeTag(challenger) + ', ' + utils.makeTag(opponent) + ': **Draw!**');
						
						challengerEntry.status = 'dueling';
						opponentEntry.status = 'dueling';
						
						challengerEntry.targetNumber = Math.random() * 1000;
						opponentEntry.targetNumber = Math.random() * 1000;
					}, (10 * 1000) + Math.random() * 20 * 1000);
					challengerEntry.duelTimer = duelTimer;
					opponentEntry.duelTimer = duelTimer;
					
					var stalemateTimer = setTimeout(function() {
						//If nobody wins, we don't pay out any bets
						utils.chSend(message, 'The duel between ' + utils.makeTag(challenger) + ' and ' + utils.makeTag(opponent) + ' has ended in a stalemate! All bets have been claimed by me.');
						//addBank(challenger, challengerEntry.bet);
						//addBank(opponent, opponentEntry.bet);
						delete challengerEntry.bet;
						delete opponentEntry.bet;
						delete challengerEntry.stalemateTimer;
						delete opponentEntry.stalemateTimer;
					}, 300 * 1000);
					challengerEntry.stalemateTimer = stalemateTimer;
					opponentEntry.stalemateTimer = stalemateTimer;
				} else {
					//Update the bet
					utils.addBank(challenger, -bet, bankroll);
					challengerEntry.bet = bet;
					
					//Opponent is either idle, ready, or dueling at this point
					//We wait for the opponent to reciprocate @challenger's request
					utils.chSend(message, utils.makeTag(challenger) + ' has challenged ' + utils.makeTag(opponent) + ' to a duel' + ((bet > 0) ? (' with a bet of ' + bet + ' credits!') : '!'));
					utils.chSend(message, utils.makeTag(opponent) + ', if you accept this challenge, then return the favor!');
					if(opponentEntry.status === 'ready' || opponentEntry.status === 'dueling') {
						utils.chSend(message, utils.makeTag(challenger) + ', ' + utils.makeTag(opponent) + ' is busy dueling ' + utils.makeTag(opponentEntry.opponentID) + 'so they may not respond right away');
					}
				}
			} else {
				utils.chSend(message, utils.makeTag(challenger) + ', use `!help duel`');
			}
		},
		help: '`!duel challenge <user>`: Challenge another user to a duel.\n' +
		  '`!duel info <user>`: Shows duel info about user.',
		longHelp: '`!duel challenge <user>`: Challenge another user to a duel. To play, the other user must challenge you back.' +
		  '`!duel info <user>`: Shows duel info about user.'
	};
spongeBot.d = {
		cmdGroup: 'Fun and Games',
		do: function(message, args) {
			if (args === '') {
				utils.chSend(message, 'Usage: `!d <number>` attempts to fire at your opponent. Chance to hit depends on difference between your input and your target number.');
			} else {
				var author = message.author.id;
				var entry = duelManager[author];
				if(!entry) {
					utils.chSend(message, utils.makeTag(author) + ', who are you and what are you doing here with that gun?');
				} else if(entry.status === 'dueling') {
					args = parseInt(args);
					if ((args >= 0) && (args <= 1000)) {
                        //var difference = (args - entry.targetNumber);
                        //difference = Math.min(Math.abs(difference), Math.abs(difference + 1000), Math.abs(difference - 1000));
						var difference = Math.abs(args - entry.targetNumber);
                        var chance = 100 - Math.pow(difference/50, 2) * 5;
						/* Difference	Chance
						 * 50			95
						 * 100			80
						 * 150			55
						 * 200			20
						 * 250			0
						 */
						if(Math.random()*100 < chance) {
							utils.chSend(message, utils.makeTag(author) + ' fires at ' + utils.makeTag(entry.opponentID) + ' and hits!');
							utils.chSend(message, utils.makeTag(entry.opponentID) + ' has lost the duel with ' + utils.makeTag(author) + '!');
							
							var reward = entry.bet;
							if(reward > 0) {
								utils.chSend(message, utils.makeTag(author) + ' has won back the bet of ' + reward + ' credits.');
								utils.addBank(author, reward, bankroll);
							}
							
							var opponent = entry.opponentID;
							var opponentEntry = duelManager[opponent];
							
							//Prevent credit duplication here
							if(author !== opponent) {
								reward = opponentEntry.bet;
								if(reward > 0) {
									utils.chSend(message, utils.makeTag(author) + ' has won ' + utils.makeTag(opponent) + '\'s bet of ' + reward + ' credits.');
									utils.addBank(author, reward, bankroll);
								}
								
								//We also take up to our bet amount in credits from the opponent
								reward = Math.min(entry.bet, bankroll[opponent]);
								if(reward > 0) {
									utils.chSend(message, utils.makeTag(author) + ' has also won ' + reward + ' credits from ' + utils.makeTag(opponent) + '!');
									utils.addBank(author, reward, bankroll);
									utils.addBank(opponent, -reward, bankroll);
								}
							}
							
							
							
							entry.status = 'idle';
							opponentEntry.status = 'idle';
							
							delete entry.opponentID;
							delete opponentEntry.opponentID;
							delete entry.bet;
							delete opponentEntry.bet;
							
							//clear out stalemate timer
							clearTimeout(entry.stalemateTimer);
							clearTimeout(opponentEntry.stalemateTimer);
							
							delete entry.stalemateTimer;
							delete opponentEntry.stalemateTimer;
							
							entry.kills++;
							opponentEntry.deaths++;
						} else {
							utils.chSend(message, utils.makeTag(author) + ' fires at ' + utils.makeTag(entry.opponentID) + ' and misses!');
							if(difference < 50) {
                                utils.chSend(message, utils.makeTag(author) + ', you were so close!');
                            } else if(difference < 100) {
                                utils.chSend(message, utils.makeTag(author) + ', your shot just barely missed!');
                            } else if(difference < 150) {
                                utils.chSend(message, utils.makeTag(author) + ', your aim is getting closer!');
                            } else if(difference < 200) {
                                utils.chSend(message, utils.makeTag(author) + ', your aim could be better!');
                            } else if(difference < 250) {
                                utils.chSend(message, utils.makeTag(author) + ', try aiming at your opponent!');
                            } else {
                                utils.chSend(message, utils.makeTag(author) + ', you\'re aiming in the wrong direction!');
                            }
						}
					} else {
						utils.chSend(message, '<number> must be between 0 and 1000.');
					}
				}
				else if(entry.status === 'ready') {
					utils.chSend(message, utils.makeTag(author) + ', *no cheating!*');
				} else if(entry.status === 'challenging') {
					utils.chSend(message, utils.makeTag(author) + ', sorry, but shooting at your opponent before they even accept your challenge is just plain murder.');
				} else {
					utils.chSend(message, utils.makeTag(author) + ', sorry, but gratuitous violence is not allowed.');
				}
			}
		},
		help: '`!d <number>`: Fire at your duel opponent.',
		longHelp: '`!d <number>`: TO DO: Help Text'
};