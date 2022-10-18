import { ApplicationCommandOptionType, GuildChannel } from "discord.js";
import { Guild, User } from "../../database/models";
import { CommandMessage } from "../../modules/commands/CommandMessage";
import { CommandDefinition } from "../../modules/commands/definitions";
import { importModules } from "../../modules/commands/importHelper";
import { FlaggableType, resolveFlaggableItem, flaggableTypeChoices } from "../../modules/data/flags";

async function flag(msg: CommandMessage, {
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

const command: CommandDefinition = {
    key: "flag",
    args: [{
        translationKey: "type",
        type: ApplicationCommandOptionType.String,
        choices: flaggableTypeChoices
    }, {
        translationKey: "id",
        type: ApplicationCommandOptionType.String,
    }, {
        translationKey: "flag",
        type: ApplicationCommandOptionType.String,
    }],
    ownerOnly: true,
    alwaysReactOnSuccess: true,
    handler: flag,
    subcommands: await importModules(import.meta.url)
};
export default command;
