import { defineCommand } from "@s809/noisecord";
import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";

export default defineCommand({
    key: "cleanbots",

    args: [{
        key: "prefix",
        type: ApplicationCommandOptionType.String,
        minLength: 1
    }, {
        key: "limit",
        type: ApplicationCommandOptionType.Integer,
        minValue: 1,
        maxValue: 100
    }, {
        key: "deleteResponses",
        type: ApplicationCommandOptionType.Boolean,
        required: false
    }],
    defaultMemberPermissions: PermissionFlagsBits.ManageMessages,

    translations: {
        strings: {
            cleaned_commands: true,
            cleaned_commands_with_responses: true
        }
    },

    handler: async (req, { prefix, limit, deleteResponses }, { strings }) => {
        let cleanedCount = 0
        let prevMsg = null;

        for (let [, msg] of await req.channel.messages.fetch({ limit })) {
            if (msg.content.startsWith(prefix)) {
                await msg.delete();

                if (prevMsg)
                    await prevMsg.delete();
                prevMsg = null;

                cleanedCount++;
            } else if (msg.author.bot && deleteResponses) {
                prevMsg = msg;
            }
        }

        await req.replyOrEdit(deleteResponses
            ? strings.cleaned_commands_with_responses.withArgs({ cleanedCount })
            : strings.cleaned_commands.withArgs({ cleanedCount }));
    }
});
