const utils = require('../lib/utils.js');
const cons = require('../lib/constants.js');
var saved = require('../' + cons.OBJECTS_FILENAME);
//-----------------------------------------------------------------------------
var slots = {
	config: {
		symbols: {
			rare: {emo: ':open_mouth:', rarity: 1},
			peng: {emo: ':penguin:', rarity: 4},
			dolr: {emo: ':dollar:', rarity: 5},
			sevn: {emo: ':seven:', rarity: 6},
			mush: {emo: ':mushroom:', rarity: 9},
			cher: {emo: ':cherries:', rarity: 12},
			tato: {emo: ':tangerine:', rarity: 11},
		},
		payTable: [
			{payout: 3200, pattern: ['rare', 'rare', 'rare']},
			{payout: 160, pattern: ['rare', 'rare', 'any']},
			{payout: 128, pattern: ['peng', 'peng', 'peng']},
			{payout: 32, pattern: ['peng', 'peng', 'any']},
			{payout: 20, pattern: ['dolr', 'dolr', 'dolr']},
			{payout: 16, pattern: ['dolr', 'dolr', 'any']},
			{payout: 14, pattern: ['sevn', 'sevn', 'sevn']},
			{payout: 9, pattern: ['cher', 'cher', 'cher']},
			{payout: 4, pattern: ['cher', 'cher', 'any']},
			{payout: 3, pattern: ['mush', 'mush', 'mush']},
			{payout: 2, pattern: ['mush', 'mush', 'any']},
			{payout: 1.5, pattern: ['tato', 'tato', 'tato']},
			{payout: 1, pattern: ['mush', 'any', 'any']},
		],
		configName: "Sponge's Temporary Slots Promo: >107% payout!"
	}
};
//-----------------------------------------------------------------------------
module.exports = {
	buildArray: function() {
		// called to build slots array for first time !slots is run
		// then also called after changing a symbol
		slots.config.symArr = [];
		for (let sym in slots.config.symbols) {
			slots.config.symArr.push({
				sym: sym,
				emo: slots.config.symbols[sym].emo,
				rarity: slots.config.symbols[sym].rarity
			});
		}
	},
	subCmd: {
		audit: {
			do: function(message, parms) {
				let sData = saved.slots;
				let credsIn = sData.credsIn;
				let credsOut = sData.credsOut;
				let diff = Math.abs(credsIn - credsOut);
				let perc = diff / credsIn * 100;
				let outStr = 'IN: ' + credsIn + '\nOUT: ' + credsOut + '\nHOUSE: ';
				outStr += (credsIn > credsOut) ? 'GAIN of ' : 'LOSS of ';
				outStr += diff + ' (' + perc.toFixed(3) + '%)\n';
				outStr += 'NUMBER OF SPINS: ' + sData.spins;
				outStr += '\n\n Data collected since: ' + new Date(sData.dataStartDate);
				
				utils.chSend(message, '```Official Slot Machine Audit\n' + new Date() +
				  '\n' + outStr + '```');
			}
		},
		stats: {
			access: [],
			do: function(message, parms, gameStats) {
				let who = message.author.id;
				let credsIn = utils.getStat(who, 'slots', 'credsIn', gameStats) || 0;
				let credsOut = utils.getStat(who, 'slots', 'credsOut', gameStats) || 0;
				let spins = utils.getStat(who, 'slots', 'spins', gameStats) || 0;
				let ratio = ((credsOut / credsIn * 100) || 0).toFixed(2);
				let outStr = '**SLOTS STATS** for ' + message.author + '\n';
				outStr += '**Credits in**: ' + credsIn + '     **Credits won**: ' + credsOut;
				outStr += '\n Payout ratio: ' + ratio + '% ';
				outStr += '     # of spins: ' + spins + ' \n\n';
				outStr += '_Statistics since last reset. You may reset your own stats' +
				  ' with the `!slots reset` command if you wish._';
				utils.chSend(message, outStr);
			}
		},
		reset: {
			access: [],
			do: function(message, parms, gameStats) {
				let who = message.author.id;
				utils.setStat(who, 'slots', 'credsIn', 0, gameStats);
				utils.setStat(who, 'slots', 'credsOut', 0, gameStats);
				utils.setStat(who, 'slots', 'spins', 0, gameStats);
				utils.chSend(message, ' I\'ve reset your slots stats for you, ' + message.author);
			}
		},
		symbol: {
			access: [],
			do: function(message, parms, gameStats, bankroll, sl) {
				
				// temporary access check, will use slots.subCmd.symbol.access[] later
				if (!utils.hasAccess(message.author.id)) {
					utils.chSend(message, 'Please step away from those machines!');
					return;
				}
				parms = parms.split(' ');
				let oldSym = parms[0];
				let newSym = parms[1];
				if (!oldSym || !newSym) {
					utils.chSend(message, ' Try again.');
				} else {
					
					if (!slots.config.symbols.hasOwnProperty(oldSym)) {
						utils.chSend('That\'s not valid. Probably because the ' +
						' command doesn\'t yet do exactly what it is supposed to do.');
					} else {
						slots.config.symbols[oldSym].emo = newSym;
					}
					
					sl.buildArray();
					utils.debugPrint('.slots symbol: Rebuilt symbol array.');
					utils.chSend(message, ' I changed ' + oldSym + ' to ' + newSym +
					  ' on all the `!slots` machines for you.');
				}
			}
		},
		spin: {
			access: false,
			timedCmd: {
				howOften: 900,
				gracePeriod: 0,
				failResponse: '  :warning:  Please pull slots no faster than about ' +
				  ' once per second per user.  :warning:'
			},
			do: function(message, parms, gameStats, bankroll) {		
				var payTab = slots.config.payTable;
				var who = message.author.id;

				if (!utils.collectTimer(message, who, 'slots', this.timedCmd, gameStats)) {
					return;
				}

				if (!bankroll.hasOwnProperty(who)) {
					utils.chSend(message, message.author + ', please open a `!bank` account before playing slots.');
					return;
				}
				
				parms = parms.split(' ');
				
				var betAmt = parseInt(parms[0]) || 0;

				if (betAmt === 0) {
					utils.chSend(message, message.author + ', you can\'t play if you don\'t pay.');
					return;
				} else if (betAmt < 0) {
					utils.chSend(message, message.author + ' thinks they\'re clever making a negative bet.');
					return;
				} else if (betAmt > bankroll[who].credits) {
					utils.chSend(message, message.author + ', check your `!bank`. You don\'t have that much.');
					return;
				} else if (betAmt === bankroll[who].credits) {
					utils.chSend(message, message.author + ' just bet the farm on `!slots`!');
				}
				
				utils.addBank(who, -betAmt, bankroll);
				utils.alterStat(who, 'slots', 'credsIn', betAmt, gameStats, 'nosave'); // get it on the next one
				utils.alterStat(who, 'slots', 'spins', 1, gameStats);
				saved.slots.credsIn += betAmt;
				saved.slots.spins++;
				var spinArr = [];
				for (let reel = 0; reel < 3; reel++) {
					
					let bucket = [];
					let highest = 0;
					let buckNum = 0;					
					for (var sym in slots.config.symbols) {
						bucket[buckNum] = highest + slots.config.symbols[sym].rarity;
						buckNum++;
						highest += slots.config.symbols[sym].rarity;
					}
					
					let theSpin = Math.random() * highest;
					let foundBuck = false;
					let bNum = 0;
					while ((bNum < bucket.length) && (!foundBuck)) {
						if (theSpin < bucket[bNum]) {
							foundBuck = true;
						} else {bNum++;}
					}
					spinArr.push(slots.config.symArr[bNum].sym);
				}
				
				let spinString = '';
				for (let i = 0; i < 3; i++) {
					spinString += slots.config.symbols[spinArr[i]].emo;
				}
				spinString += ' (spun by ' + message.author + ')';
				
				for (let pNum = 0, won = false; ((pNum < payTab.length) && (!won)); pNum++) {
					
					let matched = true;
					let reel = 0;
					while (matched && reel < payTab[pNum].pattern.length) {
						if ((spinArr[reel] === payTab[pNum].pattern[reel]) ||
						  (payTab[pNum].pattern[reel] == 'any')) {
							
						} else {
							matched = false;
						}					
						
						if ((reel === payTab[pNum].pattern.length - 1) && (matched)) {
							// winner winner chicken dinner
							let winAmt = betAmt * payTab[pNum].payout;
							spinString += '\n :slot_machine: ' +
							  message.author + ' is a `!slots` winner!\n' + 
							  ' PAYING OUT: ' + payTab[pNum].payout + ':1' +
							  ' on a ' + betAmt + ' bet.   Payout =  ' + winAmt;
							utils.addBank(who, winAmt, bankroll);
							utils.alterStat(who, 'slots', 'credsOut', winAmt, gameStats);
							saved.slots.credsOut += winAmt;
							won = true;					
						}
						reel++;
					}
				}
				utils.saveObj(saved, cons.OBJECTS_FILENAME);
				utils.chSend(message, spinString);
			}
		},
		paytable: {
			access: false,
			do: function(message, parms) {
				let payTab = slots.config.payTable;
				let rarityTot = 0;
				let ptabString;
				for (var sym in slots.config.symbols) {
					rarityTot += slots.config.symbols[sym].rarity;
				}

				ptabString = '(Using config: ' + slots.config.configName + ')\n\n';
				ptabString += '!SLOTS PAYOUT TABLE\n`[PAYOUT]    | [PATTERN]   | [ODDS AGAINST]`\n';
				
				for (var i = 0; i < payTab.length; i++) {
					let lineChance = 1;	
					ptabString += '`' + payTab[i].payout + ' : 1';
					
					let tempstr = payTab[i].payout.toString() + ' : 1';
					let stlen = tempstr.length;
					for (let j = 0; j < 12 - stlen; j++) {
						ptabString += ' ';
					}
					ptabString += '|` ';
					
					for (let j = 0; j < payTab[i].pattern.length; j++) {
						if (payTab[i].pattern[j] === 'any') {
							ptabString += ':grey_question: ';
						} else {
							ptabString += slots.config.symbols[payTab[i].pattern[j]].emo;
							ptabString += ' ';
							lineChance = lineChance * (slots.config.symbols[payTab[i].pattern[j]].rarity / rarityTot);					
						}
					}
					lineChance = 1 / lineChance;
					ptabString += '      (' + lineChance.toFixed(1) + ' : 1)';
					ptabString += '\n';
				}
				utils.chSend(message, ptabString);
			}
		}
	},
	do: function(message, parms, gameStats, bankroll) {
		if (!slots.config.symArr) {
			// must be first time around, we need to build the symbol array
			this.buildArray();
			utils.debugPrint('.slots: First run, built symbol array.');
		}
		
		// --- default command handler ---
		parms = parms.split(' ');
		if (parms[0] === '') {
			utils.chSend(message, 'Try `!slots spin <bet>` or `!slots paytable`.');
			return;
		}
		var sub = parms[0].toLowerCase(); // sub is the possible subcommand

		
		if (this.subCmd.hasOwnProperty(sub)) {
			parms.shift(); // lop off the command that got us here
			parms = parms.join(' ');
			//utils.debugPrint('>> calling subcommand .' + sub + '.do(' + parms + ')');
			this.subCmd[sub].do(message, parms, gameStats, bankroll, this);
			return;
		} else {
			utils.chSend(message, 'What are you trying to do to that slot machine?!');
			return;
		}
		// --- end default command handler ---
	},
	help: '`!slots`: give the slot machine a spin!'
};