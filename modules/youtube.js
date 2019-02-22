const cons = require('../lib/constants.js');
const utils = require('../lib/utils.js');
const request = require('request');
const CONFIG = require('../../config.json');

module.exports = {
	init: function(vars) {	
		console.log('-- youtube.js: Version 0.001 READY.');
	},
	commands: {
		tubesubs: {
			subCmd: {},
			do: function(message, args, gameStats) {
				let author = message.author;
				
				//console.log(CONFIG.youtubeApiKey);
				
				console.log(`!tubesubs trying to lookup sponge's subs at ${cons.URLS.youtube.subs}...`);
				
				let url = cons.URLS.youtube.subs + '&key=' + CONFIG.youtubeApiKey;
				
				request({url: url, json: true}, function (err, body, response) {
					let theMess = '';
					let subCount = response.pageInfo.totalResults;
					//console.log(response);
					theMess += `${author.username}, I found ${subCount} subscriptions on Sponge's YouTube chan.`;
					theMess += `\n Here's like, page one of them or something:`;
					
					for (let subNum in response.items) {
						theMess += `\n#${subNum}: **${response.items[subNum].snippet.title}**`;
						theMess += `\n   ${response.items[subNum].snippet.description}`;
					}
					utils.chSend(message, theMess);
					
				});
			}
		}
	}
};