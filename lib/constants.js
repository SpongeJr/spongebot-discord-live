module.exports = {
	SCRAMWORDS: require('../../data/scramwords.json'),
	PLANET_SCRAMWORDS: require('../../data/planetscramwords.json'),
	ESO_SCRAMWORDS: require('../../data/esowords.json'), // Elder Scrolls Online custom words for one guild
	STATS_FILENAME: '../data/gamestats.json',
	OBJECTS_FILENAME: '../data/savedobjs.json',
	BANK_FILENAME: '../data/banks.json',
	BANK_BACKUP_FILENAME: '../data/banks',
	STATS_BACKUP_FILENAME: '../data/gamestats',
	CATTLE_FILE: 'cattle.json',
	LOOTTREE_FILE: 'treefile.json',
	ENQUEUE_FILE: 'songqueue.json',
	MUD: {
		playerFile: 'spongemud/players.json',
		roomFile: 'spongemud/rooms.json',
		itemFile: 'spongemud/items.json'
	},
	QUOTES_FILE: 'quotes.json',
	QUOTE_SAVE_EMO: '⏺',
	EVENTS: {
		MESSAGE_REACTION_ADD: 'messageReactionAdd',
		MESSAGE_REACTION_REMOVE: 'messageReactionRemove',
	},
	QUOTE_SERVER_LIMITS: {
		"402126095056633859": 5
	},
	DATA_DIR: '../data/',
	VERSION_STRING: '0.9997: Still Alive',
	SPONGEBOT_INFO: 'SpongeBot (c) 2018, 2019 by Josh Kline and 0xABCDEF/Archcannon ' +
	  '\nreleased under MIT license. Bot source code can be found at: ' +
	  '\n https://github.com/SpongeJr/spongebot-discord-live' +
	  '\nMade using: `discord.js` https://discord.js.org and `node.js` https://nodejs.org',
	SPONGE_ID: "167711491078750208",
	ARCH_ID: "306645821426761729",
	MAINCHAN_ID: "402126095056633863",
	SPAMCHAN_ID: "402591405920223244",
	DEBUGCHAN_ID: "410435013813862401",
	SERVER_ID: "402126095056633859",
	ONE_DAY: 86400000,
	ONE_WEEK: 604800000,
	ONE_HOUR: 3600000,
	START_BANK: 10000,
	NEXT_RAFFLE: 1521847200000
};
