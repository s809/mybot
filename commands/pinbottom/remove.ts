import { CommandRequest, defineCommand } from "@s809/noisecord";
import { commandFramework } from "../../env";
import { unpinMessage } from "../../modules/messages/pinBottom";

const errorLoc = commandFramework.translationChecker.checkTranslations({
    not_pinned: true,
}, `${commandFramework.commandRegistry.getCommandTranslationPath("pinbottom/remove")}.errors`);

async function removePinnedMessage(msg: CommandRequest<true>) {
    if (!await unpinMessage(msg.channel))
        return errorLoc.not_pinned.path;
}

export default defineCommand({
    key: "remove",
    handler: removePinnedMessage
});
