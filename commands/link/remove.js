import { isChannelLinked, unlinkChannel } from "../../modules/data/channelLinking.js";
import { getLanguageByMessage, getTranslation } from "../../modules/misc/translations.js";

async function removeMirror(msg) {
    if (!isChannelLinked(msg.guildId, msg.channelId))
        return getTranslation(getLanguageByMessage(msg), "errors", "channel_not_linked");

    unlinkChannel(msg.channel);
}

export const name = "remove";
export const minArgs = 0;
export const maxArgs = 0;
export const func = removeMirror;
