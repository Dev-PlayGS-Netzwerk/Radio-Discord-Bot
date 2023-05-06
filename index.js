const { Client, Intents, MessageEmbed , version  } = require('discord.js');
const voiceDiscord = require(`@discordjs/voice`)
const client = new Client({ intents: [
    Intents.FLAGS.GUILDS,
	Intents.FLAGS.GUILD_MESSAGES,
	Intents.FLAGS.GUILD_MEMBERS,
	Intents.FLAGS.GUILD_VOICE_STATES,] });
const {token , prefix,ownerid } = require('./botconfig/config.json');
const { Database } = require('beta.db');
const db = new Database("./db/role.json")
const radio = require(`./botconfig/radiostation.json`)

client.once("ready", () =>{
    console.log(`Eingeloggt als ${client.user.tag}`)
    client.user.setActivity('Radio Station', { type: 'LISTENING' }); //Sie können den Typ ändern in : LISTENING , COMPETING , PLAYING 
})

client.on("messageCreate", message =>{
    if (!message.content.startsWith(prefix) || message.author.bot) return;

	const args = message.content.slice(prefix.length).trim().split(' ');
	const command = args.shift().toLowerCase();
    
    //help menu 
    if(command === "help"){
        const helpembed = new MessageEmbed()
        .setTitle("📻 Help menu")
        .addFields(
            { name: `${prefix}radio`, value: 'play radio ', inline: true  },
            { name: `${prefix}radiolist`, value: 'Liste der beliebtesten Radiosender', inline: true },
            { name: `${prefix}stats`, value: 'Statistiken von BOT', inline: true },
            { name: `${prefix}setrole`, value: 'Legen Sie die Rolle auf Control Bot fest', inline: true },
            { name: `${prefix}reset`, value: 'Bot neu starten', inline: true },
            { name: `${prefix}dc`, value: 'Bot trennen', inline: true },
        )
        .setThumbnail(`https://imgur.com/a/B3BjXfk`)
        .setFooter(`Angefordert von ${message.author.username}` , message.author.displayAvatarURL({ format: 'png', dynamic: true }))
        .setColor('GREEN')
        .setTimestamp()
        message.reply({embeds :[helpembed]})
    }

    // Radioliste: Sie können Radio-ID auswählen und abspielen
    if(command == `radiolist`){
        const fs = require("fs")
       fs.readFile('./botconfig/radioid.json', 'utf8', function(err, contents) {
            const radioidembed = new MessageEmbed()
          .setTitle("Radio-ID-Liste")
          .setDescription('```json\n' + contents + '\n```')
          .setFooter(`Angefordert von ${message.author.username}` , message.author.displayAvatarURL({ format: 'png', dynamic: true }))
          .setColor('GREEN')
          .setTimestamp()
          message.reply({embeds : [radioidembed]})
        })
      
    }

    //Legen Sie die Rolle für einige CMD S fest
 if(command == "setrole"){
	  if (message.author.id !== `${ownerid}`) return message.reply(`:x: **Sie haben keine Berechtigung, diesen Befehl zu verwenden!** `);
        if(!args[0]) return message.reply(`:x: **Sie haben vergessen, eine Rollen-ID einzugeben!**`)
        db.set("role" , args[0])
        db.set("Guildid" , message.guild.id)
        message.reply(`✅**Rolle wurde festgelegt**`)
    }

    //radio player
    if(command == "radio"){
        const role = db.get('role')
        if(message.author.id !== ownerid && !message.member.roles.cache.has(role))return message.reply(`:x: **Sie haben keine Berechtigung, diesen Befehl zu verwenden! , Sie benötigen <@&${role}> Rolle**`)
    if (!args[0]) return message.reply(":x: **Sie haben vergessen, eine Voice-Channel-ID einzugeben!** \n **Usage** : ``!radio [voiceid] [radioid]`` \n **e.g** : ``!radio 879417192553271367 2``")
    if (!args[1]) return message.reply(":x: **Sie haben vergessen, eine Radio-ID einzugeben!** \n **Usage** : ``!radio [voiceid] [radioid]`` \n **e.g** : ``!radio 879417192553271367 2``")
        const connection = voiceDiscord.joinVoiceChannel({
            channelId: args[0],
            guildId: message.guild.id,
            adapterCreator: message.guild.voiceAdapterCreator,
            selfDeaf: true,
        });
        const player = voiceDiscord.createAudioPlayer();
        const resource = voiceDiscord.createAudioResource(radio[args[1]]);
       
        player.play(resource);
       connection.subscribe(player);
       player.on(voiceDiscord.AudioPlayerStatus.Idle, () => {
        connection.destroy();
        message.reply(`:x:**Radiosender wurde zerstört!**`)
    });
    message.reply(`📻**Radio gestartet**`)
    }

    //restart bot 
   if(command == `reset`){
    if (message.author.id !== `${ownerid}`) return message.reply(`:x: **Sie haben keine Berechtigung, diesen Befehl zu verwenden!** `);
    message.reply(`**Starten Sie den Neustart des Bots**`)
    client.destroy();
    client.login(token);
    message.channel.send(`✅ **Der Bot wurde erfolgreich neu gestartet**`)
   }
// disconnect bot 
     if(command == `dc`){
	      if(message.author.id !== ownerid && !message.member.roles.cache.has(role))return message.reply(`:x: **Sie haben keine Berechtigung, diesen Befehl zu verwenden! , Sie benötigen <@&${role}> Rolle**`)
    connection.destroy();
    message.reply('✅ **Der Bot wurde erfolgreich getrennt.** ')
     }
// bot stats
   if(command == `stats`){
    const statsembed = new MessageEmbed()
    .addFields(
        {
          name: ":robot: Bot",
          value: `┕\`🟢 Online!\``,
          inline: true,
        },
        {
          name: "⌛ Ping",
          value: `┕\`${Math.round(message.client.ws.ping)}ms\``,
          inline: true,
        },
       {
            name: ":file_cabinet: Ram",
            value: `┕\`${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(
              2
            )}mb\``,
            inline: true,
          },
          {
            name: ":robot: Version",
            value: `┕\`v${require("./package.json").version}\``,
            inline: true,
          },
          {
            name: ":blue_book: Discord.js",
            value: `┕\`v${version}\``,
            inline: true,
          },
          {
            name: ":green_book: Node",
            value: `┕\`${process.version}\``,
            inline: true,
          },
      )
      .setColor("GREEN")
      .setFooter(`Angefordert von ${message.author.username}` , message.author.displayAvatarURL({ format: 'png', dynamic: true }))
      .setTimestamp()
  
      message.reply({ embeds: [statsembed]});
   }
})

client.login(token)