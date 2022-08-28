import { CommandMessage } from "../../modules/commands/CommandMessage";
import { CommandDefinition } from "../../modules/commands/definitions";
import { getInviteTrackerDataOrClean } from "../../modules/misc/inviteTracker";
import { Translator } from "../../modules/misc/Translator";

async function inviteTrackerInfo(msg: CommandMessage<true>) {
    let translator = Translator.getOrDefault(msg);
    let infoStr;

    let [inviteTrackerData, logChannel] = getInviteTrackerDataOrClean(msg.guildId);
    if (!inviteTrackerData)
        infoStr = translator.translate("embeds.invitetracker.not_tracking");
    else
        infoStr = translator.translate("embeds.invitetracker.log_channel", logChannel!.toString());

    await msg.reply({
        embeds: [{
            title: translator.translate("embeds.invitetracker.title"),
            description: infoStr
        }]
    });
}

const command: CommandDefinition = {
    key: "info",
    handler: inviteTrackerInfo
};
export default command;
