const Discord = require('discord.js');

module.exports =
{
    prefix: '!',
    version: "v1.1",
    owner: "559800250924007434", // NoNick#3336

    client: new Discord.Client(),
    channelData: new (require('./ChannelData.js'))(`${__dirname}/data.db`),
    pendingClones: new Map(),
    messageBuffers: new Map(),

    evalModeChannels: [],
};
