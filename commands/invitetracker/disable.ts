import { Guild } from "../../database/models";
import { CommandMessage } from "../../modules/commands/CommandMessage";
import { CommandDefinition } from "../../modules/commands/definitions";
import { untrackInvites } from "../../modules/misc/inviteTracker";

async function disableInviteTracker(msg: CommandMessage<true>) {
    const guildData = (await Guild.findByIdOrDefault(msg.guildId, { inviteTracker: 1 }))!;
    if (!guildData.inviteTracker)
        return "already_disabled";

    untrackInvites(msg.guildId);
}

const command: CommandDefinition = {
    key: "disable",
    handler: disableInviteTracker,
    alwaysReactOnSuccess: true
};
export default command;
