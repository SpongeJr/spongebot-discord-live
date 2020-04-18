// Contains !tree
// Also weekly loot bag !collect code going in here for now
// Also wishing well stuff

const cons = require('../lib/constants.js');
const utils = require('../lib/utils.js');
const i18n = require('../modules/i18n.js');
const v = {
	wishingWell: {
		groups: {}
	}
};
const treefile = require('../' + cons.DATA_DIR + cons.LOOTTREE_FILE);
const FRUIT_VAL = 300;
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
const WishGroup = function(options) {
	let leaderId = options.leaderId;
	let message = options.message;
	let userLang = options.userLang;
	let formedTime = new Date().valueOf();
	let outStr = "";

	this.leader = {
		"id": leaderId,
		"name": message.author.username
	};
	this.members = [{
		"id": leaderId,
		"name": message.author.username
	}];
	this.formedTime = formedTime;
	this.timer = setTimeout((userLang) => {
		let theGroup = this;
		let members = theGroup.members;
		let groupSize = members.length;
		let msgGuildId = message.guild.id;

		let outP = this.text.wishTimeExpired(userLang, theGroup); // "time is up"
		if (groupSize < cons.WISHINGWELL.minGroupSize) {
			outP += i18n.st(
				["lootFruit", "wishNotEnoughPeople"],
				userLang,
				[cons.WISHINGWELL.minGroupSize, groupSize]
			);
		} else {
			outP += i18n.st(["lootFruit", "wishesGranted"], userLang, [groupSize]);
			this.grantWishes("seeds", userLang, message);
		}
		utils.chSend(message, outP);
		delete v.wishingWell.groups[msgGuildId];
	}, cons.WISHINGWELL.groupTimeAllotment);
};
WishGroup.prototype.isFull = function() {
	return this.members.length === cons.WISHINGWELL.maxGroupSize;
};
WishGroup.prototype.timeLeftToJoin = function() {
	let now = new Date().valueOf();
	return cons.WISHINGWELL.groupTimeAllotment - (now - this.formedTime);
};
WishGroup.prototype.text = {
	wishTimeExpired: (userLang, theGroup) => {
		let outStr = "";
		let groupText = "";
		let members = theGroup.members;

		for (let member of members) {
			groupText += member.name + ", ";
		}
		groupText = groupText.slice(0, -2);

		outStr += i18n.st(["lootFruit", "wishTimeExpired"], userLang);
		return outStr;
	},
	wishGroupCreated: (userLang, theGroup) => {
		return i18n.st(
			["lootFruit", "wishGroupCreated"],
			userLang,
			[cons.WISHINGWELL.minGroupSize, cons.WISHINGWELL.maxGroupSize, cons.WISHINGWELL.groupTimeAllotment  / 1000]
		);
	},
	joinedWishGroup: (userLang, theGroup) => {
		return i18n.st(
			["lootFruit", "joinedWishGroup"],
			userLang,
			[
				theGroup.leader.name,
				theGroup.members.length,
				cons.WISHINGWELL.maxGroupSize,
				Math.floor(theGroup.timeLeftToJoin() / 1000)
			]
		);
	},
	wishGroupFull: (userLang, theGroup) => {
		return i18n.st(["lootFruit", "wishGroupFull"], userLang);
	},
	wishGranted: (userLang, theGroup) => {
		let groupSize = theGroup.members.length;
		let groupText = "";
		for (let member of theGroup.members) {
			groupText += member.name + ", ";
		}
		groupText = groupText.slice(0, -2);
		return i18n.st(["lootFruit", "wishesGranted"], userLang, [groupSize, groupText]);
	}
};
WishGroup.prototype.grantOneWish = function(wish, member, userLang) {
	let resultStr = "";
	let memberName = member.name;
	switch (wish) {
		case "seeds": {
			resultStr += i18n.st(["lootFruit", "seedWishGranted"], userLang, [memberName]);
		}
		break;
		case "loot": {
			resultStr += i18n.st(["lootFruit", "lootWishGranted"], userLang, [memberName]);
		}
		case "time": {
			resultStr += i18n.st(["lootFruit", "timeWishGranted"], userLang, [memberName]);
		}
		default: {
			resultStr += "WishGroup.grantWish(): WARNING! Tried to grant invalid wish: ${wish} for ${memberName}";
			console.log("WishGroup.grantWish(): WARNING! Tried to grant invalid wish: ${wish} for ${memberName}");
		}
	}
	return resultStr;
};
WishGroup.prototype.grantWishes = function (wish, userLang, message) {
	let theGroup = this;
	let outStr = "";
	for (let member of theGroup.members) {
		outStr += this.grantOneWish(wish, member, userLang);
	}
	utils.chSend(message, outStr);
};
const Fruit = function(stats) {
	this.stats = stats || {};
	this.stats.ripeness = stats.ripeness || 0;
	this.stats.name = stats.name || ':seedling: budding';
	// TODO maybe: this.stats.name = fruitRipenessString(this.stats.ripeness);
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
	// allFruit is the entire tree.trees[who] object (i.e., .stored and .garden both)
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
Fruit.prototype.keep = function(allFruit, gardenSlot) {
	// allFruit is the entire tree.trees[who] object (i.e., .stored and .garden both)
	// gardenSlot is which slot in the .garden this fruit is
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
			let thisFruit = allFruit.garden.splice(gardenSlot, 1)[0];
			allFruit.stored.push(thisFruit);
			outP += "Okay, done!";
		} else {
			success = false;
			outP += "Sorry, you may only `keep` ripe fruit.";
		}
	}
	return {"success": success, "message": outP};
};
Fruit.prototype.pick = function(who, gameStats, allFruit, gardenSlot) {
	// returns object with a message and a value to add to bank
	// previously would also delete itself from allFruit array -- no longer!
	let outP = '';
	let totValue = 0;

	totValue = FRUIT_VAL * this.stats.valueMult;

	outP += `${this.stats.name} loot fruit was picked for ${FRUIT_VAL}` +
	  ` x ${this.stats.valueMult * 100}% = ${totValue}`;
	return { message: outP, value: totValue }
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

		for (let where in allFruit) {
			for (let i = 0; i < allFruit[where].length; i++) {
				tree.trees[whoseTree][where][i] = new Fruit(allFruit[where][i].stats);
			}
		}
	}
	treesLoaded = true;
};
// TODO: replace tree.config object with a JSON configuration file
const tree = {
	config: {
		colorList: ['striped','spotted','plain', 'shiny', 'dull', 'dark', 'light', 'bright', 'mottled','sparkly'],
		flavorList: ['red','orange','yellow','green','blue','indigo','violet','golden','silver','white'],
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
		redeem: {
			do: function(message, args, gameStats, bankroll) {
				// must specify three fruit indices from stored fruits that match
				// in color or flavor, or both
				// Ex:  !fruit redeem 1 3 9
				let who = message.author.id;
				let userLang = utils.getStat(who, "i18n", "language", gameStats);
				let outP = "";


				if (!tree.trees.hasOwnProperty(who)) {
					/* utils.chSend(message, "You have no loot fruit! Use `fruit list` to get started " +
					  "with a loot fruit garden that you can tend to and collect rewards from.");
					*/
					utils.chSend(message, i18n.st(["lootFruit", "noFruitGetStarted"], userLang));
					return;
				}
				let storedFruit = tree.trees[who].stored;
				if (!Array.isArray(storedFruit)) {
					/*utils.chSend(message, "You have no stored loot fruit to be redeemed!" +
					  "\nYou can do `fruit list` to see your fruit status." +
					  "\nTo move ripe fruit from your garden to stored, use the " +
					  "`fruit keep` command.");
					  */
					utils.chSend(message, i18n.st(["lootFruit", "noFruitToRedeem"], userLang));
					return;
				}
				args = args.split(" ");

				if (args.length !== 3) {
					/*
					utils.chSend(message, "You must specify _exactly_ 3 fruits from your stored " +
					  "fruit list to redeem. All fruits should be of the same color or flavor.\n" +
					  "Specify fruits by numbers (use `fruit list` to see a list) and separate them with spaces." +
					  "\n Example: `fruit redeem 1 3 4`");
					*/
					utils.chSend(message, i18n.st(["lootFruit", "specifyExactly3Fruits"], userLang));
					return;
				}

				let colors = {};
				let flavors = {};
				let choiceCount = {}; // we use this to make sure they don't do dupes like !redeem 2 5 2

				let failed = false;
				let failMsg = "";
				args.forEach( (arg) => {
					fruitChoice = parseInt(arg, 10);
					if (isNaN(fruitChoice) || (fruitChoice < 1) || (fruitChoice > storedFruit.length)) {
						failMsg = ":warning: Invalid fruit number(s). Please do `fruit list` " +
						  "and select which fruits you want to redeem from your **stored** fruits.";
						failed = true;
						return;
					}
					choiceCount[fruitChoice] = choiceCount[fruitChoice] || 0;
					choiceCount[fruitChoice]++;
					console.log(`${fruitChoice} count is: ${choiceCount[fruitChoice]}`);
					if (choiceCount[fruitChoice] > 1) {
						failMsg = ":warning: You need to specify three _unique_ fruits from your stored list." +
						  "\n Use `fruit list` if you need to list them.";
						failed = true;
						return;
					}
					// arg - 1 is because zero-based indexes

					colors[storedFruit[arg - 1].stats.id.color] = colors[storedFruit[arg - 1].stats.id.color] || 0;
					flavors[storedFruit[arg - 1].stats.id.flavor] = flavors[storedFruit[arg - 1].stats.id.flavor] || 0;
					colors[storedFruit[arg - 1].stats.id.color]++;
					flavors[storedFruit[arg - 1].stats.id.flavor]++;
				});

				if (failed) {
					utils.chSend(message, failMsg);
					return;
				}

				let colorMatch = false;
				let flavorMatch = false;
				for (let color in colors) {
					if (colors[color] === 3) {
						colorMatch = true;
						colorMatchName = tree.config.colorList[color];
					}
				}
				for (let flavor in flavors) {
					if (flavors[flavor] === 3) {
						flavorMatch = true;
						flavorMatchName = tree.config.flavorList[flavor];
					}
				}

				let ticketsEarned = 0;
				if (colorMatch) {
					outP += `Your match of three ${colorMatchName} fruits has been redeemed for a raffle ticket!\n`;
					ticketsEarned++;
				}
				if (flavorMatch) {
					outP += `Your match of three ${flavorMatchName} fruits has been redeemed for a raffle ticket!\n`;
					ticketsEarned++;
				}

				if (colorMatch && flavorMatch) {
					outP += `You receive a bonus raffle ticket for a perfect match of three ` +
					  `${flavorMatchName} ${colorMatchName} fruits! Congrats!\n`;
					ticketsEarned++;
				}

				if (ticketsEarned) {
					outP += `${ticketsEarned} raffle ticket(s) have been added to your account!\n`;
					outP += "You now have " +
					  `${utils.alterStat(who, 'raffle', 'ticketCount', ticketsEarned, gameStats)} raffle tickets.`;

					fruitsToRemove = new Set(args);
					tree.trees[who].stored = tree.trees[who].stored.filter(
						(el, ind) => { !fruitsToRemove.has(ind); }
					);

				} else {
					outP += "You do not have a match of either of three of the same fruit or flavor of loot fruit.\n";
					outP += "You must have a match of three to use `fruit redeem`.";
				}
				utils.saveObj(tree.trees, cons.LOOTTREE_FILE);
				utils.chSend(message, outP);
			}
		},
		plant: {
			do: function(message, parms, gameStats, bankroll) {
				let who = message.author.id;
				let outP = '';
				let treeSeeds = utils.getStat(who, "tree", "regularSeeds", gameStats);
				if ((!treeSeeds) || (treeSeeds < 1)) {
					outP += "You have no loot fruit seeds to plant.\n";
					outP += "They are difficult to acquire right now, good luck!";
				} else {
					let maxFruit = utils.getStat(who, "tree", "maxFruit", gameStats) || 4;
					let fruit = tree.trees[who];

					if (!fruit) {
						outP += "It looks like you don't have a fruit garden yet!\n";
						outP += "Do `fruit list` first to get one started.";
						utils.chSend(message, outP);
						return;
					}

					if (fruit.garden.length < maxFruit) {
						tree.trees[who].garden.push(new Fruit({}));
						treeSeeds = utils.alterStat(who, 'tree', 'regularSeeds', -1, gameStats);
						outP += "You carefully plant the loot fruit seed. Use `fruit list` to show your fruit.\n";
						outP += `You now have **${treeSeeds}** loot fruit seeds remaining.`;
					} else {
						outP += `Your garden cannot currently hold more loot fruit.`;
						outP += `\nYou can have a maximum of ${maxFruit} planted fruits.`;
					}
				}
				utils.saveObj(tree.trees, cons.LOOTTREE_FILE);
				utils.chSend(message, outP);
			}
		},
		harvest: {
			do: function(message, parms, gameStats, bankroll) {

			let messStr = "";
			messStr += ":thinking: You look for your loot tree but find a garden of loot fruit in its place!"
			messStr += "\nUse `!fruit list` to check your garden, and `!help fruit` for more information about it.";

			utils.chSend(message, messStr);
			}
		},
		list: {
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
							fruitMess += `${theseFruits[i].stats.name} ${theseFruits[i].stats.description} loot fruit   ` +
							`Ripeness: ${(theseFruits[i].stats.ripeness * 100).toFixed(1)} %`;
							if (theseFruits[i].stats.health) {
								fruitMess += ' (thriving!)';
							}
							fruitMess += '\n';
						}
					}

					utils.chSend(message, fruitMess);
				} else {
					utils.chSend(message, 'I see no fruit for you to check, ' + message.author +
					  '\nI\'ll give you three starter fruit. You can !fruit tend or !fruit pick them' +
					  ' at any time, for now. You can also stored them with !fruit keep.');
					tree.trees[who] = { "garden": [], "stored": [] };
					tree.trees[who].garden.push(new Fruit({}));
					tree.trees[who].garden.push(new Fruit({}));
					tree.trees[who].garden.push(new Fruit({}));
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

					let fruit = tree.trees[who].garden;
					// tend to each Fruit
					fruitMess += "You decide to use magic to try to ripen all of your trees loot fruit at once.\n"
					fruitMess += '``` Loot fruit status for '+ message.author.username +': ```\n';
					for (let i = 0; i < fruit.length; i++) {

						let ageIt = (Math.random() < 0.67); // 67% per fruit chance of aging
						if (ageIt) {
							fruit[i].age();
						}
						fruitMess += `${fruit[i].stats.name} ${fruit[i].stats.description}` +
						  ` loot fruit   Ripeness: ${(fruit[i].stats.ripeness * 100).toFixed(1)} %`;
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
				let totalFruitVal = 0;
				if (tree.trees.hasOwnProperty(who)) {
					if (!utils.collectTimer(message, who, 'tree-pick', timers.pick, gameStats)) {
						return;
					}

					let fruit = tree.trees[who].garden;

					if (fruit.length === 0) {
						pickMess += "You current have no fruit in your garden!\n";
						pickMess += "You can plant loot fruit with `!fruit plant`, ";
						pickMess += "if you have fruit seeds.";
						utils.chSend(message, pickMess);
						return;
					}

					// .pick() each Fruit
					pickMess += "You decide to pick all of your loot fruit and let it turn to loot in your hands.\n"
					pickMess += '```Loot Fruit pick results for '+ message.author.username +': ```\n ';
					for (let i = 0; i < fruit.length; i++) {
						let pickResult = fruit[i].pick(who, gameStats, tree.trees[who], i);
						totalFruitVal += pickResult.value;
						pickMess += pickResult.message + '\n';
					}
					pickMess += `\nYou will need to do \`!fruit plant\` in order to get another ` +
					  `fruit, and you must have a loot fruit seed in order to do so.`;
					let treeSeeds = utils.getStat(who, "tree", "regularSeeds", gameStats);
					if (!treeSeeds) { treeSeeds = "NO"; }
					pickMess += `You have **${treeSeeds}** loot fruit seeds remaining.`;
					tree.trees[who].garden = []; // empty their fruit garden
				} else {
					utils.chSend(message, 'You have no fruit! Try doing `fruit list` first.');
					return;
				}
				pickMess += '\n **TOTAL LOOT FRUIT VALUE**: ' + totalFruitVal + ' (added to your bank)';
				pickMess += '\n\n :information_source: TIP: You can now save fruit with `fruit keep <#>`!';
				pickMess += '\nTry to make a matched set of 3 of the same type or color of fruit! ';
				utils.addBank(who, totalFruitVal, bankroll);
				utils.saveObj(tree.trees, cons.LOOTTREE_FILE);
				utils.chSend(message, pickMess);
			}
		},
		keep: {
			do: function(message, parms, gameStats, bankroll) {
				let who = message.author.id;
				let mess = "";
				let fruitChoice = parseInt(parms, 10);

				if (!tree.trees.hasOwnProperty(who)) {
					utils.chSend(message, 'You have no trees! Try doing `fruit list` first.');
					return;
				} else {
					let unpickedFruit = tree.trees[who].garden;

					if (!Array.isArray(unpickedFruit)) {
						console.log(`!tree keep: WARNING! tree.trees.${who}. did not have a tree[] array!`);
						utils.chSend(message, "Something seems to be seriously wrong with your loot fruit trees!");
						return;
					}

					if (fruitChoice < 1 || isNaN(fruitChoice) || fruitChoice > unpickedFruit.length) {
						utils.chSend(message, "Invalid fruit number. You can do `fruit list` first to list them.");
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
				utils.saveObj(tree.trees, cons.LOOTTREE_FILE);
				utils.chSend(message, mess);
			}
		},
		squish: {
			do: function(message, parms, gameStats, bankroll) {
				let who = message.author.id;
				let mess = "";
				let fruitChoice = parseInt(parms, 10);

				if (!tree.trees.hasOwnProperty(who)) {
					utils.chSend(message, 'You have no fruit! Try doing `fruit list` first.');
					return;
				} else {
					let storedFruit = tree.trees[who].stored;

					if (!Array.isArray(storedFruit)) {
						console.log(`!tree keep: WARNING! tree.trees.${who}. did not have a stored[] array!`);
						utils.chSend(message, "Something seems to be seriously wrong with your loot fruit!");
						return;
					}

					if (fruitChoice < 1 || isNaN(fruitChoice) || fruitChoice > storedFruit.length) {
						utils.chSend(message, "Invalid stored fruit number. You can do `fruit list` first to list them.");
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
					utils.saveObj(tree.trees, cons.LOOTTREE_FILE);
					utils.chSend(message, mess);
				}
			}
		}
	},
	cmdGroup: 'Fun and Games',
	help: 'Interact with your loot `!fruit` and collect regular rewards!',
	longHelp: 'Your loot fruit is a guaranteed source of credits on this server!\n' +
	  ' Commands to try: `fruit list` `fruit tend` `fruit pick` `fruit keep` `fruit plant` `fruit squish`\n' +
	  '`fruit list`: show you current fruit garden and stored fruit\n' +
	  '`fruit tend`: increases the ripeness of some fruit in your garden, randomly\n' +
	  '`fruit pick`: pick **all** fruit in your garden for some credits -- try to pick ripe fruit!\n' +
	  '`fruit keep #`: move fruit # from your garden to your stored fruits\n' +
	  '`fruit plant`: plant fruit in your garden -- you must have fruit seeds to do this\n' +
	  '`fruit squish #:` squish (destroy) fruit # from your **stored** fruits (to make room for others)\n',
	disabled: false,
	access: false,
	do: function(message, parms, gameStats, bankroll) {

		if (!treesLoaded) {
			loadTrees();
			console.log('tree.do(): Fruit placed on trees.');
		}

		parms = parms.split(' ');
		if (parms[0] === '') {
			utils.chSend(message, 'Please see `!help fruit` for help with your loot fruit.' +
			  '\nUse `!fruit list` to list your loot fruit.');
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
			utils.chSend(message, 'What are you trying to do to that loot fruit?!');
		}
	},
	resetwishes: {
		do: function(message, parms, gameStats, bankroll) {
			utils.setStat(message.author.id, "lastUsed", "wishingWell", 0, gameStats);
		}
	},
	wishingwell: {
		timers: {
			howOften: cons.ONE_DAY,
			gracePeriod: cons.ONE_HOUR,
			failResponse: 'You visit the magic `!wish`ing well, but it ' +
		  'appears dull, grey, and lifeless. No magic aura surrounds it. ' +
		  '\nYou sense that the well will respond to you in <<next>>.'
		},
		help: "Visit the magic `!wish`ing well and make a wish today!",
		longHelp: "Visit the magic `!wish`ing well and make a wish today!" +
		  "\nGet other server members to join you for the best outcome." +
		  "\nFor now, try `!wish seeds`",
		access: [],
		disabled: false,
		do: function(message, parms, gameStats, bankroll) {
			let who = message.author.id;
			let userLang = utils.getStat(who, "i18n", "language", gameStats);
			parms = parms.split(' ');
			if (parms[0] === '') {
				utils.chSend(message, 'Please see `!help wish` for help with the wishing well.');
				return;
			}
			parms[0] = parms[0].toLowerCase();
			let subCmd = parms[0];

			if (this.subCmd.hasOwnProperty(parms[0])) {
				//we've found a found sub-command, so do it...
				parms.shift();
				parms = parms.join(' ');
				if (!utils.collectTimer(message, who, 'wishingWell', this.timers, gameStats)) {
					// not time yet. since we used collectTimer(), the rejection message
					// is automatic, and we can just return; here if we want
					return;
				} else {
					// the else is unnecessary but keeping it here
					this.subCmd[subCmd].do(message, parms, gameStats, bankroll);
				}
			} else {
				utils.chSend(message, 'What are you trying to do to that magic wishing well?!');
			}
		},

		subCmd: {
			seeds: {
				do: function(message, parms, gameStats, bankroll) {
					let who = message.author.id;
					let userLang = utils.getStat(who, "i18n", "language", gameStats);
					let msgGuild = message.guild;
					let outStr = "";
					let msgGuildId;
					if (msgGuild) {
						msgGuildId = message.guild.id;
					} else {
						utils.chSend(message, i18n.st(["lootFruit", "noWishDM"], userLang));
						return;
					}

					// check for existing group on this server
					if (v.wishingWell.groups[msgGuildId]) {
						// existing group found!
						let theGroup = v.wishingWell.groups[msgGuildId];
						let leader = theGroup.leader;
						theGroup.members.push({
							id: who,
							name: message.author.username
						});

						outStr += theGroup.text.joinedWishGroup(userLang, theGroup);

						if (theGroup.isFull()) {
							let groupSize = theGroup.members.length;
							let groupText = "";
							for (let member of theGroup.members) {
								groupText += member.name + ", ";
							}
							groupText = groupText.slice(0, -2);
							outStr += theGroup.text.wishGroupFull(userLang, theGroup);
							outStr += theGroup.text.wishGranted(userLang, theGroup);
							// make the wish come true! (someday)
							// theGroup.grantWish("seeds"); // maybe
							clearTimeout(v.wishingWell.groups[msgGuildId].timer);
							delete v.wishingWell.groups[msgGuildId];
						}
					} else {
						// no group, this player will now be a leader
						let theGroup = new WishGroup({
							"leaderId": who,
							"message": message,
							"userLang": userLang
						});
						v.wishingWell.groups[msgGuildId] = theGroup;
						outStr += v.wishingWell.groups[msgGuildId].text.wishGroupCreated(userLang, theGroup);
					}
					utils.chSend(message, outStr);
				}
			},
			loot: {
				do: function(message, parms, gameStats, bankroll) {
					let who = message.author.id;
					let userLang = utils.getStat(who, "i18n", "language", gameStats);
					utils.chSend(message, i18n.st(["lootFruit", "lootWish"], userLang));
				}
			},
			time: {
				do: function(message, parms, gameStats, bankroll) {
					let who = message.author.id;
					let userLang = utils.getStat(who, "i18n", "language", gameStats);
					utils.chSend(message, i18n.st(["lootFruit", "timeWish"], userLang));
				}
			}
		}
	},
	resetallcollects: {
		help: "Reset the `!collect` timer for **ALL** users.",
		longHelp: "Reset the `!collect` timer for **ALL** users so that they can collect immediately.",
		access: [],
		disabled: true,
		do: function(message, args, gameStats) {
			let totalResets = 0;
			for (let userId in gameStats) {
				utils.setStat(userId, "lastUsed", "collect", 0, gameStats);
				totalResets++;
			}
			utils.chSend(message, `I've done my best to reset collect timers on ${totalResets} accounts.`);
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
			let who = message.author.id;
			let userLang = utils.getStat(who, "i18n", "language", gameStats);
			let numTix = 1;
			let messStr = "";
			if (!utils.collectTimer(message, who, 'collect', this.timers, gameStats)) {
				// not time yet. since we used collectTimer(), the rejection message
				// is automatic, and we can just return; here if we want
				return;
			} else {
				let baseVal = cons.ECONOMY.weeklyCollect.base;
				let collectVal = 0;
				let bonusRoles = cons.ECONOMY.weeklyCollect.bonus.role;
				let totalBonus = 0;
				let bonusStr = "";

				let collectGuild = message.guild;
				let collectServerId;
				if (collectGuild) {
					collectServerId = message.guild.id;
				} else {
					utils.chSend(message, i18n.st("weeklyCollectNoDM", userLang));
					return;
				}

				if (collectServerId === cons.PLANET_SERVER_ID) {
					for (let roleName in bonusRoles) {
						let role = message.guild.roles.get(bonusRoles[roleName].id);
						if (!role) {
							console.log(`WARNING! Could not fetch role ${roleName}(${bonusRoles[roleName].id}) on The Planet!`);
						} else {
							if (role.members.get(who)) {
								let bonusAmt = bonusRoles[roleName].bonusAmt;
								totalBonus += bonusAmt;
								bonusStr += i18n.st("weeklyCollectRoleBonusLine", userLang, [bonusAmt, roleName]);
							}
						}
					}
					if (totalBonus) {
						messStr += i18n.st("weeklyCollectRoleBonusHeader", userLang)
						messStr += bonusStr;
						messStr += i18n.st("weeklyCollectRoleBonusFooter", userLang, [totalBonus]);
					}
				}
				collectVal += baseVal;
				collectVal += totalBonus;

				messStr += i18n.st(
					"weeklyCollect",
					userLang,
					[
						utils.makeTag(who),
						collectVal,
						numTix,
						utils.alterStat(who, 'raffle', 'ticketCount', numTix, gameStats),
						utils.addBank(who, collectVal, bankroll)
					]
				);
				//random saying extra bit on end (using tree sayings for now)
				let sayings = JSON.stringify(tree.config.harvestMessages);
				sayings = JSON.parse(sayings);
				messStr += utils.listPick(sayings);
				utils.chSend(message, messStr);
			}
		}
	}
};
