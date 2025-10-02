const mineflayer = require('mineflayer')

const server = process.env.BOT_SERVER || "127.0.0.1";
const port = parseInt(process.env.BOT_PORT, 10) || null;
console.log("Joining", `${server}:${port ?? 25565}`);

const bot = mineflayer.createBot({
	host: server,
	port: port,
	auth: "microsoft",
	profilesFolder: "profiles",
});

bot.once("spawn", ()=>console.log("Logged in!"));

bot.on('kicked', (reason, ...args) => {
	console.log("Kicked", reason, ...args);
	if (reason?.text == "Connection throttled! Please wait before reconnecting.") {
		console.log("Waiting 1 min");
		setTimeout(()=>{process.exit(1)}, 60000);
		return;
	}
	console.log("Waiting 3 mins");
	setTimeout(()=>{
		process.exit(1);
	}, 180000);
});
bot.on('error', console.error);

/*bot.on('chat', (username, message) => {
	console.log(`<${username}> ${message}`);
});*/
