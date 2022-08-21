import { CommandMessage } from "../../modules/commands/appCommands";
import { CommandDefinition } from "../../modules/commands/definitions";

async function deleteServer(msg: CommandMessage<true>) {
    await msg.guild.delete();
}

const command: CommandDefinition = {
    key: "delete",
    handler: deleteServer,
    alwaysReactOnSuccess: true
};
export default command;
