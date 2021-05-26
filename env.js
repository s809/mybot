const Discord = require('discord.js');

module.exports =
{
    prefix: '!',
    owner: "559800250924007434",
    maxVersionsOnChangelogPage: 10,

    client: new Discord.Client(),
    channelData: new (require('./ChannelData.js'))(`${__dirname}/data.db`),
    pendingClones: new Map(),
    messageBuffers: new Map(),

    evalModeChannels: [],
};
