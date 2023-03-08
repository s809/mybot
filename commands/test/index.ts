import { debug } from "../../constants";
import { CommandDefinition, defineCommand } from "@s809/noisecord";

export default defineCommand({
    key: "test",
    ownerOnly: !debug,
    interactionCommand: debug
});
