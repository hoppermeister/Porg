// Description
//   UCF Garage Occupancy Reporter
//
// Commands:
//   garage - Displays percentage full of each garage in UCF
//	where should I park? - Responds with the most open garage
//	how full is garage <garage name> - Responds with the percent full of the queried garage




module.exports = function(robot) {
	const request = require('request');
	const cheerio = require('cheerio');


	robot.respond(/(how full is garage)\s([a-zA-Z]+)\??/i, msg =>
		getGarages(garages =>
			(() => {
				const result = [];
				for (let garage of Array.from(garages)) {
					if (garage.garage.toLowerCase() === msg.match[2].toLowerCase()) {
						result.push(msg.send(`Garage ${garage.garage} is ${garage.perc}% full`));
					} else {
						result.push(undefined);
					}
				}
				return result;
			})()
		)
	);

	robot.respond(/garage$/i, msg=>
		getGarages(function(garages, pubsub) {
			let response = "";
			let smallest = 100;
			for (let garage of Array.from(garages)) {
				if ((garage.perc < smallest) && (garage.garage !== 'Libra')) {
					smallest = garage.perc;
				}
				response += `Garage ${garage.garage} ${garage.perc}%\n`;
			}
			if (smallest > 90) {
				response += "http://i.imgur.com/OXlUFE1.jpg\n";
			}
			if (pubsub) {
				response += "<www.arepublixchickentendersubsonsale.com | But hey, <Chicken Tender Subs are on sale!>";
			}

			return msg.send(response);
		})
	);
	
	robot.respond(/garage vt/i, msg=> msg.send("https://i.imgur.com/oOXDJDU.jpg"));	
	
	robot.respond(/garage villanova/i, msg=> msg.send("uh i was going to put a picture of a sad wildcat but all I found was furry stuff, sorry Carolyn!"));	
		
	robot.respond(/garage canada/i, msg=> msg.send("https://thecord.ca/wp-content/uploads/2015/11/Canadian-stereotypes-Jessica-Wood.jpg"));
	
	robot.respond(/where should I park?/i, msg=>		
		getGarages(function(garages) {
			const smallestGarage = {garage: "THEY'RE ALL FULL", perc: 100};
			for (let garage of Array.from(garages)) {
				if (garage.perc < smallestGarage.perc) {
					smallestGarage.garage = garage.garage;
					smallestGarage.perc = garage.perc;
				}
			}
			return msg.send(`The most open garage is ${smallestGarage.garage} which is ${smallestGarage.perc}% full.`);
		})
	);

	return getGarages = function(callback) {
		const r = request('https://secure.parking.ucf.edu/GarageCount/iframe.aspx/', function(error, response, body) {	
			const garages = [];
			let pubsub = false;
			let $ = cheerio.load(body);
			$('.dxgvDataRow_DevEx').each(function(i, obj) {
				const thisGarage = {};
				const html = $(obj).html().replace(RegExp(' ', 'g'), '').split('\n');
				for (let line of Array.from(html)) {
					if (line.startsWith("percent:")) {
						const percent = parseInt(line.replace("percent:", ''));
						thisGarage.perc = percent;
					}
				}
				thisGarage.garage = ($(obj).find('.dxgv').html()).replace("Garage ", '');
				return garages[i] = thisGarage;
			});
			
			if (robot.brain.get('pubsubCheckDate') !== (new Date()).toDateString()) {
				let r2;
				robot.brain.set('pubsubCheckDate', (new Date()).toDateString());
				return r2 = request('http://www.arepublixchickentendersubsonsale.com/', function(error2, response2, body2) {
					$ = cheerio.load(body2);
					if ($.html().includes("onsale:yes")) {
						robot.brain.set('pubsub', 'true');
						pubsub = true;
					} else {
						pubsub = false;
					}
					callback(garages, pubsub);
					return null;
				});
			} else {
				if (robot.brain.get('pubsub') === 'true') {
					pubsub = true;
				}
				return callback(garages, pubsub);
			}
		});
		return null;
	};
};