import { importCommands } from "../../modules/commands/importHelper";
import { CommandDefinition } from "../../modules/commands/definitions";
import { BotOwner, InVoiceChannel } from "../../modules/commands/requirements";

const command: CommandDefinition = {
    name: "music",
    requirements: [InVoiceChannel, BotOwner],
    subcommands: await importCommands(import.meta.url)
};
export default command;
