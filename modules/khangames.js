const cons = require('../lib/constants.js');
const utils = require('../lib/utils.js');
const request = require('request');
const timey = require('../lib/timey.js');

const gameConfigs = {
	pointsRace: {
		teams: false,
		raceLength: 260000
	}
};

const pointsRaces = {
	configs: require('../../data/khangames/pointsrace-serverconfigs.json'),
	races: require('../../data/khangames/pointsraces.json')
};



const PointsRaceGame = function(opts) {
	
};
PointsRaceGame.prototype.start = function() {
	
};
PointsRaceGame.prototype.stop = function() {
	
};
PointsRaceGame.prototype.config = function() {
	
};
PointsRaceGame.prototype.join = function() {
	
};

const pointsRace = {
	raceState: 'stopped',
	playerList: {}
};

const loadRaces = function() {
	// Takes the races loaded in from disk and creates new PointsRaceGames as needed for them

	for (var gameId in pointsRaces.races) {
		let oneGame = new PointsRaceGame(pointsRaces.races[gameId]);
		pointsRaces.races[gameId] = oneGame;
	}
};

const badId = function(id) {
	id = parseInt(id, 10);							
	if (id < 0) {
		return {message: 'Project id cannot be less than 0!'};
	} else if (id === 0) {
		return {message: 'Project id cannot be 0!'};
	} else if (isNaN(id)) {
		return {message: 'Project id needs to be a number!'};
	} else return false;
};

var handleProfileResponse = function(error, body, response) {
	
	let profile = {};
	
	if (error) {
		utils.debugPrint(`-- khangames.handleProfileResponse(): ERROR: ${error}`);
		return false;
	} else if (!response) {
		utils.debugPrint(`-- khangames.handleProfileResponse(): Received null response.`);
		return false;
	} else {
		profile = {
			vids: response.countVideosCompleted,
			points: response.points
		};
		
	}
	return profile;
}

module.exports = {
	init: function(vars) {
		loadRaces();
		console.log('-- khangames.init(): finished loadRaces()');
		console.log(pointsRaces);
	},
	commands: {
		
		points: {
			subCmd: {},
			do: function(message, args, gameStats) {
				
				let author = message.author;
				let url = cons.URLS.ka.profile;
				let username = args[0]; 
				let theMess = '';
				
				// TODO: Add tests and KAID lookup
				if (!username) {
					utils.chSend(message, `${author.username}, try \`points <username>\` where <username> is a ` +
					  `Khan Academy username. For example: \`points spongejr\`.`);
					return;
				}
				
				url += `?username=${username}`;
				
				utils.debugPrint(`!points: Doing a points lookup at ${url}...`);
				request({"url": url, "json": true}, function (err, body, response) {
					let profile = handleProfileResponse(err, body, response);
					
					if (!profile) {
						theMess += `**${author.username}**, I couldn't get info for ${username}.`
					} else {
						theMess += `Hey **${author.username}**! It looks like **${username}** has ` +
						  `**${profile.points} points** and has watched **${profile.vids}** videos on Khan Academy!`;
					}					
					utils.chSend(message, theMess);
				});
			},
			help: "See how many points a KA user has.",
			longHelp: "`points < username >` looks up how many points a KA user has."
		},
		pointsrace: {
			subCmd: {
				setup: {
					do: function(message, args, gameStats) {
						let author = message.author;
						let theMess = "";
						args.shift();
						
						if (args[0] === "teams") {
							gameConfigs.pointsRace.teams = !gameConfigs.pointsRace.teams;
							theMess += `${author.username}, I've changed teams to ${gameConfigs.pointsRace.teams}.`;
						} else if (args[0] === "time") {
							if (!args[1]) {
								theMess += `${author.username} specify a length (in milliseconds for now).`;
							} else {
								let raceLength = parseInt(args[1], 10);
								if (raceLength <= 0) {
									theMess += `${author.username} specify a _valid_ length (in milliseconds for now).`;
								} else {
									let raceLengthString = utils.msToTime(raceLength);
									gameConfigs.pointsRace.raceLength = raceLength;
									theMess += `${author.username}, the race length is now ${raceLengthString}.`;
								}
							}
						} else {
							theMess += `${author.username}, try \`setup teams\` or \`setup time\` I guess.`;
						}
						utils.chSend(message, theMess);
					}
				},
				show: {
					do: function(message, args, gameStats) {
						let theMess = "The race ";
						let raceLength = utils.msToTime(gameConfigs.pointsRace.raceLength);
						messages = {
							"stopped": "is currently not running.",
							"waiting": "is waiting for more players so it can start!",
							"racing": "has begun!",
						}
						theMess += messages[pointsRace.raceState] || " is in some weird state. :thinking:";
						
						theMess += `\n TEAMS MODE: ${(gameConfigs.pointsRace.teams) ? "On" : "Off"}`;
						theMess += `\n RACE LENGTH: ${raceLength}`;
						
						utils.chSend(message, theMess);
					}
				},
				join: {
					do: function(message, args, gameStats) {
						let author = message.author;
						let theMess = "";
						let kaid = 0;
						
						if (pointsRace.playerList[author.id]) {
							theMess += `${author.username}, I've already got you down as having entered. Good luck though!`;
						} else {
							
							kaid = utils.getStat(author.id, "profile", "kaid", gameStats);
							args.shift();
							
							if (!kaid) {
								if (!args[0]) {
									theMess += `${author.username}, I don't have a KAID for you :slight_frown:`;
								} else {
									
									
									kaid = args[0];
									theMess += `${author.username}, setting your KAID to: ${kaid}`;
									utils.setStat(author.id, "profile", "kaid", kaid, gameStats);
									pointsRace.playerList[author.id] = {"kaid": kaid};
									theMess += `\n and I have entered you in the race!`;
								}
								
							} else {
								// we already had a kaid
								pointsRace.playerList[author.id] = {"kaid": kaid};
								theMess += `${author.username} (KAID ${kaid}) has entered the Points Race!`;
							}
						}
						utils.chSend(message, theMess);
					}
				},
				leave: {
					do: function(message, args, gameStats) {
						let author = message.author;
						let theMess = "";

						if (pointsRace.playerList[author.id]) {
							theMess += `${author.username} has left the the Points Race.`;
							delete pointsRace.playerList[author.id];
						} else {
							theMess += `${author.username}, you're not in the Points Race, so you can't leave.`;
						}						
						utils.chSend(message, theMess);
					}
				},
				list: {
					do: function(message, args, gameStats) {
						let author = message.author;
						let theMess = "";
						
						theMess += "```\n";
						let pList = pointsRace.playerList;
						for (let player in pList) {
							theMess += `\n${player} (KAID ${pList[player].kaid})`;
						}
						theMess += "```";
						
						utils.chSend(message, theMess);
					}
				},
				start: {
					do: function(message, args, gameStats) {
						let author = message.author;
						let theMess = "";
						
						if (pointsRace.raceState === "racing") {
							theMess += `${author.username}, the race is already underway!`;
						} else {
							
							
							
							//TO DO: assign a game id 
							let gameId = 100;
							pointsRaces[gameId] = new PointsRaceGame();
							
							let raceLengthMs = gameConfigs.pointsRace.raceLength;
							let raceLength = utils.msToTime(raceLengthMs);
							let now = new Date();
							let nowMs = now.valueOf();
							let endTimeMs = nowMs + raceLengthMs;
							let endTime = new Date(endTimeMs);
							let thePlayerMess = "```POINTS RACE PLAYERS:\n";
							
							pointsRace.raceState = "racing"
							theMess += `${author.username} says it's time to get this show on the road!` +
							  `\n:vertical_traffic_light: So... let the Points Race... **BEGIN!** :vertical_traffic_light: `;
							
							theMess += `\n This race will last ${raceLength}.` +
							  `\n CURRENT TIME: ${now}   ...` +
							  `   RACE ENDS AT: ${endTime}`;
							 
							let pList = pointsRace.playerList;
							for (let player in pList) {
								thePlayerMess += `\n${player} (KAID ${pList[player].kaid})`;
							}
							thePlayerMess += "```";
							utils.chSend(message, thePlayerMess);
						}
						utils.chSend(message, theMess);
					}
				},
				stop: {
					do: function(message, args, gameStats) {
						let author = message.author;
						let theMess = "";
						
						if (pointsRace.raceState === "stopped") {
							theMess += `${author.username}, the race is already stopped!`;
						} else {							
							pointsRace.raceState = "stopped"
							theMess += `${author.username} has stopped the Points Race!`;
						}						
						utils.chSend(message, theMess);
					}
				}
				
			},
			do: function(message, args, gameStats) {
				
				let author = message.author;
				
				if (!args[0]) {
					utils.chSend(message, this.longHelp);
				} else {
					utils.chSend(message, "Yeah, that's not a thing.");
				}

			},
			help: "Play the KA points race game with others.",
			longHelp: "`pointsrace` lets you play the Khan Academy 'points race' game. Try:\n" +
			  "  `pointsrace setup` to configure the game\n" +
			  "  `pointsrace show` to show the current setup or ongoing race\n" +
			  "  `pointsrace start` or `stop` to start/stop a configured game\n" +
			  "  `pointsrace join` to join a game before the race begins\n" +
			  "  `pointsrace leave` to leave a race\n" +
			  "(note: your server admin may have limited some commands to certain roles)"
		}
	}
};