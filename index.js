const mineflayer = require('mineflayer')

// const test = process.argv[2] ? process.argv[2] == "test" : true;
const test = false;
console.log("Joining", test ? "test" : "spworlds");

const bot = mineflayer.createBot({
	host: test ? "51.83.49.23" : "sp.spworlds.ru",
	port: test ? 25629 : null,
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
