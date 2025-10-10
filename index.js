const mineflayer = require('mineflayer');
const app = require('express')();
const fs = require('fs');
const { EventEmitter } = require('stream');

const appPort = process.env.APP_PORT || 3000;
const server = process.env.BOT_SERVER || "127.0.0.1";
const port = parseInt(process.env.BOT_PORT, 10) || null;

let botStatus = "Инициализация...";
let loadedAt = 0;
let globalBot = createBot();
const botUpEvent = new EventEmitter();

function createBot() {
	let isRestarting = false;
	function restartBot(timeToWait) {
		if (isRestarting) return;
		loadedAt = 0;
		isRestarting = true;
		console.log("Restarting bot in", timeToWait / 1000, "seconds");
		setTimeout(() => {
			globalBot = createBot();
		}, timeToWait);
	}
	loadedAt = 0;
	console.log("Joining", `${server}:${port ?? 25565}`);
	botStatus = "Подключение...";

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
		botStatus = "Подключен";
	});

	bot.on('kicked', (reason, ...args) => {
		console.log("Kicked", reason, ...args);
		botStatus = "Кикнут";
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
			botStatus = "Перезагрузка...";
			console.log("Manual bot reload requested");
			restartBot(3000);
			return;
		}
		botStatus = "Бот погиб, скоро перезагрузится...";
		console.log("Bot is dead:", reason);
		restartBot(60000);
	});

	return bot;
}

app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));

app.post('/reload', async (req, res) => {
	globalBot.end('manual-reload-request');
	botUpEvent.once('botUp', () => {
		res.send('Reloaded');
	});
});

app.get('/status', async (req, res) => {
	res.send({
		username: globalBot._client.username || 'Отключен',
		serverIp: `${server}:${port ?? 25565}`,
		version: globalBot.version || 'Загрузка...',
		ping: globalBot.player?.ping || 0,
		food: globalBot.food || 0,
		health: globalBot.health || 0,
		loadedAt: loadedAt ? new Date(loadedAt).toLocaleString('ru') : '---',
		status: botStatus,
	});
});

app.listen(appPort, () => console.log(`App listening on port ${appPort}`));