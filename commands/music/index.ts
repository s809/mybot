import { importModules } from "../../modules/commands/importHelper";
import { CommandDefinition } from "../../modules/commands/definitions";
import { InVoiceChannel } from "../../modules/commands/conditions";

const command: CommandDefinition = {
    key: "music",
    conditions: [InVoiceChannel],
    subcommands: await importModules(import.meta.url),
    ownerOnly: true,
    allowDMs: false
};
export default command;
