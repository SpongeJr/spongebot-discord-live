const cons = require('../lib/constants.js');
const utils = require('../lib/utils.js');

const emojis = {
	common: {
		tech: ':computer:,:iphone:,:keyboard:,:tv:,:mouse_three_button:,:video_game:',
		sports: ':baseball:,:football:,:tennis:,:soccer:,:ping_pong:',
		fruit: ':cherries:,:apple:,:green_apple:,:banana:,:melon:,:lemon:,:pear:,:strawberry:,:grapes:,:pineapple:',
		faces: ':open_mouth:,:thinking:,:laughing:,:sunglasses:'
	},
	uncommon: {},
	rare: {}
};
const prices = {
	common: 1000 ,
	uncommon: 10000,
	rare: 50000,
}

module.exports = {
	commands: {		
		buy: {
			subCmd: {
				common: {
					do: function(message, args, gameStats, bankroll) {
						let who = message.author;
						let theMess = '';
						
						if (!bankroll.hasOwnProperty(who.id)) {
							theMess += `${who.username}, you need a \`!bank\` account first.`;
						} else if (bankroll[who.id] < prices.common) {
							theMess += `${who.username}, you only have ${bankroll[who.id]} but` +
							  ` you need ${prices.common} to buy a common collectible.`;
						} else {
							let inv = utils.getStat(who.id, 'collectibles', 'inventory', gameStats);
							let commons = emojis.common;
							let group = utils.listPick(Object.keys(commons));
							let groupItems = emojis.common[group].split(',');
							let item = utils.listPick(groupItems);
	
							if (!inv) {	inv = []; }
							inv.push(item);
							
							utils.addBank(who.id, -prices.common, bankroll);
							theMess += `${who.username}, you've won: ${item} from "${group}"` 
							theMess += `, and you now have  ${inv.length} item(s). \n`;
							theMess += inv;
							
							utils.setStat(who.id, 'collectibles', 'inventory', inv, gameStats);
						}
						utils.chSend(message, theMess);
					}
				},
				rare: {
					do: function(message, args, gameStats, bankroll) {
						
					}
				},
				epic: {
					do: function(message, args, gameStats, bankroll) {
						
					}
				},
				prices: {
					do: function(message, args, gameStats, bankroll) {
						let who = message.author;
						let theMess = '';
						theMess += '```COLLECTIBLES PRICE LIST'
						for (let rarity in prices) {
							theMess += `\n${rarity}: ${prices[rarity]}`;
						}
						theMess += '```';
						
						utils.chSend(message, theMess);
					}
				}
			},
			do: function(message, args, gameStats, bankroll) {
				let author = message.author;
				
				
			},
			help: 'You can buy a collectible with `buy < common | uncommon | rare >`.' + 
			  ' This will cost credits! You can type `buy prices` for the prices.'
		},
		
		bank: {
			subCmd: {},
			cmdGroup: 'Fun and Games',
			do: function(message, args, gameStats, bankroll) {
				let author = message.author;
				let who;

				if (args[0] === '') {
					who = message.author.id;
					
					if (typeof bankroll[who] === 'undefined') {
						utils.chSend(message, author.username + ', I don\'t see an account ' +
						  'for you, so I\'ll open one with ' + cons.START_BANK + ' credits.');
						
						bankroll[who] = {};
						bankroll[who].credits = cons.START_BANK;
						utils.saveBanks(cons.BANK_FILENAME, bankroll);
						utils.debugPrint('New bankroll made for ' + who + ' via !bank.');
					}
					
				} else {
					who = utils.makeId(args[0]);
				}
				
				if (typeof bankroll[who] === 'undefined') {
					utils.chSend(message, author.username + ', they don\'t have a bank account.');
				} else if (isNaN(bankroll[who].credits)) {
					utils.chSend(message, author.username + ' that bank account looks weird, thanks' +
					  ' for pointing it out. I\'ll reset it to ' + cons.START_BANK);
					bankroll[who].credits = cons.START_BANK;
					utils.saveBanks(cons.BANK_FILENAME, bankroll);
					utils.debugPrint('Corrupted bankroll fixed for ' + who + ' via !bank.');
					  
				} else {
					utils.chSend(message, utils.idToNick(who, gameStats)+ ' has ' + bankroll[who].credits + ' credits.');
					utils.chSend(message, utils.idToNick(who, gameStats) +
					' has ' + (utils.getStat(who, 'raffle', 'ticketCount', gameStats) || 'no ') + ' :tickets: s.');
				}
			},
			help: '`!bank <user>` reveals how many credits <user> has. With no <user>, ' +
			  'will either show your own bank, or create a new account for you.'
		}
	}
};