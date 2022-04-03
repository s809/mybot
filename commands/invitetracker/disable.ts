import { Message } from "discord.js";
import { data } from "../../env";
import { Command } from "../../modules/commands/definitions";
import { cleanTrackedGuild } from "../../modules/misc/inviteTracker";
import { Translator } from "../../modules/misc/Translator";

function disableInviteTracker(msg: Message) {
    let guildData = data.guilds[msg.guildId];
    if (!guildData.inviteTracker)
        return Translator.get(msg).translate("errors.already_disabled");

    cleanTrackedGuild(msg.guildId);
}

const command: Command = {
    name: "disable",
    func: disableInviteTracker
};
export default command;
