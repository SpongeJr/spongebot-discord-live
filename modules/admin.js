const cons = require('../lib/constants.js');
const ut = require('../lib/utils.js');
// const request = require('request');
const v = {};

module.exports = {
	init: function(vars) {
		v.activityTypes = {
			"watch": "WATCHING",
			"play": "PLAYING",
			"stream": "STREAMING",
			"listen": "LISTENING",
			"compete": "COMPETING"
		};
		v.defaultActivity = v.activityTypes.play;
		console.log('-- admin.init(): Hello world.');
	},
	commands: {
		setstatus: {
			help: "Sets bot status (admin only)",
			accessRestrictions: [],
			subCmd: {},
			do: function(message, args, gameStats, bankroll, gbl) {
				let client = gbl.client;
				let inputActivity = args[0];
				let activity;
				let activityType;
				let outP = "";
				if (v.activityTypes.hasOwnProperty(inputActivity)) {
					activityType = v.activityTypes[inputActivity];
					args.shift();
					activity = args.join(" ");
				} else {
					console.log("not a hot dog!");
					activityType = v.defaultActivity;
					activity = args[0];
				}
				client.user.setActivity(activity, { "type": activityType })
					.then((res) => {
						ut.chSend(message, "... and my status has been set as requested.");
						//console.log(res);
					})
					.catch((err) => {
						console.error(err);
						ut.chSend(message, `:slight_frown: setting my status didn't go so well:\n${err}`);
					});
				outP += `Attempting to set status: ${activityType} ${activity}`;
				ut.chSend(message, outP);
			}
		},
		enable: {
			do: function(message, args, gameStats, bankroll, gbl) {
				args = args[0];
				let spongeBot = gbl.spongeBot;
				if (!spongeBot[args]) {
					ut.chSend(message, `Can't find command ${args}!`);
					return;
				}
				console.log(args);
				console.log(args === 'enable');
				if (args === 'enable') {
					ut.chSend(message, ':yodawg:');
				}
				spongeBot[args].disabled = false;
				ut.chSend(message, `${args}.disabled: ${spongeBot[args].disabled}`);
			},
			help: 'Enables a bot command. Restricted access command.',
			subCmd: {},
			accessRestrictions: []
		},
		disable: {
			do: function(message, args, gameStats, bankroll, gbl) {
				args = args[0];
				let spongeBot = gbl.spongeBot;
				if (!spongeBot[args]) {
					ut.chSend(message, `Can't find ${args}!`);
					return;
				}
				if (args === 'disable') {
					ut.chSend(message, ':yodawg:');
				} else if (args === 'enable') {
					ut.chSend(message, `Don't disable enable. Just don't.`);
					return;
				}
				spongeBot[args].disabled = true;
				ut.chSend(message, `${args}.disabled: ${spongeBot[args].disabled}`);
			},
			help: 'Disables a bot command. Restricted access.',
			accessRestrictions: [],
			subCmd: {}
		},
		restrict: {
			subCmd: {},
			accessRestrictions: true,
			cmdGroup: 'Admin',
			do: function(message, args, gameStats, bankroll, gbl) {
				args = args[0];
				let spongeBot = gbl.spongeBot;
				if (!spongeBot[args]) {
					ut.chSend(message, `Can't find command ${args}!`);
					return;
				}
				if (args === 'restrict') {
					ut.chSend(message, `:yodawg: you can't !restrict .restrict`);
					return;
				}

				if (spongeBot[args].hasOwnProperty('accessRestrictions')) {
					spongeBot[args].accessRestrictions = !spongeBot[args].accessRestrictions;
				} else {
					spongeBot[args].accessRestrictions = true;
				}
				ut.chSend(message, `\`!${args}\` is restricted access: ${spongeBot[args].accessRestrictions}`);
			},
			help: ':warning: Toggles whether commands require special access.'
		}
	}
};
