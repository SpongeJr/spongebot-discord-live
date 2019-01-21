/* Copyright 2018 Josh Kline ("SpongeJr"), 
Loot box and Duel code Copyright 2018 by 0xABCDEF/Archcannon
Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files
(the "Software"), to deal in the Software without restriction,
including without limitation the rights to use, copy, modify, merge,
publish, distribute, sublicense, and/or sell copies of the Software,
and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:
The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
IN THE SOFTWARE.
*/
const Discord = require('discord.js');
const CONFIG = require('../config.json');
const MYPALS = require('../mypals.json');
const BOT = new Discord.Client();
const SPONGEBOT_ID = 402122635552751616;

var debugPrint =function(inpString){
// console.log optional replacement
// does not output when debugMode global is false
	if (utils.debugMode) {
		console.log(inpString);
		if (utils.enableDebugChan) {
			if ((inpString !== '') && (typeof inpString === 'string')) {
				// todo: rate limiter?
				if (inpString.length < 1024) {
					BOT.channels.get(cons.DEBUGCHAN_ID).send(inpString);
				}
			}
		}
	}
};
//-----------------------------------------------------------------------------
var spongeBot = {};
//-----------------------------------------------------------------------------
//  MODULES
//-----------------------------------------------------------------------------
const cons = require('./lib/constants.js');
const MODLIST = require('./modules.json');
const MODULES = {
	"speech": require(MODLIST.speech)
};
const mods = {
	nq: require(MODLIST.enqueue)
};

var nq = mods.nq;
const timey = require('./lib/timey.js');
var utils = require('./lib/utils.js');
//var iFic = require('./games/ific.js');
var acro = require('./games/acro.js');
var scram = require('./games/scram.js');
var slots = require('./games/slots.js');
var tree = require('./games/loottree.js');
var raffle = require('./games/raffle');
var quotes = require('./games/quotes.js');
var adspam = require('./lib/adspam.js');
var memory = require('./games/memory.js');
var cattle = require('./games/cattle.js');

var botStorage = {};
var bankroll = {};
var gameStats = require('../data/gamestats.json');
var otherStats = {};
var bankroll = require('../data/banks.json');
if (utils.debugMode) {console.log(bankroll);}
//-----------------------------------------------------------------------------
var sammichMaker = function() {

	var ingredients = "banana,honey mustard,marmalade,flax seed,roast beef,potato chip,chocolate sauce,ketchup,relish,alfalfa,M&Ms,skittles,skittles (Tropical flavor),marshmallow,potato salad,egg salad,turnip,mango,spinach,kale,crushed doritos,pulled pork,porcupine,mango,artichoke,apple slice,pineapple,cabbage,rambutan,papaya,durian,bologna,kielbasa,peanut butter,canned fruit,vanilla bean,coffee bean,harvard beet,avocado,bacon,mashed potatoes,frozen peas,anchovy,lettuce,mushroom,guava,tomato,oatmeal,eggplant";
	ingredients = ingredients.split(",");
	var toppings = "bing cherries,whipped cream,chocolate syrup,mayonnaise,oregano,paprika,butter,cooking spray,marshmallow creme,green smoothie,salt and pepper,sea salt,MSG,melted cheese,pine needles,cough syrup,gravy,salsa,sauerkraut,sprinkles,turbinado sugar,maple syrup,apple butter,guacamole,Peet's coffee,applesauce,bacon bits,olive oil,shaved ice,powdered milk,molasses,tomato sauce,barbecue sauce,horseradish";
	toppings = toppings.split(",");
	var sammich = "";
	var numIngredients = Math.random() * 3 + 1;

	for (var i = 0; i < numIngredients - 1; i++) {
		sammich = sammich + utils.listPick(ingredients) + ", ";
	}

	sammich += "and " + utils.listPick(ingredients);

	if (Math.random() < 0.65) {
		sammich += " sandwich ";
	} else {
		sammich += " smoothie ";
	}

	sammich += "topped with " + utils.listPick(toppings);

	return sammich;
};
//-----------------------------------------------------------------------------
var hasAccess = function(who, accessArr) {
	return (who === cons.SPONGE_ID || who === cons.ARCH_ID);
};
//-----------------------------------------------------------------------------
var msToTime = function(inp) {
	var sec = Math.floor(inp / 1000);
	var min = Math.floor(inp / (1000 * 60));
	var hr = Math.floor(inp / (1000 * 3600));
	var day = Math.floor(inp / (1000 * 3600 * 24));

	if (sec < 60) {
		return sec + ' sec ';
	} else if (min < 60) {
		return min + ' min ' + sec % 60 + ' sec ';
	} else if (hr < 24) {
		return hr + ' hr ' + min % 60 + ' min ' + sec % 60 + ' sec ';
    } else {
		return day + ' days ' + hr % 24 + ' hr ' + min % 60 + ' min ' + sec % 60 + ' sec ';
    }
};
//-----------------------------------------------------------------------------
spongeBot.blank = {
	do: function(message) {
		message.react('410754653249339403');
	}
};
//-----------------------------------------------------------------------------
spongeBot.debug = {
	do: function(message) {
		utils.enableDebugChan = !utils.enableDebugChan;
		utils.chSend(message, 'debugging to channel is: ' + utils.enableDebugChan);
	},
	help: 'Toggles debugging to #debug-print on Planet Insomnia.'
};
spongeBot.embeds = {
	do: function(message) {
		utils.autoEmbed = !utils.autoEmbed;
		utils.chSend(message, 'automatic embeds to channel is: ' + utils.autoEmbed);
	},
	help: 'Toggles automatic embeds'
};
spongeBot.backup = {
	cmdGroup: 'Admin',
	disabled: false,
	accessRestrictions: [],
	do: function(message) {
		var now = new Date();
		var t = timey.timeStr(['raw'], now);
		utils.saveBanks(cons.BANK_BACKUP_FILENAME + t + '.bak', bankroll);
		utils.saveStats(cons.STATS_BACKUP_FILENAME + t + '.bak', gameStats);
		utils.chSend(message, 'I ran the backups. Probably.');
		debugPrint('!backup:  MANUALLY BACKED UP TO: ' + cons.BANK_BACKUP_FILENAME + 
		  t + '.bak and ' + cons.STATS_BACKUP_FILENAME + t + '.bak');
	}
};
//-----------------------------------------------------------------------------
spongeBot.quote = {
	help: 'Add something a user said to the quotes database, hear a random quote, and more!',
	longHelp: 'React with ' + cons.QUOTE_SAVE_EMO + ' to a message to add it the quotes databse!' +
	  ' Or, type `!quote random <user>` to see a random quote from a user.',
	do: function(message, parms) {		
		quotes.q.do(message, parms, BOT, gameStats);
	}
};


// ---- HEY this is where I once left off with new patterns
/*
var	Command = function(trigger, config) {
	let moduleName = config.moduleName || trigger;
	let defaults = {
		disabled: false,
		help: modules[moduleName].commands[trigger].help,
		longHelp: modules[moduleName].commands[trigger].longHelp,
		do: function(message, parms) {
			modules[moduleName].commands[trigger].do(message, parms);
		},
		accessRestrictions: false
	};
	let theCommand = defaults;
		
	for (let prop in config) {
		theCommand[prop] = config.prop;
	}	
	return theCommand;
};
*/

var Command = utils.Command;

/*
spongeBot.speak = new Command(
	"speak",
	{
		moduleName: "speech",
		disabled: true
	},
	MODULES
);
*/


/*
const StoryCommand = function(name) {
	this.disabled = true,
	this.do = function(message, parms) {
		iFic[name].do(message, parms);
	}
};
var zCommands = 'z,zclear,zundo,zsave,zchars,zload,zshow'.split(',');

for (let i = 0; i < zCommands.length; i++) {
	spongeBot[zCommands[i]] = new StoryCommand(zCommands[i]);
}
*/


spongeBot.q = {
	help: nq.commands.q.help,
	longHelp: nq.commands.q.longHelp,
	disabled: false,
	accessRestrictions: false,
	cmdGroup: nq.commands.q.cmdGroup,
	do: function(message, parms) {
		nq.commands.q.do(message, parms, gameStats);
	}
};
//-----------------------------------------------------------------------------
spongeBot.collect = {
	help: 'Collects from your weekly loot bag! What will you find?',
	do: function(message, parms) {
		tree.collectbag.do(message, parms, gameStats, bankroll);
	}
};
spongeBot.tree = {
	help: tree.help,
	longHelp: tree.longHelp,
	disabled: false,
	accessRestrictions: false,
	cmdGroup: tree.cmdGroup,
	do: function(message, parms) {
		tree.do(message, parms, gameStats, bankroll);
	}
};
spongeBot.loot = {
	disabled: true,
	accessRestrictions: false,
	timedCmd: {
		howOften: cons.ONE_HOUR,
		gracePeriod: 60000,
		failResponse: '`!loot` boxes take about an hour to recharge. ' +
		' You still have about <<next>> to wait. :watch:'
	},
	cmdGroup: 'Fun and Games',
	help: '`!loot`: Buy a loot box and see what\'s inside!',
	longHelp: 'Try `!loot unbox <name>`, `!loot boxes`, `loot box <name>`, etc.'
};
//-----------------------------------------------------------------------------
spongeBot.pickfrom = {
	cmdGroup: 'Fun and Games',
	help: 'Pick a random item from a list.',
	longHelp: 'Use `!pickfrom` <item1> [item2] [item3] [...] to pick a random item from your list '+
	  'using a pRNG. Items must be separated by spaces.',
	do: function(message, parms) {
		if (!parms) {
			utils.chSend(message, 'You need a list to `pickfrom`. Use `!help pickfrom` for more info.');
			return;
		}
		
		parms = parms.split(' ');
		if (parms.length < 2) {
			utils.chSend(message, 'You need at least two items on a list to `pickfrom`, separated' +
			  ' by spaces. Use `!help pickfrom` for more info.');
			return;
		}
		
		if (parms.length > 255) {
			utils.chSend(message, 'Maximum `!pickfrom` choices is 255 for arbitrary reasons. I suggest' +
			  ' using an alternate method for making your decision, or whatever you\'re trying to do.');
			return;
		}
		
		utils.chSend(message, message.author + ', my selection from your list of ' + parms.length +
		  ' choices is: ' + utils.listPick(parms));
	}
};
spongeBot.roll = {
	cmdGroup: 'Fun and Games',
	do: function (message, parms){
		
		if (!parms) {
			utils.chSend(message, 'See `!help roll` for help.');
			return;
		}
		
		parms = parms.split('d');
		var x = parms[0];
		var y = parms[1];
		
		if (x && y) {
			x = parseInt(x);
			y = parseInt(y);
			
			if (x > 20) {
				utils.chSend(message, '`!roll`: No more than 20 dice please.');
				return;
			}
			
			if (x < 1) {
				utils.chSend(message, '`!roll`: Must roll at least one die.');
				return;
			}
			
			if (y < 2) {
				utils.chSend(message, '`!roll`: Dice must have at least 2 sides.');
				return;
			}
			
			if (y > 10000) {
				utils.chSend(message, '`!roll`: Max sides allowed is 10000.');
				return;
			}
			
			var str = ':game_die: Rolling ' + x + 'd' + y + ' for ';
			str += message.author + ':\n`';
			
			var total = 0;
			//var dice = [];
			var roll;
			
			for (var i = 0; i < x; i++) {
				roll = Math.floor(Math.random() * y) + 1;
				//dice[i] = roll;
				str += '[ ' + roll + ' ]  ';
				total += roll;
			}
			str += '`\n' + x + 'd' + y + ' TOTAL: ' + total;
			utils.chSend(message, str);
		} else {
			utils.chSend(message, 'Use `!roll `X`d`Y to roll X Y-sided dice.');
		}
	},
	help: '`!roll <x>d<y>` rolls a `y`-sided die `x` times and gives results.',
	longHelp: '`!roll <x>d<y>` rolls a `y`-sided die `x` times and gives results.' +
	'\n You can roll up to 20 dice with up to 10000 virtual "sides" each.' +
	  '\n EXAMPLE: `!roll 3d6` would roll 3 "fair" six-sided dice, display the\n' +
	  ' individual die rolls, and show the total (which would be between 3 and 18\n' +
	  ' inclusive in this example.)',
	disabled: false
};
//-----------------------------------------------------------------------------
spongeBot.rot13 = {
	cmdGroup: 'Miscellaneous',
	do: function (message, inp){
		
		var outp;
		
		// ROT-13 by Ben Alpert
		// See: http://stackoverflow.com/questions/617647/where-is-my-one-line-implementation-of-rot13-in-javascript-going-wrong
		outp = inp.replace(/[a-zA-Z]/g,function(c){
			return String.fromCharCode((c<="Z"?90:122)>=(c=c.charCodeAt(0)+13)?c:c-26);});
			
		if (outp === '') {
			utils.chSend(message, message.author + ' nothing to ROT-13!');
			return false;
		}
		utils.chSend(message, message.author + ': `' + outp + '`');
    },
	help: '`!rot13 <message>` spits back the ROT-13 ciphertext of your message.',
	longHelp: '	You could use this in DM and then use the result in public chat if you were giving spoilers or something I guess.',
	disabled: false
};
//-----------------------------------------------------------------------------
spongeBot.enable = {
	do: function(message, parms) {
		if (!spongeBot[parms]) {
			utils.chSend(message, 'Can\'t find command ' + parms + '!');
			return;
		}
		if (parms === 'enable') {
			utils.chSend(message, ':yodawg:');
		}
		spongeBot[parms].disabled = false;
		utils.chSend(message, parms + '.disabled: ' +
		  spongeBot[parms].disabled);
	},
	help: 'Enables a bot command. Restricted access.',
	accessRestrictions: true
};
spongeBot.disable = {
	do: function(message, parms) {
		if (!spongeBot[parms]) {
			utils.chSend(message, 'Can\'t find command ' + parms + '!');
			return;
		}
		if (parms === 'disable') {
			utils.chSend(message, ':yodawg:');
		} else if (parms === 'enable') {
			utils.chSend(message, 'Don\'t disable enable. Just don\'t.');
			return;
		}
		spongeBot[parms].disabled = true;
		utils.chSend(message, parms + '.disabled: ' +
		  spongeBot[parms].disabled);
	},
	help: 'Disables a bot command. Restricted access.',
	accessRestrictions: true
};
spongeBot.restrict = {
	accessRestrictions: true,
	cmdGroup: 'Admin',
	do: function(message, parms) {
		if (!spongeBot[parms]) {
			utils.chSend(message, 'Can\'t find command ' + parms + '!');
			return;
		}
		if (parms === 'restrict') {
			utils.chSend(message, ':yodawg: you can\'t !restrict .restrict');
			return;
		}
		
		if (spongeBot[parms].hasOwnProperty('accessRestrictions')) {
			spongeBot[parms].accessRestrictions = !spongeBot[parms].accessRestrictions;
		} else {
			spongeBot[parms].accessRestrictions = false;
		}
		utils.chSend(message, '`!' + parms + '` is restricted access:  ' +
		  spongeBot[parms].accessRestrictions);
	},
	help: ':warning: Toggles whether commands require special access.'
	
};
//-----------------------------------------------------------------------------
spongeBot.server = {
	cmdGroup: 'Miscellaneous',
	do: function(message) {
		var server = message.guild;
		
		if (!server) {
			utils.auSend(message, ' Doesn\'t look like you sent me that message on _any_ server!');
			return;
		}
		
		var str = ' You are on ' + server.name + ', which has the id: ' + 
		  server.id + '. It was created on: ' + server.createdAt + '.';
		
		utils.chSend(message, str);
	},
	help: 'Gives info about the server on which you send me the command.'
};
//-----------------------------------------------------------------------------
spongeBot.showCode = {
	do: function(message, parms) {
		var theCode = spongeBot[parms];
		
		utils.chSend(message, theCode);
		debugPrint(theCode);
	},
	help: 'shows code.',
	disabled: true
};
//-----------------------------------------------------------------------------
spongeBot.sammich = {
	timedCmd: {
		howOften: 1000 * 60 * 3, 
		gracePeriod: 10000,
		failResponse: 'Hey! You can only have a <<cmd>> every <<howOften>> ! ' +
		' And that\'s not for like, <<next>> yet, which would be at <<nextDate>>. ' +
		' You last had me make you a `!sammich` at <<lastDate>>, which was <<last>> ago.'
	},
	cmdGroup: 'Fun and Games',
	do: function(message) {
		if (!utils.collectTimer(message, message.author.id, 'sammich', spongeBot.sammich.timedCmd, gameStats)) {
			return false; // can't use it yet!
		}
		utils.chSend(message, 'How about having a ' + sammichMaker() + ' for a snack?   :yum:');
	},
	help: '`!sammich` whips you up a tasty random sandwich (65% chance) or smoothie (35% chance)'
};
//-----------------------------------------------------------------------------
spongeBot.s = {
	cmdGroup: 'Fun and Games',
	do: function(message, parms) {
		scram.s.do(message, parms, gameStats, bankroll);
	},
	help: 'Use `!s <word>` to submit a guess in the `!scram` ' +
	  'word scramble game.',
	disabled: false
};
spongeBot.scram = {
	subCmd: {},
	do: function(message, parms) {
		scram.do(message, parms, gameStats, bankroll);
	},
    help: '`!scram` starts the scramble game or checks to see if it\'s ready',
	cmdGroup: 'Fun and Games',
	disabled: false
};
//-----------------------------------------------------------------------------
spongeBot.raffle = {
	cmdGroup: 'Giveaways and Raffle',
	do: function(message, parms) {
		raffle.do(message, parms, gameStats, bankroll);
	},
	help: 'Commands for working with raffles'
};
spongeBot.ticket = {
	do: function(message, parms) {
		raffle.subCmd.ticket.do(message, parms, gameStats);
	},
	accessRestrictions: true,
	disabled: false,
	help: '`!ticket <who> <#>` Gives <#> tickets to <who>. With no #, gives one.'
};
spongeBot.giveaways = {
	cmdGroup: 'Giveaways and Raffle',
	do: function(message, parms) {
		raffle.giveaways.do(message, parms, gameStats);
	},
	help: '`!giveaways` lists any currently running contests, giveaways, freebies, and other fun stuff.' +
	  '\n`!giveaways list` shows all the current choices for raffle prizes.' +
	  '\n`!giveaways list <category>` lets you see all items on `!giveaways list` of a certain category.' +
	  '\n`!giveaways categories` lets you see the categories on `!giveaways list.`' +
  	  '\n`!giveaways addrole` gives you the "giveaways" role which means you will get pinged (at any time of day) ' +
	  'when there\'s something interesting going on related to giveaways.'
};
//-----------------------------------------------------------------------------
spongeBot.give = {
	cmdGroup: 'Fun and Games',
	do: function(message, parms) {
		
		var giver = message.author.id;
		
		if (!parms) {
			utils.chSend(message, 'Who are you trying to `!give` credits ' +
			  ' to, ' + utils.makeTag(giver) + '? (`!help give` for help)');
			return;
		}
			
		parms = parms.split(' ');
			
		if (!parms[1]) {
			utils.chSend(message, 'No amount specified to `!give`, ' + 
			  utils.makeTag(giver) + '. (`!help give` for help)' );
			return;
		}
			
		var who = utils.makeId(parms[0]);
		var amt = parseInt(parms[1]);

		if (isNaN(amt)) {
			utils.chSend(message, utils.makeTag(giver) + ', that\'s not a number to me.');
			return;
		}
		
		if (amt === 0) {
			utils.chSend(message, utils.makeTag(giver) + ' you want to give *nothing*? ' + 
			  'Ok, uh... consider it done I guess.');
			return;
		}
		
		if (amt < 0) {
			utils.chSend(message, utils.makeTag(giver) + ' wouldn\'t that be *taking*?'); 
			return;
		}
		
		if (bankroll[giver] < amt) {
			utils.chSend(message, 'You can\'t give what you don\'t have, ' +
			  utils.makeTag(giver) + '!');
			return;
		}
		
		if (!bankroll.hasOwnProperty(giver)) {
			utils.chSend(message, 'You\'ll need a bank account first, ' +
			  utils.makeTag(giver) + '!');
			return;
		}
		
		if (amt === 1) {
			utils.chSend(message, 'Aren\'t you the generous one, ' + utils.makeTag(giver) + '?');
		}
	
		if (!utils.addBank(who, amt, bankroll)) {
			utils.chSend(message, 'Failed to give to ' + who);
		} else {
			utils.addBank(giver, -amt, bankroll);
			utils.chSend(message, ':gift: OK, I moved ' + amt +
			  ' of your credits to ' + utils.makeTag(who) + ', ' + giver);
		}
	},
	help: '`!give <user> <amount>` gives someone some of your credits.',
	disabled: false
};
spongeBot.gift = {
	cmdGroup: 'Fun and Games',
	do: function(message, parms) {
		if (message.author.id === cons.SPONGE_ID) {
			
			if (!parms) {
				utils.chSend(message, 'You forgot the target to !gift.');
				return;
			}
			
			parms = parms.split(' ');
			
			if (!parms[1]) {
				utils.chSend(message, 'No amount specified to `!gift`');
				return;
			}
			
			var who = utils.makeId(parms[0]);
			var amt = parseInt(parms[1]);
			
			if (!utils.addBank(who, amt, bankroll)) {
				utils.chSend(message, 'Failed to give to ' + who);
			} else {
				utils.chSend(message, 'OK, gave ' + utils.makeTag(who) + ' ' + amt + ' credits!');
			}
		}
	},
	help: 'If you are a sponge, `!gift <user> <amount>` gives someone some credits.',
	accessRestrictions: true
};
spongeBot.bank = {
	cmdGroup: 'Fun and Games',
	do: function(message, parms) {
		var who;
		parms = parms.split(' ');

		if (parms[0] === '') {
			who = message.author.id;
			
			if (typeof bankroll[who] === 'undefined') {
				utils.chSend(message, utils.makeTag(who) + ', I don\'t see an account ' +
				  'for you, so I\'ll open one with ' + cons.START_BANK + ' credits.');
				
				/*
				var server = bot.guilds.get(SERVER_ID);
				var role = server.roles.find('name', 'Tester');
			
				if (server.roles.has('name', 'Tester')) {
					debugPrint(' we have a tester!');
				}
				
				//message.member.roles.has(message.guild.roles.find("name", "insert role name here"))
				*/
				bankroll[who] = {};
				bankroll[who].credits = cons.START_BANK;
				utils.saveBanks(cons.BANK_FILENAME, bankroll);
				debugPrint('New bankroll made for ' + who + ' via !bank.');
			} 
		} else {
			who = utils.makeId(parms[0]);
		}
		
		if (typeof bankroll[who] === 'undefined') {
			utils.chSend(message, message.author + ', they don\'t have a bank account.');
		} else if (isNaN(bankroll[who].credits)) {
			utils.chSend(message, message.author + ' that bank account looks weird, thanks' +
			  ' for pointing it out. I\'ll reset it to ' + cons.START_BANK);
			bankroll[who].credits = cons.START_BANK;
			utils.saveBanks(cons.BANK_FILENAME, bankroll);
			debugPrint('Corrupted bankroll fixed for ' + who + ' via !bank.');
			  
		} else {
			utils.chSend(message, utils.makeTag(who) + ' has ' + bankroll[who].credits + ' credits.');
			utils.chSend(message, utils.makeTag(who) +
			' has ' + (utils.getStat(who, 'raffle', 'ticketCount', gameStats) || 'no ') + ' :tickets: s.');
		}
	},
	help: '`!bank <user>` reveals how many credits <user> has. With no <user>, ' +
	  'will either show your own bank, or create a new account for you.'
};
spongeBot.exchange = {
	cmdGroup: 'Giveaways and Raffle',
	do: function(message, parms) {
		if (parms  === 'iamsure') {
			
			if (!bankroll.hasOwnProperty(message.author.id)) {
				utils.chSend(message, message.author + ', you have no bank ' +
				'account.  You can open one with `!bank`.');
				return;
			}
			
			if (!bankroll[message.author.id].hasOwnProperty('credits')) {
				// had no credits proprety
				utils.chSend(message, message.author + ', you have a bank ' +
				'account but no credits account. You have no credits to speak of.');
				return;
			}
			
			if (bankroll[message.author.id].credits < 100000) {
				utils.chSend(message, message.author + ', you don\'t have enough credits.');
				return;
			}
			
			utils.addBank(message.author.id, -100000, bankroll);
			var newTix = utils.alterStat(message.author.id, 'raffle', 'ticketCount', 1, gameStats);
			utils.chSend(message, message.author + ', you now have ' +
			  bankroll[message.author.id].credits + ' credits, and ' + newTix + ' tickets.');
		} else {
			utils.chSend(message, message.author + ', be sure you want to tade 100K ' +
			  'credits for one raffle ticket, then type `!exchange iamsure` to do so.');
		}
	},
	help: '`!exchange iamsure` trades 100,000 credits for a raffle ticket. Make sure you really want to do this.'
};
//-----------------------------------------------------------------------------
spongeBot.savebanks = {
	do: function() {
		utils.saveBanks(cons.BANK_FILENAME, bankroll);
	},
	help: 'Saves all bank data to disk. Should not be necessary to invoke manually.',
	disabled: true
};
spongeBot.savestats = {
	cmdGroup: 'Admin',
	do: function(message) {
		utils.saveStats(cons.STATS_FILENAME, gameStats);
		utils.chSend(message, 'OK. Stats saved manually.');
	},
	help: 'force a stat save to persistent storage',
	accessRestrictions: [],
	disabled: true	
};
spongeBot.delstat = {
	cmdGroup: 'Admin',
	do: function(message, parms) {
		// forreal user game [stat]
		parms = parms.split(' ');
		if (parms[0] !== 'forreal') {
			utils.chSend(message, 'Are you **for real** ' + message.author);
			return;
		} else {
			var who = utils.makeId(parms[1]);
			var game = parms[2];
			var stat = parms[3];
			
			if(!gameStats.hasOwnProperty(who)) {
				utils.chSend(message, 'Can\'t find uid ' + who);
				return;
			}
				
			if (!gameStats[who].hasOwnProperty(game)) {
				utils.chSend(message, 'Can\'t find game `' + game + '` for uid ' + who);
				return;
			}

			if (!parms[3]) {
				utils.chSend(message, 'Deleting GAME ' + game + ' from USER ' + who);
				delete gameStats[who][game];
				return;
			} else {
				if (!gameStats[who][game].hasOwnProperty(stat)) {
					utils.chSend(message, 'Can\'t find stat `' + stat + '` for game ' +
					game + ' for uid ' + who);
					return;
				}
				utils.chSend(message, 'Deleting STAT ' + stat + ' from GAME ' + game + 
				  ' from USER ' + who);
				delete gameStats[who][game][stat];
			}
		}
	},
	help: 'Deletes a game stat, or even an entire game from a user\'s stat.',
	longHelp: 'Use: !delstat forreal <user> <game> [stat]. ' +
	' Will delete a whole game if you don\'t specify stat! Be extra careful!',
	accessRestrictions: true,
	disabled: true
};
spongeBot.getstat = {
	accessRestrictions: [],
	disabled: false,
	cmdGroup: 'Admin',
	do: function(message, parms) {
		
		parms = parms.split(' ');
		if (!parms[0]) {
			console.log(parms[0]);
			utils.chSend(message, '!getstat: No user specified');
			return;
		}
		
		var who = utils.makeId(parms[0]);
		var game = parms[1];
		var stat = parms[2];
		
		if (typeof gameStats[who] === 'undefined') {
			console.log(who);
			utils.chSend(message, '!getstat: No such user in stats database');
			return;
		}
		
		var results = utils.getStat(who, game, stat, gameStats);
		
		if (typeof results === 'object') {
			utils.chSend(message, 'USER: ' + who + '   GAME: ' + game +  ' STAT: ' + stat +
			  ' is:\n' + JSON.stringify(results));
		} else {
			utils.chSend(message, 'USER: ' + who + '   GAME: ' + game +  ' STAT: ' + stat + ' is:\n' + results);
		}
	},
	help: 'Returns the literal value of a stat or all stats of one game for a user',
	longHelp: 'Use !getstat <user> <game> [stat] to return the literal value of a stat object ' +
	  ' or game stat object. Limited access.'
};
spongeBot.setstat = {
	cmdGroup: 'Admin',
	do: function(message, parms) {
		parms = parms.split(' ');
		if (!parms[0]) {
			utils.chSend(message, 'Use: !setstat <user> <game> <stat> ' +
			  ' <newValue> and be careful with it!');
			return;
		}
		utils.chSend(message, 'USER: ' + parms[0] + '  GAME: ' + parms[1] +
		  '  STAT: ' + parms[2] + ' is now ' +
		  utils.setStat(utils.makeId(parms[0]), parms[1], parms[2], parms[3], gameStats));
	},
	help: 'Sets a game stat. limited access.',
	longHelp: 'Use !setstat <user> <game> <stat> <newValue>. Be careful! ' +
	'Will create new user, game, or stat as needed!',
	accessRestrictions: true,
	disabled: true
};
spongeBot.alterother = {
	do: function(message, parms) {
		parms = parms.split(' ');
		if (!parms[0]) {
			utils.chSend(message, 'Use: !alterother <user> <game> <stat> ' +
			  ' <adjustAmount> and be careful with it!');
			return;
		}
		utils.chSend(message, 'In OTHER stats file, USER: ' + parms[0] + '  GAME: ' + parms[1] +
		  '  STAT: ' + parms[2] + ' is now ' +
		  utils.alterStat(utils.makeId(parms[0]), parms[1], parms[2], parseInt(parms[3]), otherStats, cons.DATA_DIR  + 'otherstats.json'));
	},
	help: 'does an alterStat on the "alternate stat file". for toasting porpoises. limited access.',
	longHelp: 'Be careful with it! Will create new stats, games, or even users!',
	disabled: true
};
spongeBot.alterstat = {
	do: function(message, parms) {
		parms = parms.split(' ');		
		if (!parms[0]) {
			utils.chSend(message, 'Use: !alterstat <user> <game> <stat> ' +
			  ' <adjustAmount> and be careful with it!');
			return;
		}
		
		utils.chSend(message, 'USER: ' + parms[0] + '  GAME: ' + parms[1] +
		  '  STAT: ' + parms[2] + ' is now ' +
		  utils.alterStat(utils.makeId(parms[0]), parms[1], parms[2], parseInt(parms[3]), gameStats));
	},
	help: 'changes a game stat. limited access.',
	longHelp: 'Be careful with this, it will create new stats, games or even users!',
	accessRestrictions: true,
	disabled: true
};
spongeBot.stats = {
	cmdGroup: 'Fun and Games',
	do: function(message, parms) {
		var who;
		
		if (!parms) {
			who = message.author.id;
		} else {
			who = utils.makeId(parms);
		}
		
		if (!gameStats[who]) {
			utils.chSend(message, message.author + ', I don\'t have any stats for them.');
			return;
		}
		
		var theStr = ' :bar_chart:  STATS FOR ' + who + '  :bar_chart:\n```';
		
		for (var game in gameStats[who]) {
			theStr += '> ' + game + ':\n';
			for (var stat in gameStats[who][game]) {
				theStr += '    ' + stat + ': ' + gameStats[who][game][stat] + '\n';
			}
		}
		theStr += '```';
		utils.chSend(message, theStr);
		
		if (message.mentions.users.has(who)) {
			// there was an @ mention, and it matches the id sent up
			// so we can pass a user up to addNick for nick nicking
			var user = message.mentions.users.find('id', who);
			utils.addNick(who, user.username, gameStats);
		}
		
		if (!parms) {
			// no parms were sent, so we can nick message.author 's nick
			if (message.author.id) {
				utils.addNick(message.author, message.author.username, gameStats);
			}
		}
		
	},
	help: '`!stats <user>` shows game stats for <user>. Omit <user> for yourself.'
};
spongeBot.topstats = {
	disabled: false,
	cmdGroup: 'Fun and Games',
	do: function(message, parms) {
		if (parms === '') {
			utils.chSend(message, 'Type `!topStats` followed by the game name.');
			return;
		}
		
		parms = parms.split(' ');
		
		// iterates over the whole gameStats array, probably very expensive

		let gameData = {};
		let outStr = '';
		for (let who in gameStats) {
			for (let game in gameStats[who]) {
				if (game === parms[0]) {				
					for (let stat in gameStats[who][game]) {	
						if (!gameData.hasOwnProperty(stat)) {
							gameData[stat] = {};
						}
						gameData[stat][who] = gameStats[who][game][stat];
					}
				}
			}
		}
		outStr += '  **`' + parms[0] +'`**';
		for (let stat in gameData) {
			outStr = '```\n'+ parms[0] + ' stat: "' + stat + '"```\n';
			for (let who in gameData[stat]) {
				outStr += gameData[stat][who] + ': @' + who + '\n';
			}
			utils.chSend(message, outStr + '\n');
		}
	},
	help: 'Shows the top players for a SpongeBot game, and other stats.',
	longHelp: 'Use !topStats <game name>'
};
//-----------------------------------------------------------------------------
spongeBot.slots = {
	cmdGroup: 'Fun and Games',
	disabled: false,
 	do: function(message, parms) {
		slots.do(message, parms, gameStats, bankroll);
	},
	help: '`!slots`: give the slot machine a spin!',
	longHelp: ' Use `!slots spin <bet>` to put credits into the slot machine' +
	  ' and give it a spin! You can also use `!slots paytable` to see the ' +
	  ' current payout table, as well as `!slots stats` to see your stats. ' +
	  ' You can use `!slots reset` if you want to reset your stats.'
};
//-----------------------------------------------------------------------------
var buildHelp = function() {
	
	var theHelp = {};
	for (var cmd in spongeBot) {
	
		// we now no longer show uncategorized commands
		if (spongeBot[cmd].cmdGroup) {		
			var cGroup = '';
			cGroup = spongeBot[cmd].cmdGroup;
			/*
			if (!spongeBot[cmd].cmdGroup) {
				cGroup = 'Uncategorized';
			} else {
				cGroup = spongeBot[cmd].cmdGroup;
			}
			*/
			
			if (!theHelp[cGroup]) {theHelp[cGroup] = '';}
		
			if (spongeBot[cmd].disabled !== true) {
				if (spongeBot[cmd].access) {
					//theHelp[cGroup] += '*'
				} else {
					theHelp[cGroup] += '`!' + cmd + '`: ';
				
					if (spongeBot[cmd].help) {
						theHelp[cGroup] += spongeBot[cmd].help;
					}
					theHelp[cGroup]+= '\n';
				}
			}
		}
	}
	return theHelp;
};
spongeBot.help = {
	cmdGroup: 'Miscellaneous',
	do: function(message, parms) {
		if (parms) {
			if (typeof spongeBot[parms] !== 'undefined') {	
				if (spongeBot[parms].longHelp) {
					utils.chSend(message, spongeBot[parms].longHelp);
				} else if (spongeBot[parms].help) {
					utils.chSend(message, spongeBot[parms].help);
				} else {
					utils.chSend(message, 'I have no help about that, ' + message.author);
				}
			} else {
				utils.chSend(message, 'Not a command I know, ' + message.author);
			}
		} else {
			// no parms supplied, show help on everything in a DM
			
			if (!botStorage.fullHelp) {
				// "cached" help doesn't exist, so build it...
				debugPrint('!help: building help text for first time');
				botStorage.fullHelp = buildHelp();
			} 
			
			// since help text is built, just regurgitate it
			utils.chSend(message, message.author + ', incoming DM spam!');
			for (var cat in botStorage.fullHelp) {
				if (cat !== 'Admin') {
					utils.auSend(message, '\n**' + cat +'**\n' + botStorage.fullHelp[cat]);
				}
			}
			utils.auSend(message, ' Type `!help <command>` for more info on a specific command.');
			}
		},
	help: '`!help`: for when you need somebody, not just anybody. '
};
//-----------------------------------------------------------------------------
spongeBot.timer = {
	cmdGroup: 'Miscellaneous',
	do: function(message, parms) {

		if (parms === '') {
			utils.chSend(message, 'Usage: `!timer <sec>` sets a timer to go off in _<sec>_ seconds.');
		} else {
			parms = parseInt(parms);
			if ((parms >= 1) && (parms <= 999)) {
				setTimeout(function() {
					utils.chSend(message, 'Ding ding! Time is up!');
				}, (parms * 1000));
			} else {
				utils.chSend(message, 'Timer has to be set for between 1-255 secs.');
			}
		}
	},
	help: '`!timer <sec>` sets a timer to go off in _<sec>_ seconds.'
};
spongeBot.time = {
	cmdGroup: 'Miscellaneous',
	do: function(message, parms) {
		var now = new Date();
		var outp = '';
		parms = parms.split(' ');
		outp = '`' + timey.timeStr(parms, now) + '`';
		utils.chSend(message, outp);
	},
	help: '`!time [ long | iso | raw ]`: Shows current time.',
	longHelp: '`time [long | iso | raw]`: Shows current time.' +
	  '`!time long` includes the date. ' + 
	  '`!time iso` gives an ISO standard time and date' +
	  '`!time raw` gives you milliseconds since Jan 1, 1970' +
	  '`!time diff <t1> <t2>` returns a plain-language difference of two ' +
	    ' dates or times supplied in ms since Jan 1, 1970 format',
	accessRestrictions: false
};
//-----------------------------------------------------------------------------
spongeBot.say = {
	accessRestrictions: [],
	cmdGroup: 'Miscellaneous',
	do: function(message, parms) {		
		if (parms === '') {return;}			
		var chan;
		if (parms.startsWith('#')) {
			parms = parms.slice(1).split(' ');
			chan = parms[0];
			parms.shift();
			parms = parms.join(' ');
		} else {
			chan = cons.MAINCHAN_ID;
		}
		BOT.channels.get(chan).send(parms);		
	},
	help: '`!say <stuff>` Make me speak. (limited access command)'
};
//-----------------------------------------------------------------------------
spongeBot.avote = {
	cmdGroup: 'Fun and Games',
	do: function(message, parms) {
		acro.avote(message, parms, gameStats);
	},
	help: 'Use `!avote` during an `!acro` game to vote for your favorite.',
	longHelp: 'Use `!avote` during the _voting round_ of `!acro`, the acronym game\n' +
	  ' to vote for your favorite entry from those shown. For more info, \n' +
	  ' see `!acro help` or watch an acro game in play.'
};
spongeBot.stopacro = {
	do: function(message) {
		clearTimeout(acro.timer);
		if (acro.voteTimer) {clearTimeout(acro.voteTimer);}
		acro.runState = false;
		utils.chSend(message, ':octagonal_sign: `!acro` has been stopped if it was running.');
	},
	help: '`!stopacro` stops the currently running `!acro` game.',
	accessRestrictions: true
};
spongeBot.acrocfg = {
	do: function(message, parms) {
		parms = parms.split(' ');
		
		if (!parms[0]) {
			for (var opt in acro.config) {
				utils.chSend(message, opt + ': ' + acro.config[opt]);
			}
		} else {
			if (acro.config.hasOwnProperty([parms[0]])) {
					
				// handle Booleans
				if (parms[1] === 'false') {parms[1] = false;}
				else if (parms[1] === 'true') {parms[1] = true;}
				
				acro.config[parms[0]] = parms[1];
				utils.chSend(message, '`!acro`: set ' + parms[0] + ' to ' + parms[1] + '.');
			} else {
				utils.chSend(message, '`!acro`: can\'t config ' + parms[0]);
			}
		}
	},
	help: 'Configures the acro game.',
	accessRestrictions: true
};
spongeBot.acro = {
	cmdGroup: 'Fun and Games',
	do: function(message, parms) {
		acro.do(message, parms, gameStats, bankroll);
	},
	help:	'`!acro`: Starts up the acronym game. Set custom options with the format `<parameter>:<argument>`, where' +
		' parameter is one of `letters`, `table`, `length`, `playtime`, or `category` and `<argument>` is the ' +
		'value that you want to assign to that parameter.',
	longHelp:	'`!acro`: Starts up the acronym game. Set custom options with the format `<parameter>:<argument>`, where' +
			'where parameter is one of `letters`, `table`, `length`, `playtime`, or `category`, and `<argument>` is the ' +
			'value that you want to assign to that parameter.' + '\n' +
			' The acronym game consists of an acro-making round, and a voting round.\n' +
			' In the _acro-making round_, players are given 3 to 6 letters, (eg: P A I F).\n' +
			' Players then have a set amount of time to make an acronym using those initial\n' +
			' letters (eg: Playing Acro Is Fun) and submit it using the `!a` command.\n\n' +
			' In the _voting round_ which follows after the alloted time is up, the acronyms\n' +
			' submitted are displayed, anonymized, and everyone in the channel can then\n' +
			' vote on their favorite, using the `!avote` command. Players may or may not\n' +
			' be allowed to be vote for their own acro, based on a configuration option.\n\n' +
			' After the voting round timer ends, the acronym(s) with the most votes is shown\n' +
			' along with the author(s). These are the winners. Depending on config options,\n' +
			' winner(s) may receive some amount of server "credits".'
};
spongeBot.a = {
	cmdGroup: 'Fun and Games',
	do: function(message, parms) {
		acro.a(message, parms);
	},
	help: '`!a <Your Acronym Here>`: Submits your entry in `!acro`',
	longHelp: '`!a <Your Acronym Here>`: Submits your entry in the acronym game,\n' +
	  '`!acro`. For more info, see `!acro help` or watch an acro game in play.'
};
//-----------------------------------------------------------------------------
spongeBot.who = {
	cmdGroud: 'Admin',
	accessRestrictions: false,
	do: function(message, parms) {
		var memb;
		var outStr = '';
		if (parms) {
			memb = message.guild.members.find('id', parms);
			if (memb) {
				outStr =  'Looks like ' + memb.user.username + ' to me. ';
				if (memb.nickname) {
					outStr += ' Around these parts we call them ' + memb.nickname;
				}
				utils.chSend(message, outStr);
			} else {
				utils.chSend(message, 'Doesn\'t like like someone we know in these parts.');
			}
		}
	}
};
//-----------------------------------------------------------------------------
spongeBot.arch = {
	accessRestrictions: [],
	cmdGroup: 'Admin',
	do: function(message, args) {
		if(message.author.id === cons.ARCH_ID) {
			utils.chSend(message, utils.makeTag(cons.ARCH_ID) + ', your bank has been reset');
			if (!bankroll.hasOwnProperty(cons.ARCH_ID)) {
				bankroll[cons.ARCH_ID] = {}; // just in case user doesn't exist
			}
			bankroll[cons.ARCH_ID] = {"credits": 50000};
		} else {
			utils.chSend(message, utils.makeTag(cons.ARCH_ID) + ', we\'ve been spotted! Quick, hide before they get us!');
		}
	},
};
//-----------------------------------------------------------------------------
spongeBot.biglet = {
	cmdGroup: 'Miscellaneous',
	do: function(message, txt) {
		if (txt === '') {
			utils.chSend(message, message.author + ', I have nothing to supersize.');
			return;
		}
		
		if (txt.length > 80) {
			utils.chSend(message, message.author + ', message too big!');
			return;
		}
		utils.chSend(message, utils.bigLet(txt));
	},
	help: '`!biglet <message>` says your message back in big letters'
};
//-----------------------------------------------------------------------------
spongeBot.cattle = {
	cmdGroup: 'Fun and Games',
	do: function(message, args) {
		cattle.do(message, args, gameStats, bankroll);
	},
	help: cattle.help,
	longHelp: cattle.longHelp,
};
//-----------------------------------------------------------------------------
spongeBot.v = {
	cmdGroup: 'Miscellaneous',
	do: function(message) {
		utils.chSend(message, '`' + cons.VERSION_STRING + '`');
	},
	help: 'Outputs the current bot code cons.VERSION_STRING.'
};
spongeBot.version = {
	cmdGroup: 'Miscellaneous',
	do: function(message) {
		utils.chSend(message, ':robot:` SpongeBot v.' + cons.VERSION_STRING + ' online.');
		utils.chSend(message, cons.SPONGEBOT_INFO);
	},
	help: 'Outputs the current bot code version and other info.'
};
spongeBot.bind = {
	help: '`!bind <newCommand> <oldCommand>` to make an alias, but don\'t hose yourself. Limited access.',
	accessRestrictions: [],
	cmdGroup: 'Admin',
	do: function(message, parms) {
		parms = parms.split(' ');
		var newCom = parms[0];
		var oldCom = parms[1];
		
		spongeBot[newCom] = spongeBot[oldCom];
	}
};
//-----------------------------------------------------------------------------
spongeBot.memory = {
	cmdGroup: 'Fun and Games',
	do: function(message, args) {
		memory.do(message, args, gameStats, bankroll);
	},
	help: 'TODO',
	longHelp: 'TODO'
};
//-----------------------------------------------------------------------------
BOT.on('ready', () => {
	debugPrint('Spongebot version ' + cons.VERSION_STRING + ' READY!');
	BOT.user.setGame("!help");
	if (Math.random() < 0.02) {BOT.channels.get(cons.SPAMCHAN_ID).send('I live!');}
});
//-----------------------------------------------------------------------------

BOT.on('raw', async event => {
	if (!cons.EVENTS.hasOwnProperty(event.t)) return;

	const { d: data } = event;
	const user = BOT.users.get(data.user_id);
	const channel = BOT.channels.get(data.channel_id) || await user.createDM();

	if (channel.messages.has(data.message_id)) return;

	const message = await channel.fetchMessage(data.message_id);
	const emojiKey = (data.emoji.id) ? `${data.emoji.name}:${data.emoji.id}` : data.emoji.name;
	let reaction = message.reactions.get(emojiKey);

	if (!reaction) {
		const emoji = new Discord.Emoji(BOT.guilds.get(data.guild_id), data.emoji);
		reaction = new Discord.MessageReaction(message, emoji, 1, data.user_id === BOT.user.id);
	}

	BOT.emit(cons.EVENTS[event.t], reaction, user);
});

BOT.on('messageReactionAdd', (react, whoAdded) => {
	if (react.emoji.name === cons.QUOTE_SAVE_EMO) {
		// temporarily defeated access check logic here to open command up - JK
		/*
		if (!hasAccess(whoAdded.id) || true) {
			utils.chSend(react.message, 'I\'m sorry, I\'m afraid I can\'t do that for you.');
		} else {
			quotes.q.addByReact(react, whoAdded, BOT);
		}
		*/
		
		// temporarily disabled
		//quotes.q.addByReact(react, whoAdded, BOT);
	}
});

BOT.on('message', message => {
	if (message.content.startsWith('!')) {
		var botCmd = message.content.slice(1); // retains the whole ! line, minus !
		var theCmd = botCmd.split(' ')[0];

		var parms = botCmd.replace(theCmd, ''); // remove the command itself, rest is parms
		theCmd = theCmd.toLowerCase();
		if (!spongeBot.hasOwnProperty(theCmd)) {
			// not a valid command
			return;
		}
		parms = parms.slice(1); // remove leading space
		
		if (typeof spongeBot[theCmd] !== 'undefined') {
			debugPrint('  ' + utils.makeTag(message.author.id) + ': !' + theCmd + ' (' + parms + ') : ' + message.channel);
			
			if (!spongeBot[theCmd].disabled) {
				if (spongeBot[theCmd].accessRestrictions) {
					// requires special access
					if (!hasAccess(message.author.id, spongeBot[theCmd].access)) {
						utils.chSend(message, 'Your shtyle is too weak ' +
						  'for that command, ' + message.author);
					} else {
						// missing spongeBot.command.do
						if (!spongeBot[theCmd].hasOwnProperty('do')) {
							debugPrint('!!! WARNING:  BOT.on(): missing .do() on ' + theCmd +
							  ', ignoring limited-access command !' + theCmd);
						} else {
							// all good, run it
							spongeBot[theCmd].do(message, parms, gameStats);
						}
					}
				} else {					
					if (message.author.bot) {
						debugPrint('Blocked a bot-to-bot !command.');
					} else {
						if (!spongeBot[theCmd].hasOwnProperty('do')) {
							debugPrint('!!! WARNING:  BOT.on(): missing .do() on ' + theCmd +
							  ', ignoring user command !' + theCmd);
						} else {
							spongeBot[theCmd].do(message, parms, gameStats);
						}
					}
				}
			} else {
				utils.chSend(message, 'Sorry, that is disabled.');
			}
		} else {
			// not a valid command
		}
	}
});
//=============================================================================
BOT.login(CONFIG.token);