
const discord = require("discord.js"); // thanks @hydrabolt
const coinmarketcap = require('./coinmarketcap-fetch.js'); // github.com/n3onis/coinmarketcap-fetch
const auth = require('./auth.json');

const client = new discord.Client();

const cmc = new coinmarketcap();
var prefix = ';';

client.on('ready', () => {
  console.log( `Logged in as ${client.user.tag}!` );
  setInterval(updateStatus, 120000); // update status every 2 minutes
});

client.on('message', msg => {
  	if ( msg.content.substring(0, 1) == prefix ) {
        var args = msg.content.substring(1).split(' ');
        var cmd = args[0];
        console.log(`Requested '${cmd}'. (${msg.guild.name}#${msg.channel.name} - ${msg.guild.id})`);
       
        args = args.splice(1);
        switch(cmd) {

            case 'help':

                msg.channel.send('**List of commands**\n```help - display list of commands\nprefix [prefix] - change prefix\nprice [coin] - display current price\ntop [#] - display top # coins\ncoin [coin] - display coin\'s info\nconvert [#] [coin1] [coin2] - convert # of coin1 to coin2\nglobal - view global market info```');

            break;

        	case 'prefix':

                // if( args[0] == undefined || args[0].length != 1 ) {
                //     msg.channel.send( `Usage: \`${prefix}prefix []\`.` );

                // } else {
                //     prefix = args[0];
                //     msg.channel.send( `Prefix changed to \`${prefix}\`.` );
                // }
                msg.channel.send( `Command temporarily disabled due to a bug.` );

            break;

            case 'price':

            	if(args[0]) {
	                cmc.get( args[0], 'USD', coin => {
	                	if(coin) {
	                		var price_usd = coin['quotes']['USD']['price'];
	                		msg.channel.send( `${coin['symbol']} price: $${price_usd}` );
	                	} else {
	                		msg.channel.send( 'Not found.' );
	                	}
	                });
            	} else {
            		msg.channel.send('Undefined symbol.');
            	}
                
            break;

            case 'top':

                if( !args[0] ) {
                    args[0] = 10;
                }
                
                var chunk = '';
                cmc.getall( 'USD', coins => {
                	for( var i = 0; i < args[0]; i++ ) {
                		chunk += `${i+1}. **${coins[i]['name']}** - $${coins[i]['quotes']['USD']['price']}    **Δ** *${coins[i]['quotes']['USD']['percent_change_24h']}%*\n`;
                	}

                	msg.channel.send({
	                	embed: {
	                		color: 3447003,
	                		fields: [
	                			{
	                				name: `Top ${args[0]} coins`,
	                				value: chunk,
	                				inline: true
	                			},
	                		],
	                	},
                	});
                });

            break;

            case 'coin':

            if(args[0]) {

                cmc.get('eth', 'BTC', ethereum => {
                var price_eth_btc = ethereum['quotes']['BTC']['price'];

            	cmc.get(args[0], 'BTC', coin => {

                    if(coin) {
                        var name = coin['name'];
                        var rank = coin['rank'];
                        var price_usd = `$${coin['quotes']['USD']['price']}`;
                        var price_btc = `${coin['quotes']['BTC']['price']} BTC`;
                        var price_eth = `${Math.round(coin['quotes']['BTC']['price'] / price_eth_btc * 100000000) / 100000000} ETH`;
                        var volume = `$${numberFormat(coin['quotes']['USD']['volume_24h'])}`;
                        var m_cap = `$${numberFormat(coin['quotes']['USD']['market_cap'])}`;
                        var avail_supply = numberFormat(coin['circulating_supply']);
                        var total_supply = numberFormat(coin['total_supply']);
                        var max_supply = numberFormat(coin['max_supply']);
                        var change_1h = `${coin['quotes']['USD']['percent_change_1h']}%`;
                        var change_24h = `${coin['quotes']['USD']['percent_change_24h']}%`;
                        var change_7d = `${coin['quotes']['USD']['percent_change_7d']}%`;

                        if(max_supply == null || max_supply == 0) {
                            max_supply = '--';
                        }

                        var chunk = `**Rank**: ${rank} \n\n**Price USD**: ${price_usd} \n**Price BTC**: ${price_btc} \n**Price ETH**: ${price_eth} \n\n**Volume 24h**: ${volume} \n**Market Cap**: ${m_cap} \n**Available Supply**: ${avail_supply} \n**Total Supply**: ${total_supply} \n**Maximum Supply**: ${max_supply} \n\n**Change 1h**: ${change_1h} \n**Change 24h**: ${change_24h} \n**Change 7d**: ${change_7d}`;

                        msg.channel.send({
                            embed: {
                                color: 3447003,
                                thumbnail: {
                                    url: `https://files.coinmarketcap.com/static/img/coins/32x32/${coin['id']}.png`
                                },
                                fields: [
                                    {
                                        name: coin['name'],
                                        value: chunk,
                                        inline: true
                                    },
                                ],
                                footer: {
                                    text: `Last updated: ${timeConverter(coin['last_updated'])}`
                                }
                            },
                        });

                        } else {
                            msg.channel.send('Not found.');
                        }
                    });
                });

                } else {
                	msg.channel.send('Undefined.');
                }

            break;

            case 'convert':

            if(args[0] && args[1] && args[2]) {

            	var from, to, from_symbol, to_symbol;

            	cmc.get(args[1], 'BTC', _from => {
            		if(_from) {
            			from_symbol = _from['symbol'];
            			from = _from['quotes']['BTC']['price'];
            			cmc.get(args[2], 'BTC', _to => {
		            		if(_to) {
		            			to_symbol = _to['symbol'];
		            			to = _to['quotes']['BTC']['price_btc'];
		            		} else {
		            			msg.channel.send('Not found.');
		            		}

		            		var conversion = args[0] * from / to;
		            		msg.channel.send(`${args[0]} ${from_symbol} = ${conversion} ${to_symbol}`);
	            		});
            		} else {
            			msg.channel.send('Not found.');
            		}
            	});

            	

            } else {
            	msg.channel.send('Undefined.');
            }

            break;

            case 'global':
                cmc.getglobal( data => {
                    var total_market_cap = data['quotes']['USD']['total_market_cap'];
                    var total_24h_volume_usd = data['quotes']['USD']['total_volume_24h'];
                    var bitcoin_percentage_of_market_cap = data['bitcoin_percentage_of_market_cap'];
                    var active_currencies = data['active_cryptocurrencies'];
                    var active_markets = data['active_markets'];
                    var last_updated = data['last_updated'];

                    var chunk = `**Total market cap**: $${numberFormat(total_market_cap)} \n\n**Total 24h volume**: $${numberFormat(total_24h_volume_usd)} \n**Bitcoin dominance**: ${bitcoin_percentage_of_market_cap}% \n**Active currencies**: ${active_currencies} \n**Active markets**: ${active_markets}`;

                    msg.channel.send({
                        embed: {
                            color: 3447003,
                            fields: [
                                {
                                    name: 'Global market',
                                    value: chunk,
                                    inline: true
                                },
                            ],
                            footer: {
                                text: `Last updated: ${timeConverter(last_updated)}`
                            }
                        }
                    });
                });
            break;

		}
	}
});

client.login(auth.token);
