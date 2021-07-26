let cons = require('../../lib/constants.js');
let utils = require('../../lib/utils.js');
let rssConfig = require('./rssconfig.json');
let v = {};
let Parser = require('rss-parser');
let parser = new Parser();
let rssTimers = {};
let feedStorage = {};

const sitePoller = function(site, BOT) {
	(async () => {
	  let latestFeed = await parser.parseURL(rssConfig.sites[site].url);
	  let latestItems = latestFeed.items.slice(0, rssConfig.sites[site].maxNew);
	  let overflow = latestFeed.items.length - latestItems.length;
	  let newItems = 0;
	  let announceStr = "";
	  let options = {
		  "showPostDate": false,
		  "showLinkPreview": true
	  }
	  
	  latestItems.forEach((item) => {
		  // compare each with stored
		  let lastFeed = feedStorage[site].last;

		  let found = false;
		  if (!Array.isArray(lastFeed.items)) {
			  console.log(`rss.js: lastFeed.items was not an array for ${site}!`);
		  } else {
			  found = lastFeed.items.find((el) => {
				//console.log(`${el.link} = ${item.link} ? ${el.link === item.link}`);
				return el.link === item.link;
			});
		}

		if (!found) {
			// new item! Add to announce string.
			newItems++;	
			let blurb = `**${item.title}**`;
			
			if (options.showPostDate) {
				blurb += ` (Posted: ${item.isoDate})`
			}
			
			if (options.showLinkPreview) {
				blurb += `\n${item.link}`;
			} else {
				blurb += ` (\nLink: \`${item.link}\`)`;
			}
			
			blurb += "\n";
			announceStr += blurb;
		} else {
			//console.log(`Item link ${item.link} was not new.`);
		}
	  });
	  
	  console.log(`RSS: Found ${newItems} new items while checking ${site}.`);
	  
	  if (newItems > 0) {
		  announceStr = `\`[RSS]\` New from **${site}** (${newItems} items):\n` + announceStr;
		  
		  // 2K char limit handling
		  if (announceStr.length > 1850) {
			announceStr = announceStr.slice(0, 1850);
			announceStr += "` ... [TRUNCATED] `";
		  }

		  if (overflow > 0) {
			  //announceStr += `... and also ${overflow} other items not listed.`;
		  }
		  rssConfig.sites[site].channels.forEach((chanId) => {
			BOT.channels.cache.get(chanId).send(announceStr);
		  });
	  }
	  feedStorage[site].last = latestFeed;
	  setTimeout(function() {sitePoller(site, BOT);}, rssConfig.sites[site].freq * 1000);
	})();	
}

module.exports = {
	init: function(BOT) {
		let sites = rssConfig.sites;
		for (let site in sites) {
			console.log(`-- rss.init(): Setting up "${site}"...`);
			feedStorage[site] = {"last":{}};
			let initDelay = sites[site].initDelay || 0;
			rssTimers[site] = setTimeout(function() {sitePoller(site, BOT);}, initDelay * 1000);
		}
	}
}