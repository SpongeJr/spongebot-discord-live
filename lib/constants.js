module.exports = {
	SCRAMWORDS: require('../../data/scramwords.json'),
	PLANET_SCRAMWORDS: require('../../data/planetscramwords.json'),
	ESO_SCRAMWORDS: require('../../data/esowords.json'), // Elder Scrolls Online custom words for one guild
	STATS_FILENAME: '../data/gamestats.json',
	OBJECTS_FILENAME: '../data/savedobjs.json',
	BANK_FILENAME: '../data/banks.json',
	EVENTS_FILENAME: '../data/events.json',
	BANK_BACKUP_FILENAME: '../data/banks',
	STATS_BACKUP_FILENAME: '../data/gamestats',
	MTCWATCH_BACKUP_FILENAME: '../data/mtcwatches',
	CATTLE_FILE: 'cattle.json',
	LOOTTREE_FILE: 'treefile.json',
	ENQUEUE_FILE: 'songqueue.json',
	MUD: {
		"playerFile": 'spongemud/players.json',
		"roomFile": 'spongemud/rooms.json',
		"itemFile": 'spongemud/items.json'
	},
	QUOTES_FILE: 'quotes.json',
	QUOTE_SAVE_EMO: '%E2%8F%BA%EF%B8%8F',
	QUOTE_SAVE_EMO_TEXT: ':record_button:',
	QUOTE_SAVE_EMO_UNI: '%E2%8F%BA%EF%B8%8F',
	EVENTS: {
		MESSAGE_REACTION_ADD: 'messageReactionAdd',
		MESSAGE_REACTION_REMOVE: 'messageReactionRemove',
	},
	QUOTE_SERVER_LIMITS: {},
	DATA_DIR: '../data/',
	VERSION_STRING: '0.9998: Woke',
	SPONGEBOT_INFO: 'SpongeBot (c) 2018, 2019 by Josh Kline and 0xABCDEF/Archcannon ' +
	  '\nreleased under MIT license. Bot source code can be found at: ' +
	  '\n https://github.com/SpongeJr/spongebot-discord-live' +
	  '\nMade using: `discord.js` https://discord.js.org and `node.js` https://nodejs.org',
	SPONGE_ID: "167711491078750208",
	ARCH_ID: "306645821426761729",
	MAINCHAN_ID: "402126095056633863",
	SPAMCHAN_ID: "402591405920223244",
	DEBUGCHAN_ID: "410435013813862401",
	MTCTICKERCHAN_ID: "543925318306496522",
	MTC_EMO: "<:MTC:543937435692695572>",
	SERVER_ID: "402126095056633859",
	PLANET_SERVER_ID: "402126095056633859",
	ONE_DAY: 86400000,
	ONE_WEEK: 604800000,
	ONE_HOUR: 3600000,
	START_BANK: 10000,
	WISHINGWELL: {
		minGroupSize: 2,
		maxGroupSize: 4,
		groupTimeAllotment: 90000
	},
	ECONOMY: {
		"weeklyCollect": {
			"base": 20000,
			"bonus": {
				"role": {
					"Dev": {
						bonusAmt: 16384,
						id: "410550804903231489"
					},
					"Moderator": {
						bonusAmt: 15000,
						id: "558218337159741441"
					},
					"Event host": {
						bonusAmt: 5000,
						id: "662146111892619274"
					},
					"Emoji manager": {
						bonusAmt: 12500,
						id: "409561777811226625"
					},
					"Tester": {
						bonusAmt: 8000,
						id: "406065387126652939"
					},
					"MUD wizard": {
						bonusAmt: 12500,
						id: "549438158790721568"
					},
					"Artist": {
						bonusAmt: 6000,
						id: "412338041529827328"
					},
					"Musician": {
						bonusAmt: 6000,
						id: "405508931235086346"
					},
					"Writer": {
						bonusAmt: 6000,
						id: "410156602293878784"
					},
					"Streamer": {
						bonusAmt: 6000,
						id: "539018076453339146"
					},
					"Twitch Subscriber": {
						bonusAmt: 25000,
						id: "599936326871285761"
					},
					"Twitch Subscriber: Tier 1": {
						bonusAmt: 2500,
						id: "689248075528536124"
					},
					"Twitch Subscriber: Tier 2": {
						bonusAmt: 5000,
						id: "689248075528536195"
					},
					"Twitch Subscriber: Tier 3": {
						bonusAmt: 25000,
						id: "689248075528536275"
					}
				}
			}
		}
	},
	NEXT_RAFFLE: 1521847200000,
	URLS: {
		"getBtc": "https://api.coinbase.com/v2/prices/BTC-USD/buy",
		"ka": {
			"scratchpad": "https://www.khanacademy.org/api/labs/scratchpads/",
			"profile": "https://www.khanacademy.org/api/internal/user/profile"
		},
		"youtube": {
			"subs": "https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&channelId=UCIP5O9rDkiG24GoCvzVO0Iw"
		}
	},
	MTCBOT_ID: "430468476038152194",
	MTCBOT_WATCH_SERVER: "210923273553313792",
	MTC_WATCHFILE: "mtcwatches.json",
	TIMEY: {
		"lateEventAnnounceText": ":facepalm: I just realized I was supposed to tell everyone about this but I must have been asleep or something, so I'm a little late in mentioning it...\n"
	}


};
