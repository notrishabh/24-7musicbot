const Discord = require('discord.js');
//const {
//	prefix,
//	token,
//} = require('./config.json');
require('dotenv').config();
const prefix = process.env.PREFIX;
const token = process.env.TOKEN;
const ytdl = require('ytdl-core');
const {getInfo} = require('ytdl-getinfo')

const client = new Discord.Client();
const queue = new Map();


client.once('ready', () =>{
	console.log('lol working');
});

client.on('message', async message => {
	if(message.author.bot || !message.content.startsWith(prefix))return;
	if (message.content.startsWith(prefix)){
		const serverQueue = queue.get(message.guild.id);

		if (message.content.startsWith(`${prefix}play`) || message.content.startsWith(`${prefix}p`)) {
		    execute(message, serverQueue);
		    return;
		} else if (message.content.startsWith(`${prefix}skip`)) {
		    skip(message, serverQueue);
		    return;
		} else if (message.content.startsWith(`${prefix}stop`)) {
		    stop(message, serverQueue);
		    return;
		} else {
		    message.channel.send("You need to enter a valid command!");
		}

	}else{
		return;
	}
});

async function execute(message, serverQueue){
	const args = message.content.split(" ");
	let str = "";
	for(let i=1; i<args.length; i++){
		str += args[i] + " ";
	}
	const voiceChannel = message.member.voice.channel;
	if(!voiceChannel){
		return message.channel.send("Join a voice channel");
	}
	const perms = voiceChannel.permissionsFor(message.client.user);
	if(!perms.has("CONNECT") || !perms.has("SPEAK")){
		return message.channel.send("No perms to speak");
	}
	const songInfo = await getInfo(str);
	const bong = await ytdl.getInfo(songInfo.items[0].id);
	console.log(songInfo.items[0].title);
	const song = {
		title : songInfo.items[0].title,
		url :	bong.videoDetails.video_url 
	};
	if(!serverQueue){
		// Creating the contract for our queue
			const queueContruct = {
			 textChannel: message.channel,
			 voiceChannel: voiceChannel,
			 connection: null,
			 songs: [],
			 volume: 5,
			 playing: true,
			};
			// Setting the queue using our contract
			queue.set(message.guild.id, queueContruct);
			// Pushing the song to our songs array
			queueContruct.songs.push(song);
			
			try {
			 // Here we try to join the voicechat and save our connection into our object.
			 var connection = await voiceChannel.join();
			 queueContruct.connection = connection;
			 // Calling the play function to start a song
			 play(message.guild, queueContruct.songs[0]);
			} catch (err) {
			 // Printing the error message if the bot fails to join the voicechat
			 console.log(err);
			 queue.delete(message.guild.id);
			 return message.channel.send(err);
			}
	}else{
		serverQueue.songs.push(song);
		console.log(serverQueue.songs);
 		return message.channel.send(`${song.title} has been added to the queue!`);
	}
}

function skip(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "You have to be in a voice channel to stop the music!"
    );
  if (!serverQueue)
    return message.channel.send("There is no song that I could skip!");
  serverQueue.connection.dispatcher.end();
}

function stop(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "You have to be in a voice channel to stop the music!"
    );
    
  if (!serverQueue)
    return message.channel.send("There is no song that I could stop!");
    
  serverQueue.songs = [];
  serverQueue.connection.dispatcher.end();
}
function play(guild, song) {
  const serverQueue = queue.get(guild.id);
  if (!song) {
    serverQueue.voiceChannel.leave();
    queue.delete(guild.id);
    return;
  }
  const dispatcher = serverQueue.connection
    .play(ytdl(song.url))
    .on("finish", () => {
      serverQueue.songs.shift();
      play(guild, serverQueue.songs[0]);
    })
    .on("error", error => console.error(error));
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
  serverQueue.textChannel.send(`Start playing: **${song.title}**`);
}


client.login(token);
