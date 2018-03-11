var hangman = {
	answer: '',		//The answer
	display: '',	//The string that gets displayed
	hint: '',
	characters: [],	//The characters that players have given
	chances: 0,		//The number of incorrect guesses until game over
	active: false,	//Whether a game is currently running
	reward: 0,		//The reward for the winner
	displayCharacters: function() {
		var last = hangman.characters.length-1;
		if(last === -1) {
			return 'None';
		}
		var result = '';
		for(var i = 0; i < last; i++) {
			result += hangman.characters[i] + ' ';
		}
		if(last > -1) {
			result += hangman.characters[last];
		}
		return result;
	}
};
spongeBot.hangman = {
	cmdGroup: 'Fun and Games',
	do: function(message, args) {
		args = args.split(' ');
		var action = args[0] || '';
		action = action.toLowerCase();
		if(action === '') {
			if(!hangman.active) {
				utils.chSend(message, utils.makeTag(message.author.id) + ', hangman is currently inactive. Start new game with `!hangman start <answer> <hint>`.');
			} else {
				var reply = 'Hangman';
				reply += '\nAnswer: ' + '`' + hangman.display + '`';
				reply += '\nHint: ' + hangman.hint;
				reply += '\nCharacters: ' + hangman.displayCharacters();
				reply += '\nChances Left: ' + hangman.chances;
				reply += '\nBounty: ' + hangman.reward;
				utils.chSend(message, reply);
			}
			return;
		} else if(action === 'start') {
			if(!hangman.active) {
				var answer = args[1] || '';
				if(answer === '') {
					utils.chSend(message, utils.makeTag(message.author.id) + ', please specify an answer');
					return;
				}
				//https://stackoverflow.com/questions/23476532/check-if-string-contains-only-letters-in-javascript
				//Check alphabetic only
				if(!(/^[a-z0-9\s]+$/i.test(answer))) {
					utils.chSend(message, utils.makeTag(message.author.id) + ', I\'m not sure I can read that');
					return;
				}
				hangman.answer = answer;
				hangman.display = '';
				for(var i = 0; i < answer.length; i++) {
					if(answer.charAt(i) === ' ') {
						hangman.display += ' ';
					} else {
						hangman.display += '_';
					}
					
				}
				
				hangman.hint = '';
				for(var i = 2; i < args.length; i++) {
					if(args[i]) {
						hangman.hint += args[i] + ' ';
					}
				}
				hangman.characters = [];
				hangman.chances = 5;
				hangman.reward = 300;
				hangman.active = true;
				utils.chSend(message, utils.makeTag(message.author.id) + ' has taken a random person for hostage and has threatened to hang the hostage unless someone guesses the secret password! The hostage has promised a reward of ' + hangman.reward + ' credits to whoever reveals the correct answer!');
				utils.chSend(message, 'Answer: `' + hangman.display + '`');
				utils.chSend(message, 'Hint: ' + hangman.hint);
			} else {
				utils.chSend(message, utils.makeTag(message.author.id) + ', a game of hangman is already running');
			}
			return;
		}
		
		if(!hangman.active) {
			utils.chSend(message, utils.makeTag(message.author.id) + ', hangman is currently inactive. Start new game with `!hangman start <answer> <hint>`.');
			return;
		}
		
		//These actions only apply to an active game
		if(action === 'character') {
			var character = args[1] || '';
			if(character === '') {
				utils.chSend(message, utils.makeTag(message.author.id) + ', I\'m not sure that nothingness itself is a character.');
				return;
			} else if(character.length > 1) {
				utils.chSend(message, utils.makeTag(message.author.id) + ', only one character at a time, please!');
				return;
			} else if(!(/^[a-z0-9\s]+$/i.test(character))) {
				utils.chSend(message, utils.makeTag(message.author.id) + ', I don\'t think I\'ve seen that character before');
				return;
			}
			character = character.toLowerCase();
			for(var i = 0; i < hangman.characters.length; i++) {
				if(character === hangman.characters[i]) {
					utils.chSend(message, utils.makeTag(message.author.id) + ', someone already guessed that character.');
					return;
				}
			}
			var found = 0;
			var nextDisplay = '';
			for(var i = 0; i < hangman.answer.length; i++) {
				if(hangman.answer.charAt(i).toLowerCase() === character) {
					nextDisplay += hangman.answer.charAt(i);
					found++;
				} else {
					nextDisplay += hangman.display.charAt(i);
				}
			}
			hangman.display = nextDisplay;
			hangman.characters.push(character);
			if(found > 0) {
				utils.chSend(message, utils.makeTag(message.author.id) + ', you have found ' + found + ' instances of ' + character.toUpperCase() + ' in the answer.');
				utils.chSend(message, 'Answer: `' + hangman.display + '`');
				//Check if we already revealed the answer
				for(var i = 0; i < hangman.answer.length; i++) {
					if(hangman.answer.charAt(i).toLowerCase() !== hangman.display.charAt(i).toLowerCase()) {
						return;
					}
				}
				
				utils.chSend(message, utils.makeTag(message.author.id) + ' has completed the answer!');
				utils.chSend(message, utils.makeTag(message.author.id) + ' wins ' + hangman.reward + ' credits!');
				utils.addBank(message.author.id, hangman.reward, bankroll);
				hangman.active = false;
				return;
			} else {
				utils.chSend(message, utils.makeTag(message.author.id) + ', you have found 0 instances of ' + character.toUpperCase() + ' in the answer.');
				utils.chSend(message, 'Answer: `' + hangman.display + '`');
				hangman.chances--;
				if(hangman.chances < 1) {
					utils.chSend(message, 'The hangman has died! Game over!');
					utils.chSend(message, utils.makeTag(message.author.id) + ', think about what you have done! The hangman is now dead because of you!');
					hangman.active = false;
				} else {
					utils.chSend(message, hangman.chances + ' chances remain!');
				}
			}
		} else if(action === 'answer') {
			var answer = args[1] || '';
			if(answer === '') {
				utils.chSend(message, utils.makeTag(message.author.id) + ', what? Cat got your tongue? If you have an answer, then speak!');
			} else if(answer.toLowerCase() === hangman.answer.toLowerCase()) {
				utils.chSend(message, utils.makeTag(message.author.id) + ' speaks the correct answer and saves the day!');
				utils.chSend(message, utils.makeTag(message.author.id) + ' wins ' + hangman.reward + ' credits!');
				utils.addBank(message.author.id, hangman.reward, bankroll);
				hangman.active = false;
			} else {
				utils.chSend(message, utils.makeTag(message.author.id) + ', that is not the correct answer!');
				hangman.chances--;
				if(hangman.chances < 1) {
					hangman.active = false;
					utils.chSend(message, 'The hangman has died! Game over!');
					utils.chSend(message, utils.makeTag(message.author.id) + ', think about what you have done! The hangman is now dead because of you!');
				} else {
					utils.chSend(hangman.chances + ' chances remain!');
				}
			}
		} else if(action === 'quit') {
			utils.chSend(message, utils.makeTag(message.author.id) + ' has decided to put the hangman out of his misery!');
			hangman.active = false;
		} else {
			utils.chSend(message, utils.makeTag(message.author.id) + ' you\'re going to do ***WHAT*** to the hangman?!');
		}
	},
	help: 'TODO',
	longHelp: 'TODO',
};