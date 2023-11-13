/**
 * @file Restart command.
 */
import { defineCommand } from "@s809/noisecord";
import { ApplicationCommandOptionType } from "discord.js";
import { User as DbUser, Guild as DbGuild } from "../../database/models";
import sendLongText from "../../modules/messages/sendLongText";
import { coverSensitiveStrings, formatString } from "../../util";
import { inspect } from "util";

const databases = {
    user: DbUser,
    guild: DbGuild
};

export default defineCommand({
    key: "dumpdb",
    args: [{
        key: "name",
        type: ApplicationCommandOptionType.String
    }, {
        key: "filter",
        type: ApplicationCommandOptionType.String
    }, {
        key: "transform",
        type: ApplicationCommandOptionType.String,
        raw: true,
        required: false
    }],
    handler: async (req, { name, filter, transform }) => {
        if (!(name in databases))
            return "Invalid database name.";

        let filterObject: object | undefined;
        try {
            filterObject = eval(filter);
            if (typeof filterObject !== "object")
                throw new Error();
        } catch {
            if (filter === "all")
                filterObject = undefined;
            else
                filterObject = { _id: filter };
        }

        const result: object[] = await (databases as any)[name].find(filterObject).lean();

        await sendLongText(req.channel, coverSensitiveStrings(
            inspect(
                transform
                    ? result.map(item => eval(formatString(transform, `(${JSON.stringify(item)})`)))
                    : result,
                { depth: 2 }
            )
        ));
    }
});
