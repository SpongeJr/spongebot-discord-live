var loot = {
		discountPercent: 40,
        boxes: {
			sports: {
				count: 7,
				price: 70,
				items: [
					{	emoji: ':soccer:',			rarity:	10,	value: 10,	},
					{	emoji: ':basketball:',		rarity:	10,	value: 10,	},
					{	emoji: ':football:',		rarity:	10,	value: 10,	},
					{	emoji: ':baseball:',		rarity:	10,	value: 10,	},
					{	emoji: ':tennis:',			rarity:	10,	value: 10,	},
					{	emoji: ':volleyball:',		rarity:	10,	value: 10,	},
					{	emoji: ':rugby_football:',	rarity:	10,	value: 10,	},
				],
				description: 'Play ball!'
			},
			math: {
				count: 20,
				price: 400,
				items: [
					{	emoji: ':one:',		rarity: 1, value: 1	},
					{	emoji: ':two:',		rarity: 2, value: 2	},
					{	emoji: ':three:',	rarity: 3, value: 3	},
					{	emoji: ':four:',	rarity: 4, value: 4	},
					{	emoji: ':five:',	rarity: 5, value: 5	},
					{	emoji: ':six:',		rarity: 6, value: 6	},
					{	emoji: ':seven:',	rarity: 7, value: 7	},
					{	emoji: ':eight:',	rarity: 8, value: 8	},
					{	emoji: ':nine:',	rarity: 9, value: 9	},
					{	emoji: ':zero:',	rarity: 0, value: 0	},
				],
				description: 'Did you finish your math homework?'
			},
			coolnew: {
				count: 2,
				price: 10000,
				items: [
					{	emoji: ':cool:',	rarity: 1, value: 0	},
					{	emoji: ':new:',		rarity: 1, value: 0	},
				],
				description: 'Feel :cool: and/or :new: with this seriously overpriced box!'
			},
            programmer: {
                count: 256,
                price: 2048,
                items: [
                    //127
                    {   emoji: ':desktop:',             rarity: 1, value: 256       },
                    {   emoji: ':computer:',            rarity: 2, value: 128       },
                    {   emoji: ':keyboard:',            rarity: 4, value: 64       },
                    {   emoji: ':mouse_three_button:',  rarity: 8,  value: 8       }, 
                    {   emoji: ':floppy_disk:',         rarity: 16,  value: 4       },
                    {   emoji: ':one:',                 rarity: 32,  value: 2       },
                    {   emoji: ':zero:',                rarity: 64, value: 1        },
                ],
                description: 'A programmer\'s standard toolbox.'
            },
            emojispam: {
                count:  36,
                price:  1500,
                items: [
                    {   emoji: ':thinking:',    rarity: 40, value: 200      },
                    {   emoji: ':clap:',        rarity: 60, value: 160      },
                    {   emoji: ':ok_hand:',     rarity: 80, value: 125      },
                    {   emoji: ':100:',         rarity: 100, value: 100     },
                    {   emoji: ':b:',           rarity: 120, value: 25      },
                    {   emoji: ':poop:',        rarity: 140, value: 1       },
                ],
                description: 'You\'re guaranteed to find at least one :poop: emoji in here.'
            },
            alphabet: {
                count:  26,
                price:  260,
                items: [
                    {   emoji: ':regional_indicator_a:',    rarity: 100, value: 50  },
                    {   emoji: ':regional_indicator_b:',    rarity: 100, value: 5   },
                    {   emoji: ':regional_indicator_c:',    rarity: 100, value: 5   },
                    {   emoji: ':regional_indicator_d:',    rarity: 100, value: 5   },
                    {   emoji: ':regional_indicator_e:',    rarity: 100, value: 50  },
                    {   emoji: ':regional_indicator_f:',    rarity: 100, value: 5   },
                    {   emoji: ':regional_indicator_g:',    rarity: 100, value: 5   },
                    {   emoji: ':regional_indicator_h:',    rarity: 100, value: 5   },
                    {   emoji: ':regional_indicator_i:',    rarity: 100, value: 50  },
                    {   emoji: ':regional_indicator_j:',    rarity: 100, value: 5   },
                    {   emoji: ':regional_indicator_k:',    rarity: 100, value: 5   },
                    {   emoji: ':regional_indicator_l:',    rarity: 100, value: 5   },
                    {   emoji: ':regional_indicator_m:',    rarity: 100, value: 5   },
                    {   emoji: ':regional_indicator_n:',    rarity: 100, value: 5   },
                    {   emoji: ':regional_indicator_o:',    rarity: 100, value: 50  },
                    {   emoji: ':regional_indicator_p:',    rarity: 100, value: 5   },
                    {   emoji: ':regional_indicator_q:',    rarity: 100, value: 5   },
                    {   emoji: ':regional_indicator_r:',    rarity: 100, value: 5   },
                    {   emoji: ':regional_indicator_s:',    rarity: 100, value: 5   },
                    {   emoji: ':regional_indicator_t:',    rarity: 100, value: 5   },
                    {   emoji: ':regional_indicator_u:',    rarity: 100, value: 50  },
                    {   emoji: ':regional_indicator_v:',    rarity: 100, value: 5   },
                    {   emoji: ':regional_indicator_w:',    rarity: 100, value: 5   },
                    {   emoji: ':regional_indicator_x:',    rarity: 5, value: 1000  },
                    {   emoji: ':regional_indicator_z:',    rarity: 50, value: 100  },
                ],
                description: '***D o   y o u   k n o w   y o u r   A B C s ?***'
            }
        }
    };
	
spongeBot.loot = {
		disabled: false,
		access: false,
		timedCmd: {
			howOften: cons.ONE_HOUR,
			gracePeriod: 60000,
			failResponse: '`!loot` boxes take about an hour to recharge. ' +
			' You still have about <<next>> to wait. :watch:'
		},
        cmdGroup: 'Fun and Games',
        do: function(message, args) {
			
			// should be handled by standard .access check
			// custom message is cool though, we should add that
			/*
			if ((message.author.id !== SPONGE_ID) && (message.author.id !== ARCH_ID)) {
				utils.chSend(' You must develop your shtyle further before using loot boxes!');
				return;
			} else */
			if (args === '') {
                utils.chSend(message, 'Try `!loot unbox <name>`, `!loot boxes`, `!loot box <name>`.');
                return;
            }

            args = args.toLowerCase();
            args = args.split(' ');
           	
			if (args[0] === 'boxes' && args[1] === 'suck') {
				utils.chSend(message, 'But you gotta admit that they are *really* lucrative');
				return;
			}
			
            var action = args[0] || '';
            if (action === 'unbox') {
                var who = message.author.id;
 
                if (!bankroll[who].credits) {
                    utils.chSend(message, message.author + ', please open a `!bank` account before unboxing loot.');
                    return;
                }
                var boxName = args[1] || '';
 
                if (boxName === '') {
					utils.chSend(message, message.author + ', what do you want to unbox?');
					return;
				} else if (boxName === 'nothing') {
                    utils.chSend(message, message.author + ', you can\'t unbox nothing.');
                    return;
                } else if (boxName === 'it') {
			   		utils.chSend(message, message.author + ', do it yourself!');
					return;
			   	} else if (boxName === 'yourself') {
					utils.chSend(message, message.author + ', okay then. ');
					utils.chSend(message, '*pelts ' + message.author + ' with a barrage of wrenches, screwdrivers, cogs, nails, washers, and other machine parts.*');
					return;
				} else if (boxName === 'me') {
					utils.chSend(message, message.author + ', that would be extremely painful for you.');
					return;
				} else if (boxName === 'everything') {
					utils.chSend(message, message.author + ', that\'s impossible.');
					return;
				} else if (args[1] === 'the' && args[2] === 'pod' && args[3] === 'bay' && args[4] === 'doors') {
					utils.chSend(message, 'I\'m sorry, ' + message.author + '. I\'m afraid I can\'t do that');
					return;
				}               
                var found = false;
                for (var box in loot.boxes) {
                    if (boxName === box) {
                        found = true;
                        var price = loot.boxes[box].price;
						var discountPercent = loot.discountPercent || 0;
						/*
						utils.chSend(message, 'unboxing a ' + box);
						utils.chSend(message, 'bankroll[who] is ' + bankroll[who] + '   and price is ' + price);
						*/
						
                        if (bankroll[who].credits >= price) {
							
							if (!utils.collectTimer(message, message.author.id, 'loot', spongeBot.loot.timedCmd, gameStats)) {
								return false; // can't unbox yet!
							}	
							
							if (discountPercent > 0) {
								utils.chSend(message, message.author + ' just purchased the ' + box + ' box for ' + price * (1 - discountPercent / 100) + ' credits,' +
								  ' and got a great deal since loot boxes are ' + discountPercent + '% off right now!');
							} else {
								utils.chSend(message, message.author + ' just purchased the ' + box + ' box for ' + price + ' credits.');
							}
							
                            utils.addBank(who, -price * ( 1 - discountPercent / 100), bankroll);
                           
                            //Accumulate total rarity value
                            var totalRarity = 0;                //The total combined rarity of all items, used for choosing items
                            var boxEntry = loot.boxes[box];     //The entry of the box, including the count, price, and item array
                            var itemTable = boxEntry.items; //The item array in the box entry
                            for (var itemIndex = 0; itemIndex < itemTable.length; itemIndex++) {
                                totalRarity += itemTable[itemIndex].rarity;
                            }
                           
                            var dropCount = boxEntry.count;         //The total number of items that the box will drop
                            var drops = [];                         //Indexes correspond to itemTable. The number of drops for each item
                            //Initialize to 0
                            for (var i = 0; i < itemTable.length; i++) {
                                drops[i] = 0;
                            }
                           
                            //Accumulate drops
                            for (var i = 0; i < dropCount; i++) {
                               
                                var rarityRoll = Math.random() * totalRarity;
                                //Iterate through each item entry and decrement the rarityRoll until we hit zero. Then we stop at our current item and add it to the drops.
                                for (var itemIndex = 0; itemIndex < itemTable.length; itemIndex++) {
                                    var item = itemTable[itemIndex];    //The item entry at the index
                                    rarityRoll = rarityRoll - item.rarity;
                                    //Stop here
                                    if (rarityRoll <= 0) {
                                        drops[itemIndex]++;
										break;
                                    }
                                }
                            }
                            var resultMessage = message.author + " found...";
                            //Accumulate value and print out results
                            var valueTotal = 0;
                            for (var itemIndex = 0; itemIndex < itemTable.length; itemIndex++) {
                                var count = drops[itemIndex];
                                var item = itemTable[itemIndex];
                                valueTotal += item.value * count;
                                if (count > 0) {
                                    resultMessage += '\nx' + count + ' ' + item.emoji;
                                }
                            }
                            resultMessage += '\nTotal Value: ' + valueTotal;
                            utils.addBank(who, valueTotal, bankroll);
                            utils.chSend(message, resultMessage);
                        } else {
                            utils.chSend(message, message.author + ' you can\'t afford the ' + box + ' box.');
                        }
                        return;
                    }
                }
               
                if (!found) {
                    utils.chSend(message, message.author + ', you can\'t unbox something that doesn\'t exist.');
                }
            } else if (action === 'boxes') {
				var reply = message.author + ', here are the loot boxes that I have in stock: ';
				for (var box in loot.boxes) {
					reply += '`' + box + '`, ';
				}
				utils.chSend(message, reply);
			} else if(action === 'box') {
				var boxName = args[1] || '';
				if(boxName === '') {
					utils.chSend(message, message.author + ', which loot box would you like to learn more about?');
					return;
				}
				for(var box in loot.boxes) {
					if(box === boxName) {
						var boxEntry = loot.boxes[box];
						var desc = 'The ' + box + ' box.';
						desc += '\nDescription: ' + boxEntry.description;
						desc += '\nPrice: ' + boxEntry.price + ' credits';
						desc += '\nContains ' + boxEntry.count + ' items from the following selection.';

						//List out the items
						var itemTable = boxEntry.items;
						for (var itemIndex = 0; itemIndex < itemTable.length; itemIndex++) {
							var itemEntry = itemTable[itemIndex];
							desc += '\n' + itemEntry.emoji + ' (chance: ' + itemEntry.rarity + '; value: ' + itemEntry.value + ')';
						}
						utils.chSend(message, desc);
						return;
					}
				}
				utils.chSend(message, utils.makeTag(message.author.id) + ', unknown loot box');
			}
           
        },
        help: '`!loot`: Buy a loot box and see what\'s inside!',
		longHelp: 'Try `!loot unbox <name>`, `!loot boxes`, `loot box <name>`, etc.'
    };
	