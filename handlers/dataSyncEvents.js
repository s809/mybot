import { client } from "../env.js";
import {
    onChannelCreate,
    onChannelRemove,
    onGuildCreate,
    onGuildRemove,
    onMemberCreate,
    onMemberRemove,
    onRoleCreate,
    onRoleRemove
} from "../modules/data/dataSync.js";

client.on("guildCreate", onGuildCreate);
client.on("guildDelete", onGuildRemove);

client.on("roleCreate", onRoleCreate);
client.on("roleDelete", onRoleRemove);

client.on("channelCreate", onChannelCreate);
client.on("channelDelete", onChannelRemove);

client.on("threadCreate", onChannelCreate);
client.on("threadDelete", onChannelRemove);

client.on("guildMemberAdd", onMemberCreate);
client.on("guildMemberRemove", onMemberRemove);
