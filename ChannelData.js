'use strict';

const util = require('util');
var sqlite3 = require('sqlite3').verbose();

var databases = [];

if (process.platform === "win32")
{
	var rl = require("readline").createInterface(
	{
		input: process.stdin,
		output: process.stdout
	});

	rl.on("SIGINT", () =>
	{
		process.emit("SIGINT");
	});
}

process.on("SIGINT", () =>
{
	for (let db of databases)
		db.close();
	process.exit();
});

module.exports = class {
	constructor(location)
	{
		this.db = new sqlite3.Database(location);
		databases.push(this.db);
		this.mappedChannels = new Map();
		this.readData();
	}
	
	async mapChannel(first, second)
	{
		if (!first.id)
			throw new Error("first object has no id property");
		if (!second.id)
			throw new Error("second object has no id property");
		
		let entry = this.mappedChannels.get(first.id);
		if (entry)
		{
			entry.id = second.id;
			await util.promisify(callback => this.db.run("UPDATE mappedChannels SET toId = ? WHERE fromId = ?;", second.id, first.id, callback))();
		}
		else
		{
			this.mappedChannels.set(first.id,
			{
				id: second.id,
				lastMessage: "0"
			});
			
			await util.promisify(callback => this.db.run("INSERT INTO mappedChannels (fromId, toId, lastMessage) VALUES(?, ?, 0);", first.id, second.id, callback))();
		}
	}
	
	async updateLastMessage(channel, message)
	{
		if (!channel.id)
			throw new Error("channel object has no id property");
		if (!message.id)
			throw new Error("message object has no id property");
		
		this.mappedChannels.get(channel.id).lastMessage = message.id;
		await util.promisify(callback => this.db.run("UPDATE mappedChannels SET lastMessage = ? WHERE fromId = ?;", message.id, channel.id, callback))();
	}
	
	async unmapChannel(channel)
	{
		if (!channel.id)
			throw new Error("channel object has no id property");
		
		this.mappedChannels.delete(channel.id);
		await util.promisify(callback => this.db.run("DELETE FROM mappedChannels WHERE fromId = ?;", channel.id, callback))();
	}
	
	readData()
	{
		this.db.serialize(() =>
		{
			this.db.run("CREATE TABLE IF NOT EXISTS mappedChannels (fromId TEXT UNIQUE, toId TEXT, lastMessage TEXT);");
			this.db.each("SELECT fromId, toId, lastMessage FROM mappedChannels;", (err, row) =>
			{
				if (err) throw err;
				this.mappedChannels.set(row.fromId,
				{
					id: row.toId,
					lastMessage: row.lastMessage
				});
			});
		});
	}
}