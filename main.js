'use strict';

const Discord = require('discord.js');
const client = new Discord.Client();

const prefix = '!';
const version = "v1.0.4";

const ChannelData = require('./ChannelData.js');
const channelDataLocation = `${__dirname}/data.db`;
const channelData = new ChannelData(channelDataLocation);

var pendingClones = new Map();
var messageBuffers = new Map();

function clamp(num, max) {
  return num > max ? max : num;
}

if (!Array.prototype.flat) {
	Object.defineProperty(Array.prototype, 'flat', {
		configurable: true,
		value: function flat () {
			var depth = isNaN(arguments[0]) ? 1 : Number(arguments[0]);

			return depth ? Array.prototype.reduce.call(this, function (acc, cur) {
				if (Array.isArray(cur)) {
					acc.push.apply(acc, flat.call(cur, depth - 1));
				} else {
					acc.push(cur);
				}

				return acc;
			}, []) : Array.prototype.slice.call(this);
		},
		writable: true
	});
}

if (Array.prototype.flatMap === undefined) {
    Array.prototype.flatMap = function(f) {
        return this.reduce((acc, x) =>
            acc.concat(f(x)), []);
    };
}

function mentionToChannel(text)
{
    if (/^<#(\d+)>$/.test(text))
    {
        return text.match(/^<#(\d+)>$/)[1];
    }
    else
    {
        throw new Error(`${text} is not a valid channel mention`);
    }
}

async function sendWebhookMessage(msg, webhook)
{
	while (true)
	{
		try
		{
			let content = msg.cleanContent;
			if (!content && msg.embeds.length == 0 && msg.attachments.size == 0)
			{
				if (msg.type == "DEFAULT") return;
				content = msg.type;
			}
			
			await webhook.send(content,
			{
				username: msg.author.username,
				avatarURL: msg.author.displayAvatarURL(),
				embeds: msg.embeds.filter(embed => embed.type == "rich"),
				files: Array.from(msg.attachments.values(), att => att.url),
				disableMentions: "all"
			});
			break;
		}
		catch (e)
		{
			if (!(e instanceof Discord.HTTPError))
                throw e;
			console.log(`${e}\n${e.stack}`);
		}
    }
}

async function sendWebhookMessageAuto(msg)
{
	if (msg.content.startsWith(prefix + "unmirror")) return;
	
    let mChannel = await client.channels.fetch(channelData.mappedChannels.get(msg.channel.id).id);
	
	if (msg.channel == mChannel)
	{
		if (msg.webhookID) return;
		msg.delete();
	}
    
    try
    {
		let webhooks = await mChannel.fetchWebhooks();
		
		let webhook = webhooks.find(webhook => webhook.name == "ChannelLink");
		if (webhook == undefined)
			webhook = await mChannel.createWebhook("ChannelLink");
		
        await sendWebhookMessage(msg, webhook);
		
		await channelData.updateLastMessage(msg.channel, msg);
    }
    catch (e)
    {
        await channelData.unmapChannel(msg.channel);
    }
}

client.on('ready', () =>
{
    console.log(`Logged in as ${client.user.tag}.`);
	
	client.user.setPresence({activity: {name: version }});
    
    client.guilds.cache.forEach(async guild =>
    {
        let webhooks = await guild.fetchWebhooks();
        
        webhooks.forEach(async webhook =>
        {
            let parts = webhook.name.split(" ");
            if (parts[0] == "Crosspost")
            {
                let wChannel = await client.channels.fetch(webhook.channelID);
                
                let channel = await client.channels.fetch(parts[1]);
                await channelData.mapChannel(channel, wChannel);
				
				let messages = await channel.messages.fetch();
				if (messages.size > 0)
					await channelData.updateLastMessage(channel, messages.first());
				
                webhook.delete();
            }
        });
    });
	
	for (let entry of channelData.mappedChannels.entries())
		cloneChannel(entry[0], entry[1].lastMessage);
});

async function cloneChannel(_channel, lastMessage)
{
	let channel = await client.channels.fetch(_channel);
	let toChannel = await client.channels.fetch(channelData.mappedChannels.get(_channel).id);
	
	if (!channel.messages || !(channel.permissionsFor(client.user).has(["VIEW_CHANNEL", "READ_MESSAGE_HISTORY"]))) return;
	
	pendingClones.set(channel, toChannel);
	pendingClones.set(toChannel, channel);
	messageBuffers.set(channel, []);
		
	let messages = [...(await channel.messages.fetch({after: lastMessage, limit: 100})).values()];
	
	if (messages.length == 100)
	{
		let addedMessages;
		do
		{				
			addedMessages = await channel.messages.fetch({after: messages[0].id, limit: 100});
			messages = [...addedMessages.values()].concat(messages);
		}
		while (addedMessages.size == 100);
	}
	
	messageBuffers.set(channel, messageBuffers.get(channel).concat(messages));
	
	while (messageBuffers.get(channel).length > 0)
	{
		let message = messageBuffers.get(channel).pop();
		await sendWebhookMessageAuto(message);
	}
	
	pendingClones.delete(channel);
	pendingClones.delete(toChannel);
	messageBuffers.delete(channel);
	
	return messages.length;
}

async function addMirror(fromChannel, idArg)
{
	let channel = await client.channels.fetch(mentionToChannel(idArg));
	
	if (channelData.mappedChannels.has(fromChannel.id))
	{
		fromChannel.send("Channel is already mirrored.");
		return false;
	}
	
	if ([...channelData.mappedChannels.values()].includes(fromChannel.id))
	{
		fromChannel.send("Cannot mirror destination channel.");
		return false;
	}
	
	if (channelData.mappedChannels.has(channel.id))
	{
		fromChannel.send("Cannot mirror to mirrored channel.");
		return false;
	}
	
	try
    {		
		await channelData.mapChannel(fromChannel, channel);
		
		let messages = await fromChannel.messages.fetch();
		if (messages.size > 0)
			await channelData.updateLastMessage(fromChannel, messages.first());
		
		if (fromChannel != channel)
			channel.send(`${fromChannel} is mirrored here.`);
		
		return true;
	}
	catch (e)
	{
		fromChannel.send("Cannot access destination channel.");
		console.log(e);
		return false;
	}
}

async function addMirrorFrom(toChannel, idArg, isSilentArg)
{
    if (isSilentArg != undefined && isSilentArg != "silent")
	{
		fromChannel.send("Invalid argument.");
		return false;
	}
    
    let channel = await client.channels.fetch(mentionToChannel(idArg));
    
    if (channelData.mappedChannels.has(channel.id))
	{
		toChannel.send("Channel is already mirrored.");
		return false;
	}
	
	if ([...channelData.mappedChannels.values()].includes(channel.id))
	{
		toChannel.send("Cannot mirror destination channel.");
		return false;
	}
	
	if (channelData.mappedChannels.has(toChannel.id))
	{
		toChannel.send("Cannot mirror to mirrored channel.");
		return false;
	}
	
    try
    {
        if (toChannel != channel && isSilentArg == undefined)
			channel.send(`This channel is mirrored to ${toChannel}.`);
    }
    catch (e)
    {
        toChannel.send("Cannot access source channel.");
	    return false;
    }
    
    return await addMirror(channel, toChannel.toString());
}

async function removeMirror(fromChannel)
{
    let channel;
	if (channelData.mappedChannels.has(fromChannel.id))
	{
	    channel = await client.channels.fetch(channelData.mappedChannels.get(fromChannel.id).id);
	}
	else
	{
		channel = [...channelData.mappedChannels.entries()].find(entry => entry[1].id == fromChannel.id);
		if (channel)
		{
			let tmp = fromChannel;
			fromChannel = await client.channels.fetch(channel[0]);
			channel = tmp;
		}
		else
		{
			msg.channel.send("Channel is not mirrored nor any channel is mirroring to it.");
			return false;
		}
	}
	
	let webhooks = await channel.fetchWebhooks();
    let webhook = webhooks.find(webhook => webhook.name == "ChannelLink");
    
    if (webhook != undefined) webhook.delete();
    await channelData.unmapChannel(fromChannel);
	
	if (fromChannel != channel) channel.send(`${fromChannel} is no longer mirrored.`);
	
	return true;
}

async function batchClone(msg, countArg, channel, toChannel)
{
    if (toChannel == channel)
    {
	    msg.channel.send("Cannot clone to same channel.");
	    return false;
    }
	
	if (countArg != "all")
	{
		countArg = parseInt(countArg);
		if (isNaN(countArg) || countArg < 1)
		{
			msg.channel.send("Invalid argument.");
			return false;
		}
	}
	
	let messages = [...(await channel.messages.fetch({limit: (countArg == "all" || countArg > 100) ? 100 : countArg})).values()];
	if ((countArg == "all" && messages.length == 100) || countArg > 100)
	{
		let addedMessages;
		let reaction = msg.react("🔍");
		let counter = await msg.channel.send(`Searching messages... (${messages.length} found)`);
		do
		{
			if (!pendingClones.has(msg.channel))
			{
				(await reaction).users.remove(client.user);
			    return false;
			}
			
			addedMessages = await channel.messages.fetch({before: messages[messages.length - 1].id, limit: countArg == "all" ? 100 : clamp(countArg - messages.length)});
			messages = messages.concat([...addedMessages.values()]);
			await counter.edit(`Searching messages... (${messages.length} found)`);
		}
		while (addedMessages.size == 100);
		(await reaction).users.remove(client.user);
		counter.edit(`${messages.length} messages will be cloned.`);
	}
	
	messageBuffers.set(channel, messageBuffers.get(channel).concat(messages));
	
	let webhooks = await toChannel.fetchWebhooks();
	let webhook = webhooks.find(webhook => webhook.name == "ChannelLink");
	let isTemporary = false;
	
	if (webhook == undefined)
	{
		webhook = webhooks.find(webhook => webhook.name == "TempCrosspost");
		if (webhook == undefined)
			webhook = await toChannel.createWebhook("TempCrosspost");
		isTemporary = true;
	}
	
	toChannel.startTyping();
	let initialLength = messages.length;
  
	let message;
	while (message = messageBuffers.get(channel).pop())
	{
		if (!pendingClones.has(msg.channel))
		{
			toChannel.stopTyping();
            return false;
        }
		
		await sendWebhookMessage(message, webhook);
		
		if (initialLength > 500)
			await new Promise(resolve => setTimeout(resolve, 2000 - Date.now() % 2000));
	}
	toChannel.stopTyping();
	
	if (isTemporary)
		await webhook.delete();
	
	return true;
}

async function batchCloneWrapper(msg, countArg, toChannel)
{
    if (pendingClones.has(msg.channel))
    {
        msg.channel.send("Clone is already pending.");
        return false;
    }
	
	let channel;
    if (toChannel == undefined)
    {
	    if (channelData.mappedChannels.has(msg.channel.id))
	    {
		    channel = msg.channel;
	    }
	    else
		{
			channel = [...channelData.mappedChannels.entries()].find(entry => entry[1].id == msg.channel.id)[0];
			if (channel)
			{
				channel = await client.channels.fetch(channel);
			}
			else
			{
				msg.channel.send("Channel is not mirrored nor any channel is mirroring to it.");
				return false;
			}
		}
        
        toChannel = await client.channels.fetch(channelData.mappedChannels.get(channel.id).id);
	}
	else
	{
		channel = msg.channel;
		toChannel = await client.channels.fetch(mentionToChannel(toChannel));
	}		
    
    try
    {
		messageBuffers.set(channel, []);
        pendingClones.set(channel, toChannel);
		pendingClones.set(toChannel, channel);
        return await batchClone(msg, countArg, channel, toChannel);
    }
	finally
	{
		pendingClones.delete(channel);
		pendingClones.delete(toChannel);
		messageBuffers.delete(channel);
	}
}

async function stopBatchClone(channel)
{
    if (!pendingClones.has(channel))
    {
        channel.send("Clone is not pending.");
        return false;
    }
    
	pendingClones.delete(pendingClones.get(channel));
    pendingClones.delete(channel);
    return true;
}

async function deleteRange(channel, start, end)
{
    start = parseInt(start);
    end = parseInt(end);
    
    if (start == undefined || end == undefined || start >= end)
    {
        channel.send("Enter a valid message range.");
        return false;
    }
    
    while (true)
    {
        let messages = await channel.messages.fetch({limit: 100, before: end});
        for (let msg of messages.values())
	    {
		    if (msg.id < start)
		        return true;
		    else
                await msg.delete();
	    }
	    if (messages.size < 100)
	        return true;
	}
	
    return true;
}

async function scanChannel(channel, mode, fromChannel)
{
	const inviteLink = /(https?:\/\/)?(www.)?(discord.(gg|io|me|li)|discordapp.com\/invite)\/[^\s\/]+?(?=\b)/g;
	const getWeekNumber = d =>
	{
		// Copy date so don't modify original
		d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
		// Set to nearest Thursday: current date + 4 - current day number
		// Make Sunday's day number 7
		d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
		// Get first day of year
		var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
		// Calculate full weeks to nearest Thursday and return
		return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
	};
	
	if (mode != "daily" && mode != "weekly" && mode != "monthly")
	{
		channel.send("Mode is not defined!");
		return false;
	}
	
	if (fromChannel != undefined)
		fromChannel = await client.channels.fetch(mentionToChannel(fromChannel));
	else
		fromChannel = channel;
	
	if (!fromChannel.messages || !(fromChannel.permissionsFor(client.user).has(["VIEW_CHANNEL", "READ_MESSAGE_HISTORY"])))
	{
		channel.send("Channel is not a text channel or permissions are missing.");
		return;
	}
	
	let authors = new Map();
	let userMessages = new Map();
	let invites = new Set();
	
	let messages;
	let totalLength = 0;
	
	let counter = await channel.send(`Fetching messages...`);
	do
	{
		messages = [...(await fromChannel.messages.fetch({after: messages ? messages[messages.length - 1].id : 0, limit: 100})).values()];
		await counter.edit(`Fetching messages... (${totalLength += messages.length} loaded)`);
		
		for (let message of messages.reverse())
		{				
			if (!authors.has(message.author.tag))
				authors.set(message.author.tag, message.author);
			let author = message.author.tag;
			
			let date;
			if (mode == "weekly")
			{
				date = getWeekNumber(message.createdAt).toString().padStart(2, "0") + "." + message.createdAt.getUTCFullYear();
			}
			else
			{
				date = (mode == "daily" ? message.createdAt.getUTCDate().toString().padStart(2, "0") + "." : "")
					+ (message.createdAt.getUTCMonth() + 1).toString().padStart(2, "0") + "."
					+ message.createdAt.getUTCFullYear();
			}
			
			Array.from(message.content.matchAll(inviteLink), x => x[0]).forEach(x => invites.add(x));
			
			if (!userMessages.has(author))
			{
				userMessages.set(author,
				{
					first: message,
					last: "",
					dailyCount: new Map()
				});
			}
			let entry = userMessages.get(author);
			
			entry.last = message;
			
			if (!entry.dailyCount.get(date))
				entry.dailyCount.set(date, 0);
			entry.dailyCount.set(date, entry.dailyCount.get(date) + 1);
		}
	}
	while (messages.length > 0);
	await counter.delete();
	
	let result = `Found ${invites.size} invites${invites.size ? ":\n" : "."}`;
	counter = 0;
	for (let invite of invites)
	{
		if (counter == 10)
		{
			channel.send(result);
			result = "";
			counter = 0;
		}
		result += invite + "\n";
		counter++;
	}
	channel.send(result);
	result = "";
	
	for (let entry of userMessages.entries())
	{
		entry[0] = authors.get(entry[0]);
		let data = entry[1];
		
		result += `\`${entry[0].tag} (${entry[0].id}):\`\n`
			+ `  First message: ${data.first.url} (${data.first.createdAt.toLocaleString()})\n`
			+ `  Last message: ${data.last.url} (${data.last.createdAt.toLocaleString()})\n`
			+ `  ${mode[0].toUpperCase() + mode.substring(1)} message count:\n`;
		
		result += "```";
		for (let dayEntry of data.dailyCount.entries())
		{
			result += `    ${dayEntry[0]}: ${dayEntry[1]}\n`;
		}
		result += "```\n";
	}
	
	let str = "";
	for (let line of result.split('\n'))
	{
		if (str.length + line.length > 2000 - 3)
		{
			let block = (str.match(/```/g) || []).length % 2 ? "```" : "";
			await channel.send(str + block);
			str = block;
		}
		str += line + "\n";
	}
	if (str != "")
		await channel.send(str);
	
	return true;
}

async function resetChannel(fromChannel)
{
	if (channelData.mappedChannels.has(fromChannel) || [...channelData.mappedChannels.values()].includes(fromChannel))
	{
		fromChannel.send("Unmirror channel first.");
		return false;
	}
	
	let channel = await fromChannel.clone();
	channel.setPosition(fromChannel.position);
	fromChannel.delete();
	return true;
}

async function createServer(fromChannel)
{
	let guild;
	try
	{
		guild = await client.guilds.create("testGuild",
		{
			icon: client.user.displayAvatarURL(),
			defaultMessageNotifications: "MENTIONS",
			channels: [
			{
				name: "general"
			},
			{
				name: "general-2"
			}],
			roles: [
			{
				id: 0,
				permissions: Discord.Permissions.ALL
			}]
		});
	}
	catch (e)
	{
		return false;
	}
	
	let channel = [...guild.channels.cache.values()].find(channel => channel.type == "text");
	let invite = await channel.createInvite();
	fromChannel.send(invite.url);
	return true;
}

async function deleteServer(channel)
{
	await channel.guild.delete();
	return true;
}

async function cloneServer(guild, fromGuild, mode)
{
    fromGuild = client.guilds.resolve(fromGuild);
    
    let channels = new Map();
    let roles = new Map();
    
    if (mode == "both" || mode == "roles")
    {
        for (let role of [...fromGuild.roles.cache.values()].filter(x => !x.managed).sort((x, y) => y.position - x.position))
        {
            if (role.id == fromGuild.roles.everyone.id) continue;
            
            roles.set(role, await guild.roles.create({ data:
            {
                name: role.name,
                color: role.color,
                hoist: role.hoist,
                permissions: role.permissions,
                mentionable: role.mentionable
            }}));
        }
        
        roles.set(fromGuild.roles.everyone, guild.roles.everyone);
    }
    
    if (mode == "both" || mode == "channels")
    {
        for (let channel of [...fromGuild.channels.cache.values()].filter(x => x.type == "category").sort((x, y) => x.position - y.position))
        {
            channels.set(channel, await guild.channels.create(channel.name,
            {
                type: channel.type,
                permissionOverwrites: roles.size == 0 ? undefined : Array.from([...channel.permissionOverwrites.values()].filter(x => x.type == "role" && roles.has(fromGuild.roles.resolve(x.id))), x =>
                {
                    y = {
                        id: roles.get(fromGuild.roles.resolve(x.id)),
                        allow: x.allow,
                        deny: x.deny,
                        type: "role"
                    };
                    return y;
                })
            }));
        }
        
        for (let channel of [...fromGuild.channels.cache.values()].filter(x => x.type != "category").sort((x, y) => x.position - y.position))
        {
            await guild.channels.create(channel.name,
            {
                type: channel.type,
                topic: channel.topic,
                nsfw: channel.nsfw,
                bitrate: channel.bitrate,
                userLimit: channel.userLimit,
                rateLimitPerUser: channel.rateLimitPerUser,
                parent: channels.get(channel.parent),
                permissionOverwrites: roles.size == 0 ? undefined : Array.from([...channel.permissionOverwrites.values()].filter(x => x.type == "role" && roles.has(fromGuild.roles.resolve(x.id))), x =>
                {
                    y = {
                        id: roles.get(fromGuild.roles.resolve(x.id)),
                        allow: x.allow,
                        deny: x.deny,
                        type: "role"
                    };
                    return y;
                })
            });
        }
    }
    
    return true;
}

function delAllServers()
{
	for (let guild of client.guilds.cache.values())
	{
		if (guild.ownerID != client.user.id) continue;
		
		guild.delete();
	}
	return true;
}

async function getMirroredChannels(channel, guild)
{
	let resp = "";
	for (let mirror of channelData.mappedChannels.entries())
	{
		let fromChannel = await client.channels.fetch(mirror[0]);
		let toChannel = await client.channels.fetch(mirror[1].id);
		
		if (fromChannel.guild == guild
			|| toChannel.guild == guild)
		{
			resp += `${fromChannel} (${fromChannel.guild}) => ${toChannel} (${toChannel.guild})\n`;
		}
	}
	if (resp != "")
		channel.send(resp);
	return true;
}

async function getOwnedServers(fromChannel)
{
	let resp = "";
	for (let guild of client.guilds.cache.values())
	{
		if (guild.ownerID != client.user.id) continue;
		
		let channel = [...guild.channels.cache.values()].find(channel => channel.type == "text");
		let invite = await channel.createInvite();
		resp += invite.url + "\n";
	}
	if (resp != "")
		fromChannel.send(resp);
	return true;
}

async function timer(msg, date, time, countstr, endstr)
{
    date = date.split(".");
    for (let i = 0; i < date.length; i++)
	{
		date[i] = parseInt(date[i]);
		if (date[i] == undefined || date.length != 3)
		{
			msg.channel.send("Invalid date format");
			return false;
		}
	}
	
    time = time.split(":");
    for (let i = 0; i < time.length; i++)
	{
		time[i] = parseInt(time[i]);
		if (time[i] == undefined || time.length != 2)
		{
			msg.channel.send("Invalid time format");
			return false;
		}
	}
	
	if (!countstr)
	{
	    msg.channel.send("Countstr is empty.");
	    return;
	}
	
	if (!endstr)
	{
	    msg.channel.send("Endstr is empty.");
	    return;
	}
    
    let goal = new Date(date[2], date[1] - 1, date[0], time[0], time[1]);
	let current;
	
	let res = await msg.channel.send("Initializing timer...");
	
	do
    {
		let diff = new Date(goal - Date.now() + 60000);
		
		await res.edit(countstr.replace("%s", `${diff.getUTCHours().toString().padStart(2, "0")}:${diff.getUTCMinutes().toString().padStart(2, "0")}`));
		await new Promise(resolve => setTimeout(resolve, 60000 - Date.now() % 60000));
		
		current = new Date(Date.now());
    }
	while (goal > current);
    
    await res.edit(endstr);
    return true;
}

async function botinvite(channel)
{
    channel.send(await client.generateInvite(Discord.Permissions.FLAGS.ALL));
    return true;
}

async function setupReceiverServer(guild)
{
	for (let channel of guild.channels.cache.values())
		await channel.delete();
	
	let commandChannel = await guild.channels.create("commands");
	let logChannel = await guild.channels.create("logs");
	let deletedCategory = await guild.channels.create("Deleted Channels", {type: "category"});
	let rootCategory = await guild.channels.create("Root Category", {type: "category"});
	
	await commandChannel.send(
`Fill \`senderToken\`, \`receiverToken\`, \`fromGuild\` and (optional) \`maxInitMessages\` with your data.
\`\`\`{
	"senderToken": "",
	"receiverToken": "",
	"commandChannel": "${commandChannel.id}",
	"logChannel": "${logChannel.id}",
	"rootCategory": "${rootCategory.id}",
	"deletedCategory": "${deletedCategory.id}",
	"fromGuild": "",
	"toGuild": "${guild.id}",
	"maxInitMessages": 0
}\`\`\``);
	return true;
}

function help(channel)
{
	channel.send(
	prefix + "mirror <channel> - mirror this channel to another channel.\n"
	+ prefix + "mirrorfrom <channel> - mirror another channel to this channel.\n"
	+ "  Mirroring channel to itself makes messages to be resent by bot.\n"
	+ prefix + "unmirror - stop mirroring this channel.\n"
	+ prefix + "clone <count/all> <(optional)channel> - copy latest <count> messages to mirror or defined channel.\n"
	+ "  If given more than 500 messages, send rate is limited to 2 seconds.\n"
	+ prefix + "stopclone - stop pending clone operation.\n"
	+ prefix + "delrange <startid> <endid> - delete all messages within range.\n"
	+ prefix + "scanchannel <mode{daily,weekly,monthly}> <(optional)channel> - get information about users sent to this or defined channel."
	+ prefix + "resetchannel - clone and delete this channel.\n"
	+ prefix + "createserver - create test server.\n"
	+ prefix + "delserver - delete test server.\n"
	+ prefix + "cloneserver <id> <mode{channels,roles,both}> - clone all server channels and/or roles.\n"
	+ prefix + "delallservers - delete all test servers.\n"
	+ prefix + "getmirroredchannels - get channel mirrors for this server.\n"
	+ prefix + "getownedservers - list bot test servers.\n"
    + prefix + "timer <dd.mm.yyyy> <hh:mm> <countstr{%s}> <endstr> - self-updating UTC timer message.\n"
    + prefix + "botinvite - get bot server invite link.\n");
}

client.on("rateLimit", console.log);

client.on('message', async msg =>
{
	if (!msg.guild) return;
	
	let mappedChannel = channelData.mappedChannels.get(msg.channel.id);
    if (mappedChannel != undefined)
    {
		let buffer = messageBuffers.get(msg.channel);
		if (buffer != undefined && await client.channels.fetch(mappedChannel.id) == pendingClones.get(msg.channel))
		{
			buffer.unshift(msg);
		}
		else
		{
			sendWebhookMessageAuto(msg);
		}
    }
    
    if (msg.author.bot || msg.webhookID) return;
    if (!msg.content.startsWith(prefix)) return;
    
    let args = msg.content.match(/[^" ]+|"(?:\\"|[^"])+"/g);
    args.forEach((str, i, arr) =>
    {
        if (str.charAt(0) == '"')
            arr[i] = str.slice(1, -1);
    });
	args[0] = args[0].slice(1);
    
	let promise;
	
    switch (args[0])
    {
        case "mirror":
            promise = addMirror(msg.channel, args[1]);
            break;
        case "mirrorfrom":
            promise = addMirrorFrom(msg.channel, args[1], args[2]);
            break;
        case "unmirror":
            promise = removeMirror(msg.channel);
            break;
        case "clone":
            promise = batchCloneWrapper(msg, args[1], args[2]);
            break;
        case "stopclone":
            promise = stopBatchClone(msg.channel);
            break;
        case "delrange":
            promise = deleteRange(msg.channel, args[1], args[2]);
            break;
		case "scanchannel":
			promise = scanChannel(msg.channel, args[1], args[2]);
			break;
        case "resetchannel":
            promise = resetChannel(msg.channel);
            break;
        case "createserver":
            promise = createServer(msg.channel);
            break;
        case "delserver":
            promise = deleteServer(msg.channel);
            break;
        case "cloneserver":
            promise = cloneServer(msg.guild, args[1], args[2]);
            break;
		case "delallservers":
			promise = delAllServers();
			break;
        case "getmirroredchannels":
            promise = getMirroredChannels(msg.channel, msg.guild);
            break;
        case "getownedservers":
            promise = getOwnedServers(msg.channel);
            break;
        case "timer":
            promise = timer(msg, args[1], args[2], args[3], args[4]);
            break;
        case "botinvite":
            promise = botinvite(msg.channel);
            break;
        case "help":
            help(msg.channel);
			msg.react("✅");
            break;
		
		case "setupreceiverserver":
			promise = setupReceiverServer(msg.guild);
			break;
    }
	
	if (promise != undefined)
	{
		try
        {
            let reaction = await msg.react("🔄");
            let ret;
            
            try
            {
                ret = await promise;
            }
            catch (e)
            {
                await msg.channel.send(`${e.stack}`);
		        await msg.react("❌");
            }
            
	        if (ret)
		        await msg.react("✅");
	        else
		        await msg.react("❌");
			
			await reaction.users.remove(client.user);
	    }
	    catch (e)
	    {
		}
	}
});

client.login("NzMzMjEyMjczNjkwMTQ4OTA0.Xw_3JA.7bDfmT2CPQySe9xIYgrJAb4yEGM");