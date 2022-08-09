import { Message, PermissionFlagsBits } from "discord.js";
import { Command } from "../../modules/commands/definitions";
import { importCommands } from "../../modules/commands/importHelper";
import { ServerPermissions } from "../../modules/commands/requirements";
import { getInviteTrackerDataOrClean } from "../../modules/misc/inviteTracker";
import { Translator } from "../../modules/misc/Translator";

async function inviteTrackerInfo(msg: Message) {
    let translator = Translator.get(msg);
    let infoStr;

    let [inviteTrackerData, logChannel] = getInviteTrackerDataOrClean(msg.guildId);
    if (!inviteTrackerData)
        infoStr = translator.translate("embeds.invitetracker.not_tracking");
    else
        infoStr = translator.translate("embeds.invitetracker.log_channel", logChannel.toString());

    await msg.channel.send({
        embeds: [{
            title: translator.translate("embeds.invitetracker.title"),
            description: infoStr
        }]
    });
}

const command: Command = {
    name: "invitetracker",
    requirements: ServerPermissions(PermissionFlagsBits.ManageGuild | PermissionFlagsBits.CreateInstantInvite),
    func: inviteTrackerInfo,
    subcommands: await importCommands(import.meta.url)
};
export default command;
