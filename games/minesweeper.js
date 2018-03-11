var minesweeper = {
	grid: {},			//An object containing a field for each cell (boolean; true if mine, false if empty)
	display: {},		//An object containing a field for each cell (string, name of char to display)
	mineCount: 0,		//Number of mines placed
	cellsLeft: 0,		//Number of invisible cells remaining
	width: 42,		//Max: 42
	height: 42,		//Max: 42
	active: false,
	getDisplay: function() {
		var result = '';
		for(var x = 0; x < minesweeper.width; x++) {
			var cell = '' + x + '_' + (minesweeper.height - 1);
			result += minesweeper.display[cell];
		}
		for(var y = minesweeper.height - 2; y > -1; y--) {
			result += '\n';
			for(var x = 0; x < minesweeper.width; x++) {
				var cell = '' + x + '_' + y;
				result += minesweeper.display[cell];
			}
			
		}
		return result;
	},
	sendDisplay: function(message) {
		/*
		result = result.split('\n');
		var send = '';
		for(var i = 0; i < result.length; i++) {
			var line = result[i];
			if(send.length + line.length > 1999) {
				utils.chSend(message, send);
				send = line;
			} else {
				send += line;
			}
		}
		if(send.length > 0) {
			utils.chSend(message, send);
		}
		*/
		utils.chSend(message, '```\n' + minesweeper.getDisplay() + '\n```');
	},
	countSurroundingMines: function(x, y) {
		var grid = minesweeper.grid;
		return	(grid[(x-1) + '_' + (y-1)] ? 1 : 0) +
			(grid[(x-1) + '_' + (y)] ? 1 : 0) +
			(grid[(x-1) + '_' + (y+1)] ? 1 : 0) +
			(grid[(x) + '_' + (y-1)] ? 1 : 0) +
			(grid[(x) + '_' + (y+1)] ? 1 : 0) +
			(grid[(x+1) + '_' + (y-1)] ? 1 : 0) +
			(grid[(x+1) + '_' + (y)] ? 1 : 0) +
			(grid[(x+1) + '_' + (y+1)] ? 1 : 0);
	},
	getSurrounding: function(x, y) {
		var result = [];
		result.push({x:x-1, y:y-1});
		result.push({x:x-1, y:y});
		result.push({x:x-1, y:y+1});
		result.push({x:x, y:y-1});
		result.push({x:x, y:y+1});
		result.push({x:x+1, y:y-1});
		result.push({x:x+1, y:y});
		result.push({x:x+1, y:y+1});
		return result;
	},
	reveal: function(x, y) {
		//Return true if this space used to be hidden, false otherwise
		var cell = '' + x + '_' + y;
		//minesweeper.display[cell] = [':blank1:', ':one:', ':two:', ':three:', ':four:', ':five:', ':six:', ':seven:', ':eight:', ':nine:'][surrounding];
		if(minesweeper.display[cell] === '.') {
			minesweeper.cellsLeft--;
			var mines = minesweeper.countSurroundingMines(x, y);
			minesweeper.display[cell] = [' ', '1', '2', '3', '4', '5', '6', '7', '8', '9'][mines];
			return true;
		} else {
			return false;
		}
		
	}
};
spongeBot.minesweeper = {
	cmdGroup: 'Fun and Games',
	do: function(message, args) {
		args = args.split(' ');
		var action = args[0] || '';
		if(action === '') {
			if(minesweeper.active) {
				utils.chSend(message, 'Minesweeper');
				minesweeper.sendDisplay(message);
			} else {
				utils.chSend(message, utils.makeAuthorTag(message) + ', minesweeper is currently inactive. Start a new game with `!minesweeper start`.');
			}
			return;
		} else if(action === 'start') {
			minesweeper.grid = {};
			minesweeper.display = {};
			var width = minesweeper.width;
			var height = minesweeper.height;
			minesweeper.mines = 0;
			minesweeper.cellsLeft = width*height;
			//Place mines
			for(var x = 0; x < width; x++) {
				for(var y = 0; y < height; y++) {
					var cell = '' + x + '_' + y;		//Name that we will use to access this point
					var mine = (Math.random() < 0.4);	//boolean; if true, this cell contains a mine
					minesweeper.grid[cell] = mine;
					if(mine) {
						minesweeper.mines++;
					}
					//minesweeper.display[cell] = ':white_large_square:';
					minesweeper.display[cell] = '.';
				}
			}
			minesweeper.active = true;
			utils.chSend(message, utils.makeAuthorTag(message) + ' has built a deadly minefield around Sponge\'s Reef! Identify and clear all the mines before anyone gets hurt!');
			utils.chSend(message, 'Use `!minesweeper step <x> <y>` to step on a spot to see how many mines are surrounding it. If you step on a mine, then game over!');
			minesweeper.sendDisplay(message);
			return;
		}
		if(!minesweeper.active) {
			utils.chSend(message, utils.makeAuthorTag(message) + ', minesweeper is currently inactive. Start a new game with `!minesweeper start`.');
			return;
		}
		
		if(action === 'step') {
			var x = parseInt(args[1]);
			var y = parseInt(args[2]);
			debugPrint('x: ' + x + ', y: ' + y);
			if(!x || !y) {
				if(!x && !y) {
					utils.chSend(message, utils.makeAuthorTag(message) + ', invalid values for `x` and `y`.');
				} else if(!x) {
					utils.chSend(message, utils.makeAuthorTag(message) + ', invalid values for `x`.');
				} else if(!y) {
					utils.chSend(message, utils.makeAuthorTag(message) + ', invalid values for `y`.');
				}
				return;
			}
			
			//Check invalid spot
			if(x < 1 || x > minesweeper.width || y < 1 || y > minesweeper.height) {
				utils.chSend(message, utils.makeAuthorTag(message) + ' tried to slack off on the job by stepping on an invalid spot!');
				return;
			}
			
			x -= 1;
			y -= 1;
			var cell = '' + x + '_' + y;
			debugPrint('cell = ' + cell);
			
			//First step is always safe
			if(minesweeper.cellsLeft === (minesweeper.width * minesweeper.height)) {
				minesweeper.grid[cell] = false;
				minesweeper.minesLeft--;
			}
			
			if(minesweeper.grid[cell]) {
				minesweeper.active = false;
				//minesweeper.display[cell] = ':bomb:';
				minesweeper.display[cell] = 'X';
				minesweeper.sendDisplay(message);
				utils.chSend(message, utils.makeAuthorTag(message) + ' has stepped on a mine!');
				utils.chSend(message, 'Game over!');
			} else {
				var mines = minesweeper.countSurroundingMines(x, y);
				if(!minesweeper.reveal(x, y)) {
					//If this spot was already visible, then we skip
					utils.chSend(message, utils.makeAuthorTag(message) + ' has verified that an empty spot near ' + mines + ' mines is still indeed empty!');
					return;
				}
				minesweeper.sendDisplay(message);
				utils.chSend(message, utils.makeAuthorTag(message) + ' has stepped on an empty spot near ' + mines + ' mines!');
				//If this space is empty, we flood all surrounding spaces until we 
				if(mines === 0) {
					var revealed = 0;
					var surrounding = minesweeper.getSurrounding(x, y);
					for(var i = 0; i < surrounding.length; i++) {
						//If we are surrounded by empty spaces, we iterate through those spaces later
						var point_i = surrounding[i];
						var x_i = point_i.x;
						var y_i = point_i.y;
						var mines_i = minesweeper.countSurroundingMines(x_i, y_i);
						if(mines_i === 0) {
							var surrounding_i = minesweeper.getSurrounding(x_i, y_i);
							for(var j = 0; j < mines_i.length; j++) {
								surrounding.push(surrounding_i[j]);
							}
						}
						if(minesweeper.reveal(x_i, y_i)) {
							revealed++;
						}
					}
					utils.chSend(message, utils.makeAuthorTag(message) + ' has scouted the clearing and revealed ' + revealed + ' empty spaces!');
				}
				if(minesweeper.minesLeft === minesweeper.cellsLeft) {
					utils.chSend(message, 'All the mines have been located safely, and Sponge\'s Reef is safe once again!');
					minesweeper.active = false;
				}
			}
		} else if(action === 'quit') {
			utils.chSend(message, utils.makeAuthorTag(message) + ' detonated the entire minefield, turning Sponge\'s Reef into a massive crater!');
			minesweeper.active = false;
		}
	},
	help: 'TODO',
	longHelp: 'TODO'
};