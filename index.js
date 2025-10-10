const mineflayer = require('mineflayer');
const app = require('express')();
const fs = require('fs');
const { EventEmitter } = require('stream');

const appPort = process.env.APP_PORT || 3000;
const server = process.env.BOT_SERVER || "127.0.0.1";
const port = parseInt(process.env.BOT_PORT, 10) || null;

let globalBot = createBot();
const botUpEvent = new EventEmitter();
let loadedAt = 0;

function createBot() {
	let isRestarting = false;
	function restartBot(timeToWait) {
		if (isRestarting) return;
		isRestarting = true;
		console.log("Restarting bot in", timeToWait / 1000, "seconds");
		setTimeout(() => {
			globalBot = createBot();
		}, timeToWait);
	}
	console.log("Joining", `${server}:${port ?? 25565}`);

	const bot = mineflayer.createBot({
		host: server,
		port: port,
		auth: "microsoft",
		profilesFolder: "profiles",
	});

	bot.once("spawn", () => {
		console.log("Logged in!");
		botUpEvent.emit('botUp');
		loadedAt = Date.now();
	});

	bot.on('kicked', (reason, ...args) => {
		console.log("Kicked", reason, ...args);
		if (reason?.text == "Connection throttled! Please wait before reconnecting.") {
			restartBot(60000);
			return;
		}
		restartBot(180000);
	});
	bot.on('error', error => {
		console.log("Error occured", error);
	});

	bot.on('end', (reason) => {
		if (reason === 'manual-reload-request') {
			console.log("Manual bot reload requested");
			restartBot(3000);
			return;
		}
		console.log("Bot is dead:", reason);
		restartBot(60000);
	});

	return bot;
}

function cubes(amount, color) {
	let text = `<div class="cubes">`;
	for (let i = 0; i < 10; i++) {
		if (amount >= 1) {
			text += `<div class="cube cube--${color}"></div>`;
		} else if (amount > 0) {
			text += `<div class="cube cube--${color} cube--half"></div>`;
			text += `<div class="cube cube--half"></div>`;
		} else {
			text += `<div class="cube"></div>`;
		}
		amount--;
	}
	text += "</div>";
	text += `<div class='mono'>${String((amount + 10) * 2).padStart(2, '0')}/20</div>`;
	return text;
}

app.get('/', (req, res) => {
	const keymap = {
		USERNAME: globalBot._client.username || 'Отключен',
		SERVER_IP: `${server}:${port ?? 25565}`,
		VERSION: globalBot.version || 'Загрузка...',
		PING: globalBot.player?.ping || 0,
		FOOD: cubes((globalBot.food / 2) || 0, 'brown'),
		HEALTH: cubes((globalBot.health / 2) || 0, 'red'),
		LOADED_AT: loadedAt ? new Date(loadedAt).toLocaleString('ru') : '---',
	}
	let indexHtml = fs.readFileSync('index.html', 'utf8');
	indexHtml.match(/{{(.*?)}}/g).forEach(match => {
		const key = match.slice(2, -2);
		indexHtml = indexHtml.replace(match, keymap[key]);
	});
	res.send(indexHtml);
});

app.post('/reload', async (req, res) => {
	globalBot.end('manual-reload-request');
	botUpEvent.on('botUp', () => {
		res.send('Reloaded');
	});
});

app.listen(appPort, () => console.log(`App listening on port ${appPort}`));