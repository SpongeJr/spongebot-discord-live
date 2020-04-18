const cons = require("../lib/constants.js");
const utils = require("../lib/utils.js");
const fallbackLanguage = "en"; // this should ALWAYS have strings

const stringList = require("../i18n/strings/strings.json");
// outStr += (speed / 1000).toFixed(1) + ' seconds and wins ';
// outStr +=  `${award} credits! ( ${baseAward} x ~${multiplier.toFixed(2)} speed multiplier )`;
// outStr += '\n The word was: ' + theWord;

const supportedLanguages = {
	"en": "English",
	"es": "español",
	"zh-Hans": "Chinese simplified"
};

const stringFetch = function(stringId, language, substitutions) {
	// userLang = utils.getStat(who, "i18n", "language", gameStats);
	// outP += i18n.st("bank1", userLang, subsitutions[]); //string as first arg means use global
	// outP += i18n.st(["scram", "unscrambleThis"], userLang, substitutions[]) // array means use sub-list
	// makes a lot of dangerous assumptions for now

	let resultArr;
	let result = "";

	if (Array.isArray(stringId)) {
		let sublist = stringId[0];
		let strId = stringId[1];

		if (!stringList.hasOwnProperty(sublist)) {
			console.log(`stringFetch(): sublist "${sublist}" is undefined!`)
			return `stringFetch(): sublist "${sublist}" is undefined!`;
		}
		if (!stringList[sublist].hasOwnProperty(strId)) {
			console.log(`stringFetch(): string "${strId}" of "${sublist}" is undefined!`);
			return `stringFetch(): string "${strId}" of "${sublist}" is undefined!`;
		}
		resultArr = stringList[sublist][strId][language]; // assumes it exists!
		if (!resultArr) {
			// apparently no translation exists for this language, so
			// revert to fallbackLanguage which should always give a proper array
			/* console.log(`stringFetch(): No ${language} translation for string ${strId} of sublist ${sublist}`);
			console.log(`stringFetch(): Using fallback translation ${fallbackLanguage}`);
			*/
			resultArr = stringList[sublist][strId][fallbackLanguage];
		}
	} else {
		// for now just assume it must be string
		// so, use the "global list"
		if (!stringId) {
			console.log("stringFetch(): WARNING! stringId is undefined!");
			return "stringFetch(): WARNING! stringId is undefined!";
		}
		if (!stringList.global.hasOwnProperty(stringId)) {
			console.log(`stringFetch(): global string "${stringId}" is undefined!`);
			return `stringFetch(): string "${stringId}" of "${sublist}" is undefined!`;
		}
		resultArr = stringList.global[stringId][language]; // assumes keys exist
		if (!resultArr) {
			// apparently no translation exists for this language, so
			// revert to fallbackLanguage which should always give a proper array
			console.log(`stringFetch(): No ${language} translation for global string ${stringId}`);
			console.log(`stringFetch(): Using fallback translation ${fallbackLanguage}`);
			resultArr = stringList.global[stringId][fallbackLanguage];
		}
	}

	for (let stringSnip of resultArr) {
		// if it's a string, just use it
		// if it's a number, do a substitution from the provided array
		// assumes it's a number if not string

		if (typeof stringSnip === "string") {
			result += stringSnip;
		} else {
			if (Array.isArray(substitutions)) {
				result += substitutions[stringSnip]
			} else {
				console.log(`stringFetch(): WARNING! substitutions was not an array for string ${stringId}!`);
				result += "?ERROR?";
			}
		}
	}
	return result;
};

module.exports = {
	languages: supportedLanguages,
	init: function(BOT) {
		console.log("-- i18n.init(): Finished doing nothing.");
	},
	st: stringFetch,
	commands: {
		setlang: {
			subCmd: {},
			help: "Sets your language.",
			longHelp: "Try `!setlang en` or `!setlang es`.",
			do: function(message, args, gameStats, gbl) {
				let who = message.author.id;
				let userLang = utils.getStat(who, "i18n", "language", gameStats);
				let outStr = "";
				let langChoice = args[0];
				let newLang;

				// TODO: refactor this later into a "!lang list" (and "!lang set <language>")
				if (args[0] === "list") {
					outStr += stringFetch("langList", userLang);
					for (let isoCode in supportedLanguages) {
						outStr += `\`\n${isoCode}\`: ${supportedLanguages[isoCode]}`;
					}
					utils.chSend(message, outStr);
					return;
				}

				// we'll do this with better style later
				// see if it's a valid language
				if (!supportedLanguages.hasOwnProperty(args[0])) {
					outStr += stringFetch("noSuchLang", userLang);
					utils.chSend(message, outStr);
					return;
				}
				newLang = supportedLanguages[langChoice];
				utils.setStat(who, "i18n", "language", langChoice, gameStats);
				outStr += stringFetch("newLangSet", userLang, [newLang]);
				//outStr += `Language is now: ${langChoice}`;
				utils.chSend(message, outStr);
			}
		}
	}
};
