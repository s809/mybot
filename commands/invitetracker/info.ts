import { CommandMessage } from "../../modules/commands/CommandMessage";
import { CommandDefinition } from "../../modules/commands/definitions";
import { getInviteTrackerData } from "../../modules/misc/inviteTracker";

async function inviteTrackerInfo(msg: CommandMessage<true>) {
    let translator = msg.translator;
    let infoStr;

    let [inviteTrackerData, logChannel] = await getInviteTrackerData(msg.guild);
    if (!inviteTrackerData)
        infoStr = translator.translate("embeds.not_tracking");
    else
        infoStr = translator.translate("embeds.log_channel", logChannel!.toString());

    await msg.reply({
        embeds: [{
            title: translator.translate("embeds.title"),
            description: infoStr
        }]
    });
}

const command: CommandDefinition = {
    key: "info",
    handler: inviteTrackerInfo
};
export default command;
