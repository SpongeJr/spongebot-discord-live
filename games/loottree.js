// Contains !tree 
// Also weekly loot bag !collect code going in here for now

const cons = require('../lib/constants.js');
const FRUIT_VAL = 300;
const utils = require('../lib/utils.js');
const treefile = require('../' + cons.DATA_DIR + cons.LOOTTREE_FILE);
let treesLoaded = false;

//-----------------------------------------------------------------------------
/* tree.config: {
		colorList, flavorList: [] Arrays of strings like "blue" or "striped"
		treeVal: how many credits are awarded upon harvesting,
		ticketRarity: how rare (really) tickets are, as in 1 in this value chance
		magicSeedRarity: how rare seeds are, as above (1000 means 1/1000 chance)
		harvestMessages: [] Array of strings of things that might be said during harvesting
*/
//-----------------------------------------------------------------------------

const Fruit = function(stats) {
	this.stats = stats || {};
	this.stats.ripeness = stats.ripeness || 0;
	this.stats.name = stats.name || ':seedling: budding';
	this.stats.valueMult = stats.valueMult || 0;
	this.stats.special = {},
	this.stats.id = stats.id || {
		color: Math.floor(Math.random() * tree.config.colorList.length),
		flavor: Math.floor(Math.random() * tree.config.flavorList.length),
	},
	this.stats.description = tree.config.colorList[this.stats.id.color] +
	  " " + tree.config.flavorList[this.stats.id.flavor];
};
Fruit.prototype.squish = function(allFruit, storedSlot) {
	// allFruit is the entire tree.trees[who] object (i.e., .stored and .tree both)
	// storedSlot is which slot in the .stored this fruit is
	// returns object with a success Boolean and a message
	// it's all kind of a mess and probably needs refactored
	let success;
	let outP = "";
	
	let squished = allFruit.stored.splice(storedSlot, 1)[0];
	success = true;
	outP += `You squish your stored ${squished.stats.description} fruit.`;
	outP += "\nYou now have one more slot free for storing loot fruit.";
	return { "success": success, "message": outP };
};
Fruit.prototype.keep = function(allFruit, treeSlot) {
	// allFruit is the entire tree.trees[who] object (i.e., .stored and .tree both)
	// treeSlot is which slot in the .tree this fruit is
	// returns object with a success Boolean and a message
	// it's all kind of a mess and probably needs refactored
	
	let success;
	let outP = "";
	let maxKeep = tree.config.maxKeep; // maybe later varies by user
	
	if (allFruit.stored.length >= maxKeep) {
		success = false;
		outP += `Sorry, the max stored fruit is ${maxKeep}! You'll have to do something about that first.`;
	} else {
		
		if (this.stats.ripeness > 0.8 && this.stats.ripeness <= 1.3) {
			success = true;
			let thisFruit = allFruit.tree.splice(treeSlot, 1)[0];
			allFruit.stored.push(thisFruit);
			outP += "Okay, done!";
		} else {
			success = false;
			outP += "Sorry, you may only `keep` ripe fruit.";
		}
	}
	return {"success": success, "message": outP};
};
Fruit.prototype.pick = function() {
	// returns object with a message and a value to add to bank
	let outP = '';
	let totValue = 0;
	
	// TODO: Replace with squishChance constant or something, and rethink
	// since squish mechanic may be desired in Fruit.keep() also
	// Squish mechanic disabled for now.
	/*
	if (Math.random() < 0.08) {
		outP += this.stats.name + ' loot fruit got squished! ';
		this.stats.name = ':grapes: a squished';
		this.stats.valueMult = 0;
	}
	*/
	
	totValue = FRUIT_VAL * this.stats.valueMult;
	
	outP += this.stats.name + ' loot fruit was picked for ' + FRUIT_VAL +
	  ' x ' + (this.stats.valueMult * 100) + '% = ' + totValue;
		
	// start a new fruit for them, up to 4% ripe
	// not really ideal doing it here and like this
	// we maybe need a fruit.respawn()
	// also might have replanting of trees, idk
	this.stats.ripeness = Math.random() * 0.04;
	this.stats.name = ':seedling: budding';
	this.stats.valueMult = 0;
	
	return {message: outP, value: totValue}
};
Fruit.prototype.age = function() {
	this.stats.ripeness = parseFloat(this.stats.ripeness + Math.random() * 0.4);
	
	// TODO: replace magic numbers here with constants
	if (this.stats.ripeness > 1.3) {
		this.stats.name = ':nauseated_face: rotten';
		this.stats.valueMult = 0;
	} else if (this.stats.ripeness > 1.1 && this.stats.ripeness <= 1.3) {
		this.stats.valueMult = 0.8;
		this.stats.name = ':moneybag: very ripe';
	} else if (this.stats.ripeness > 0.8 && this.stats.ripeness <= 1.1) {
		this.stats.name = ':moneybag: perfectly ripe';
		this.stats.valueMult = 1;
	} else if (this.stats.ripeness > 0.4 && this.stats.ripeness <= 0.8) {
		this.stats.name = ':pineapple: unripe';
		this.stats.valueMult = 0.1;
	} else if (this.stats.ripeness <= 0.4) {
		this.stats.name = ':herb: budding';
		this.stats.valueMult = 0;
	}
};
const loadTrees = function() {
	// Take the trees loaded in from disk and creates new Fruit as needed for them

	for (let whoseTree in tree.trees) {
		let allFruit = tree.trees[whoseTree];
		
		// TEMPORARY FILE FORMAT UPDATE BOOTSTRAP CODE
		/*
		if (Array.isArray(allFruit)) {
			// old file format, so we need to update...
			let newAllFruit = {"tree": [], "stored": []};
			for (let i = 0; i < allFruit.length; i++) {
				newAllFruit.tree.push(allFruit[i]);
			}
			tree.trees[whoseTree] = newAllFruit;
			allFruit = tree.trees[whoseTree];
		}
		*/
		
		// where = "tree", "stored", etc.
		for (let where in allFruit) {
			for (let i = 0; i < allFruit[where].length; i++) {				
				tree.trees[whoseTree][where][i] = new Fruit(allFruit[where][i].stats);
			}
		}
	}
	treesLoaded = true;
};
const tree = {
	config: {
		colorList: ['striped','spotted','plain', 'shiny', 'dull', 'dark', 'light', 'bright', 'mottled'],
		flavorList: ['red','orange','yellow','green','blue','indigo','golden','silver'],
		treeVal: 3500,
		ticketRarity: 12,
		magicSeedRarity: 8,
		maxKeep: 3,
		harvestMessages: ['','','','Wow, can I get a loan?','You might need some help carrying all that!','Nice haul!','Enjoy your goodies!',
		  'Cha-CHING!','Woot! Loot!','Looks like about tree fiddy to me.','Don\'t you wish loot trees were real?',
		  'Thanks for participating on the server!','Don\'t spend it all on the `!slots`!',':treasure:',':coin: :coin: :coin:',
		  ':money_mouth:', 'That\'s some good loot!','If you have certain roles, you get more on your harvest!','','','','','']
	},
	trees: treefile
};
module.exports = {
	timers: {
		harvest: {
			howOften: cons.ONE_DAY / 2,
			gracePeriod: 300000,
			failResponse: 'Your loot `!tree` is healthy and growing well! But there ' +
			  'is nothing to harvest on it yet. It looks like it\'ll yield loot in ' +
			  'about <<next>>. Loot trees typically yield fruit every <<howOften>>. '
		},
		tend: {
			howOften: cons.ONE_HOUR / 3,
			gracePeriod: 0,
			failResponse: 'You can only tend to your loot fruit every <<howOften>>, ' +
			  ' and you need to wait <<next>> before you can do it again.'
		},
		pick: {
			howOften: cons.ONE_HOUR / 4,
			gracePeriod: 0,
			failResponse: 'You can only pick your loot fruit every <<howOften>>, ' +
			  ' and you need to wait <<next>> before you can do it again.'			
		}
	},
	subCmd: {
		check: {
			do: function(message, parms, gameStats, bankroll) {
				var who = message.author.id;
				var now = new Date();
				var timers = module.exports.timers;
				var lastCol = utils.alterStat(who, 'lastUsed', 'tree-harvest', 0, gameStats);
				var nextCol = lastCol + timers.harvest.howOften - timers.harvest.gracePeriod;
				var percentGrown;
				now = now.valueOf();

				if (utils.checkTimer(message, who, 'tree-harvest', timers.harvest, gameStats)) {
					utils.chSend(message, 'Your loot tree is fully grown, and you should harvest it '+
					  ' with `!tree harvest` and get your goodies!');
				} else {
					percentGrown = 100 * (1 - ((nextCol - now) / (timers.harvest.howOften - timers.harvest.gracePeriod)));
					utils.chSend(message, ' Your loot tree is healthy, and looks to be about ' +
					'about ' + percentGrown.toFixed(1) + '% grown. It ought to be fully grown' +
					' in about ' + utils.msToTime(nextCol - now));
				}
			},
		},
		harvest: {
			do: function(message, parms, gameStats, bankroll) {
				var who = message.author.id;
				var timers = module.exports.timers;
				if (!utils.collectTimer(message, who, 'tree-harvest', timers.harvest, gameStats)) {
					// not time yet. since we used collectTimer();, the rejection message
					// is automatic, and we can just return; here if we want
					return;
				} else {
					// if we're here, it's time to collect, and collectTime has been updated to now
					var messStr = '';
					var collectVal = 0;
					var fruitBonus = 0;
					var fruitBonusStr = '';
					
					//fruit bonus (disabled)
					/*
					if (tree.trees.hasOwnProperty(who)) {
						fruitBonus += 50 * tree.trees[who].length;
					}
					*/
					collectVal = tree.config.treeVal + fruitBonus;
					
					var specialRoles = {
						"Admin": 50,
						"Dev": 75,
						"Emoji manager": 2000,
						"Tester": 800,
						"Musician": 750,
						"Artist": 750,
						"Writer": 750,
						"giveaways": 300,
					};
					var role;
					var roleBonusStr = '';
					var totalRoleBonus = 0;
					if (message.guild === cons.SERVER_ID) {
						for (var roleName in specialRoles) {
							role = message.guild.roles.find('name', roleName);
							if (message.member.roles.has(role.id)) {
								roleBonusStr += roleName + '(' + specialRoles[roleName] + '), ';
								totalRoleBonus += specialRoles[roleName];
							}
						}
						
						if (totalRoleBonus !== 0) {
							roleBonusStr = roleBonusStr.slice(0, roleBonusStr.length - 2); // remove last comma
							roleBonusStr = 'Included these bonuses for having special roles on The Planet: ' + roleBonusStr;
							roleBonusStr += '\n   Total role bonus: ' + totalRoleBonus + '! ';
							collectVal += totalRoleBonus;
						}
					}
					
					if (fruitBonus > 0) {
						fruitBonusStr += '\n Also added ' + fruitBonus + ' for trying `!tree fruit` since' +
						  'the last bot reset. ';
					}
					
					messStr +=  ':deciduous_tree: Loot tree harvested!  :moneybag:\n ' +
					  utils.makeTag(who) +  ' walks away ' + collectVal + ' credits richer! ' +
					  '\n' + roleBonusStr + fruitBonusStr;
					utils.addBank(who, collectVal, bankroll);
					
					//random saying extra bit on end: 
					var sayings = JSON.stringify(tree.config.harvestMessages);
					sayings = JSON.parse(sayings);
					messStr += utils.listPick(sayings);
					
					messStr += "\n:warning: Tree harvesting will soon be replaced by the updated loot fruit game!\n";
					messStr += ":warning: Please stay tuned for updates!";
					
					utils.chSend(message, messStr);
					
					//magic seeds ... (do nothing right now unfortunately) =(
					//since I'm testing and will have them set common, we're calling them "regularSeeds"
					if (Math.floor(Math.random() * tree.config.magicSeedRarity) === 0) {
						utils.chSend(message, utils.makeTag(who) + ', what\'s this? You have found a ' +
						'loot tree seed in your harvest! Looks useful! You save it.');
						
						utils.alterStat(who, 'tree', 'regularSeeds', 1, gameStats);
					}

					//raffle ticket! DOES award, be careful with rarity!
					if (Math.floor(Math.random() * tree.config.ticketRarity) === 0) {
						utils.chSend(message, utils.makeTag(who) + ', what\'s this? A raffle ticket ' +
						':tickets: fell out of the tree! (`!giveaways` for more info.)');
						utils.alterStat(who, 'raffle', 'ticketCount', 1, gameStats);
					
					}
				}
			}
		},
		fruit: {
			do: function(message, parms, gameStats, bankroll) {
				
				let who = message.author.id;
				if (tree.trees.hasOwnProperty(who)) {
					let fruit = tree.trees[who];
					
					// show each fruit's stats
					let fruitMess = '``` Loot fruit status for '+ message.author.username +': ```\n';
					
					for (let where in fruit) {
						fruitMess += `\n**Location: _${where}_**\n`;
						let theseFruits = fruit[where];
						for (let i = 0; i < theseFruits.length; i++) {
							fruitMess += `\`${i + 1}\``.padStart(3) + ": ";
							fruitMess += `${theseFruits[i].stats.name} ${theseFruits[i].stats.description}` +
							  `(${theseFruits[i].stats.id.color}, ${theseFruits[i].stats.id.flavor})` + 
							  ` loot fruit   Ripeness: ${(theseFruits[i].stats.ripeness * 100).toFixed(1)} %`;
							if (theseFruits[i].stats.health) {
								fruitMess += ' (thriving!)';
							}
							fruitMess += '\n';
						}
					}
					
					utils.chSend(message, fruitMess);
				} else {
					utils.chSend(message, 'I see no fruit for you to check, ' + message.author +
					  '\nI\'ll give you three starter fruit. You can !tree tend or !tree pick them' +
					  ' at any time, for now.');
					tree.trees[who] = { "tree": {}, "stored": {} };
					tree.trees[who].tree.push(new Fruit({}));
					tree.trees[who].tree.push(new Fruit({}));
					tree.trees[who].tree.push(new Fruit({}));
				}
			}
		},
		tend: {
			do: function(message, parms, gameStats, bankroll) {
				let timers = module.exports.timers;				
				let who = message.author.id;
				let fruitMess = "";
				if (tree.trees.hasOwnProperty(who)) {
					
					if (!utils.collectTimer(message, who, 'tree-tend', timers.tend, gameStats)) {
						return;
					}
					
					let fruit = tree.trees[who].tree;
					// tend to each Fruit
					fruitMess += "You decide to use magic to try to ripen all of your trees loot fruit at once.\n"
					fruitMess += '``` Loot fruit status for '+ message.author.username +': ```\n';
					for (let i = 0; i < fruit.length; i++) {

						let ageIt = (Math.random() < 0.67); // 67% per fruit chance of aging
						if (ageIt) {
							fruit[i].age();
						}
						fruitMess += fruit[i].stats.name + ' ' + fruit[i].stats.description +
						  ' loot fruit   Ripeness: ' + (fruit[i].stats.ripeness * 100).toFixed(1) + '%';
						if (ageIt) {
							fruitMess += ' (tended)';
						} if (fruit[i].stats.health) {
							fruitMess += ' (thriving!)';
						}
						fruitMess += '\n';
					}
					utils.saveObj(tree.trees, cons.LOOTTREE_FILE);
					utils.chSend(message, fruitMess);
				} else {
					utils.chSend(message, 'I see no fruit you can tend to.');
				}
			}
		},
		pick: {
			do: function(message, parms, gameStats, bankroll) {
				let timers = module.exports.timers;
				let pickMess = "";
				let who = message.author.id;
				if (tree.trees.hasOwnProperty(who)) {
					if (!utils.collectTimer(message, who, 'tree-pick', timers.pick, gameStats)) {
						return;
					}
				
					let fruit = tree.trees[who].tree;
				
					// .pick() each Fruit
					pickMess += "You decide to pick all of your loot fruit and let it turn to loot in yours hands.\n"
					pickMess += '```Loot Fruit pick results for '+ message.author.username +': ```\n ';
					var totalFruitVal = 0;
					for (let i = 0; i < fruit.length; i++) {
						let pickResult = fruit[i].pick();
						totalFruitVal += pickResult.value;
						pickMess += pickResult.message + '\n';
					}
				} else {
					utils.chSend(message, 'You have no trees! Try doing `tree fruit` first.');
					return;
				}
				pickMess += '\n **TOTAL LOOT FRUIT VALUE**: ' + totalFruitVal + ' (added to your bank)';
				pickMess += '\n\n :information_source: TIP: You can ~~now~~ (soon) save fruit with `tree keep <#>`!';
				pickMess += 'Try to make a matched set of 3 of the same type or color of fruit! ';
				utils.addBank(who, totalFruitVal, bankroll);
				utils.chSend(message, pickMess);
			}
		},
		keep: {
			do: function(message, parms, gameStats, bankroll) {
				let who = message.author.id;
				let mess = "";
				let fruitChoice = parseInt(parms, 10);
				
				if (!tree.trees.hasOwnProperty(who)) {
					utils.chSend(message, 'You have no trees! Try doing `tree fruit` first.');
					return;
				} else {
					let unpickedFruit = tree.trees[who].tree;
					
					if (!Array.isArray(unpickedFruit)) {
						console.log(`!tree keep: WARNING! tree.trees.${who}. did not have a tree[] array!`);
						utils.chSend(message, "Something seems to be seriously wrong with your loot fruit trees!");
						return;
					}

					if (fruitChoice < 1 || isNaN(fruitChoice) || fruitChoice > unpickedFruit.length) {
						utils.chSend(message, "Invalid fruit number. You can do `tree fruit` first to list them.");
						return;
					}
					
					if (typeof unpickedFruit[fruitChoice - 1] === "undefined") {
						utils.chSend(message, "Something seems to be seriously wrong with that loot fruit!");
						return;
					}
					let keepResult = unpickedFruit[fruitChoice - 1].keep(tree.trees[who], fruitChoice - 1);
					// later, we may want to handle these differently...
					if (keepResult.success) {
						mess += keepResult.message;
					} else {
						mess += keepResult.message;
					}
				}
				utils.chSend(message, mess);
			}
		},
		squish: {
			do: function(message, parms, gameStats, bankroll) {
				let who = message.author.id;
				let mess = "";
				let fruitChoice = parseInt(parms, 10);
				
				if (!tree.trees.hasOwnProperty(who)) {
					utils.chSend(message, 'You have no trees! Try doing `tree fruit` first.');
					return;
				} else {
					let storedFruit = tree.trees[who].stored;
					
					if (!Array.isArray(storedFruit)) {
						console.log(`!tree keep: WARNING! tree.trees.${who}. did not have a stored[] array!`);
						utils.chSend(message, "Something seems to be seriously wrong with your loot fruit trees!");
						return;
					}

					if (fruitChoice < 1 || isNaN(fruitChoice) || fruitChoice > storedFruit.length) {
						utils.chSend(message, "Invalid stored fruit number. You can do `tree fruit` first to list them.");
						return;
					}
					
					if (typeof storedFruit[fruitChoice - 1] === "undefined") {
						utils.chSend(message, "Something seems to be seriously wrong with that loot fruit!");
						return;
					}
					let squishResult = storedFruit[fruitChoice - 1].squish(tree.trees[who], fruitChoice - 1);
					// later, we may want to handle these differently...
					if (squishResult.success) {
						mess += squishResult.message;
					} else {
						mess += squishResult.message;
					}
					
					utils.chSend(message, mess);
				}
			}
		}
	},
	cmdGroup: 'Fun and Games',
	help: 'Interact with your loot `!tree` and collect regular rewards!',
	longHelp: 'Your loot tree is a guaranteed source of credits on this server!\n' +
	  ' You can currently `!tree check` your tree, or `!tree harvest` from it.\n' +
	  ' They normally pay out every 12 hours.' +
	  ' \n Loot trees will always award credit when harvested, and sometimes other ' +
	  ' surprises! \n :deciduous_tree: :deciduous_tree: Good luck! :moneybag: :moneybag:',
	disabled: false,
	access: false,
	do: function(message, parms, gameStats, bankroll) {
		
		if (!treesLoaded) {
			loadTrees();
			console.log('tree.do(): Fruit placed on trees.');
		}
		
		parms = parms.split(' ');		
		if (parms[0] === '') {
			utils.chSend(message, 'Please see `!help tree` for help with your loot tree.');
			return;
		}
		parms[0] = parms[0].toLowerCase();
		let subCmd = parms[0];
		
		if (this.subCmd.hasOwnProperty(parms[0])) {
			//we've found a found sub-command, so do it...
			parms.shift();
			parms = parms.join(' ');
			this.subCmd[subCmd].do(message, parms, gameStats, bankroll);
		} else {
			utils.chSend(message, 'What are you trying to do to that tree?!');
		}
	},
	collectbag: {
		timers: {
			howOften: cons.ONE_WEEK,
			gracePeriod: cons.ONE_HOUR,
			failResponse: 'You open up your loot bag to `!collect`, but it\'s ' +
		  'completely empty. :slight_frown: . It takes <<howOften>> for new ' +
		  'loot to appear in your `!collect`ion bag. Yours will be ready in <<next>>'
		},
		do: function(message, parms, gameStats, bankroll) {
			var who = message.author.id;	
			if (!utils.collectTimer(message, who, 'collect', this.timers, gameStats)) {
				// not time yet. since we used collectTimer();, the rejection message
				// is automatic, and we can just return; here if we want
				return;
			} else {
				// if we're here, it's time to collect, and collectTime has been updated to now
				var messStr =  ':moneybag: Loot bag `!collect`ed!  :moneybag:\n\n';
				var collectVal = 12500;
				var fruitBonus = 0;
				
				// Fruit bonus removed
				/*
				if (tree.trees.hasOwnProperty(who)) {
					fruitBonus += 750 * tree.trees[who].length;
					collectVal += fruitBonus;
					messStr += ' :money_mouth: Bonus of ' + fruitBonus + ' for trying ' +
					' the `!tree fruit` alpha-testing feature since last bot restart!\n';
				}
				*/

				var numTix = 1;
				messStr += utils.makeTag(who) +  ', you have added ' + collectVal + ' credits ' + 
				  'and ' + numTix + 'x :tickets: (raffle tickets) to your bank. \n';
				 messStr += utils.makeTag(who) + ', you now have ' + utils.alterStat(who, 'raffle', 'ticketCount', numTix, gameStats) +
				   ' :tickets: s and ' + utils.addBank(who, collectVal, bankroll) + ' credits! ';
				//random saying extra bit on end (using tree sayings for now)
				var sayings = JSON.stringify(tree.config.harvestMessages);
				sayings = JSON.parse(sayings);
				messStr += utils.listPick(sayings);
				utils.chSend(message, messStr);
			}
		}
	}
};