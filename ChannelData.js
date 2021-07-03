"use strict";

import { promisify } from "util";
import Database from "better-sqlite3";

if (process.platform === "win32") {
    var rl = require("readline").createInterface(
        {
            input: process.stdin,
            output: process.stdout
        });

    rl.on("SIGINT", () => {
        process.emit("SIGINT");
    });
}

export default class ChannelData {
    constructor(location) {
        this.db = new Database(location);
        process.once("SIGINT", () => {
            this.db.close();
        });

        const db = this.db;
        this.statements = {
            mappedChannels: {
                createTable: db.prepare("CREATE TABLE IF NOT EXISTS mappedChannels (fromId TEXT UNIQUE, toId TEXT, lastMessage TEXT);"),
                readData: db.prepare("SELECT * FROM mappedChannels;"),
                mapChannel: db.prepare("INSERT INTO mappedChannels (fromId, toId, lastMessage) VALUES(?, ?, 0);"),
                remapChannel: db.prepare("UPDATE mappedChannels SET toId = ? WHERE fromId = ?;"),
                unmapChannel: db.prepare("DELETE FROM mappedChannels WHERE fromId = ?;"),
                updateLastMessage: db.prepare("UPDATE mappedChannels SET lastMessage = ? WHERE fromId = ?;")
            }
        };
        
        this.mappedChannels = new Map();
        this.readData();
    }

    async mapChannel(first, second) {
        if (!first.id)
            throw new Error("first object has no id property");
        if (!second.id)
            throw new Error("second object has no id property");

        let entry = this.mappedChannels.get(first.id);
        if (entry) {
            entry.id = second.id;
            this.statements.mappedChannels.remapChannel.run(second.id, first.id);
        }
        else {
            this.mappedChannels.set(first.id,
                {
                    id: second.id,
                    lastMessage: "0"
                });
            
            this.statements.mappedChannels.mapChannel.run(first.id, second.id);
        }
    }

    async updateLastMessage(channel, message) {
        if (!channel.id)
            throw new Error("channel object has no id property");
        if (!message.id)
            throw new Error("message object has no id property");

        this.mappedChannels.get(channel.id).lastMessage = message.id;
        this.statements.mappedChannels.updateLastMessage.run(message.id, channel.id);
    }

    async unmapChannel(channel) {
        if (!channel.id)
            throw new Error("channel object has no id property");

        this.mappedChannels.delete(channel.id);
        this.statements.mappedChannels.unmapChannel.run(channel.id);
    }

    readData() {
        this.statements.mappedChannels.createTable.run();
        for (let map of this.statements.mappedChannels.readData.all())
        {
            this.mappedChannels.set(map.fromId, {
                id: map.toId,
                lastMessage: map.lastMessage
            });
        }
    }
}
