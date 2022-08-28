import { Message } from "discord.js";
import { data } from "../../env";
import { CommandMessage } from "../../modules/commands/CommandMessage";
import { CommandDefinition } from "../../modules/commands/definitions";
import { cleanTrackedGuild } from "../../modules/misc/inviteTracker";
import { Translator } from "../../modules/misc/Translator";

function disableInviteTracker(msg: CommandMessage<true>) {
    let guildData = data.guilds[msg.guildId];
    if (!guildData.inviteTracker)
        return Translator.getOrDefault(msg).translate("errors.already_disabled");

    cleanTrackedGuild(msg.guildId);
}

const command: CommandDefinition = {
    key: "disable",
    handler: disableInviteTracker,
    alwaysReactOnSuccess: true
};
export default command;
