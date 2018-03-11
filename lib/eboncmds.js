const cons = require('./constants.js');
const FS = require('fs');
var utils = require('../lib/utils.js');

module.exports = {
	ttc: function(message, parms) {			
		if (!parms) {
			utils.chSend(message, 'To look up an item on Tamriel Trade Centre (EU/PC), just use `!ttc <item>`.' +
			  '\nUse an exact item name, or you can search for partial matches.');
			return;
		}
		var theLink = 'https://eu.tamrieltradecentre.com/pc/Trade/SearchResult?ItemNamePattern='
		parms = parms.replace(/ /g, '+');
		theLink += parms + '&SortBy=Price&Order=asc';
		utils.chSend(message, theLink);
	},
};