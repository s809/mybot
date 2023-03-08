import { ApplicationCommandOptionType, GuildChannel } from "discord.js";
import { Guild, User } from "../../database/models";
import { CommandRequest, defineCommand } from "@s809/noisecord";
import { CommandDefinition } from "@s809/noisecord";
import { FlaggableType, resolveFlaggableItem, flaggableTypeChoices } from "../../modules/data/flags";

async function flag(msg: CommandRequest, {
    type,
    id,
    flag
}: {
    type: FlaggableType;
    id: string;
    flag: string;
}) {
    const resolvedItem = await resolveFlaggableItem(type, id);

    if (!resolvedItem[1])
        return "Unknown item.";

    let model: typeof Guild | typeof User = Guild;
    let _id = resolvedItem[0].id;
    let dbPath = "flags";
    switch (type) {
        case "user":
            model = User;
            break;
        case "guild":
            break;
        case "channel":
            _id = (resolvedItem[0] as GuildChannel).guildId;
            dbPath = `channels.${resolvedItem[0].id}.flags`;
            break;
    }

    await (model as any).updateByIdWithUpsert(_id, [{
        $set: {
            [dbPath]: {
                $let: {
                    vars: {
                        currentFlags: { $ifNull: [`$${dbPath}`, []] }
                    },
                    in: {
                        $cond: {
                            if: {
                                $in: [
                                    flag,
                                    "$$currentFlags"
                                ]
                            },
                            then: {
                                $filter: {
                                    input: "$$currentFlags",
                                    cond: {
                                        $ne: ["$$this", flag]
                                    }
                                }
                            },
                            else: {
                                $setUnion: [
                                    "$$currentFlags",
                                    [flag]
                                ]
                            }
                        }
                    }
                }
            }
        }
    }])
}

export default defineCommand({
    key: "flag",
    args: [{
        key: "type",
        type: ApplicationCommandOptionType.String,
        choices: flaggableTypeChoices
    }, {
        key: "id",
        type: ApplicationCommandOptionType.String,
    }, {
        key: "flag",
        type: ApplicationCommandOptionType.String,
    }],
    ownerOnly: true,
    alwaysReactOnSuccess: true,
    handler: flag
});
