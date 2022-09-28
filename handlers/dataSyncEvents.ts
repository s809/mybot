import { client } from "../env";
import {
    onChannelRemove,
    onMemberRemove,
    onRoleRemove
} from "../modules/data/dataSync";

client.on("roleDelete", onRoleRemove);
client.on("guildMemberRemove", onMemberRemove);
client.on("channelDelete", onChannelRemove)
client.on("threadUpdate", (oldThread, newThread) => {
    if (!oldThread.archived && newThread.archived)
        onChannelRemove(newThread);
});
client.on("threadDelete", onChannelRemove);
