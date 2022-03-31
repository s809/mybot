import { ThreadChannel } from "discord.js";
import { client } from "../env";
import {
    onChannelCreate,
    onChannelRemove,
    onGuildCreate,
    onGuildRemove,
    onMemberCreate,
    onMemberRemove,
    onRoleCreate,
    onRoleRemove
} from "../modules/data/dataSync";

client.on("guildCreate", onGuildCreate);
client.on("guildDelete", onGuildRemove);

client.on("roleCreate", onRoleCreate);
client.on("roleDelete", onRoleRemove);

client.on("channelCreate", onChannelCreate);
client.on("channelDelete", onChannelRemove);

client.on("threadCreate", onChannelCreate);
client.on("threadListSync", threads => threads.forEach(thread => onChannelCreate(thread)));
client.on("messageCreate", msg => {
    if (msg.channel instanceof ThreadChannel)
        onChannelCreate(msg.channel);
});
client.on("threadUpdate", (oldThread, newThread) => {
    if (oldThread.archived && !newThread.archived)
        onChannelCreate(newThread);
    else if (!oldThread.archived && newThread.archived)
        onChannelRemove(newThread);
});
client.on("threadDelete", onChannelRemove);

client.on("guildMemberAdd", onMemberCreate);
client.on("guildMemberRemove", onMemberRemove);
