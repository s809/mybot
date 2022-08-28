import { Team, TextBasedChannel } from "discord.js";
import { client, logChannel } from "./env";
import { wrapText } from "./util";

async function sendMessage(message: string, ping = false) {
    try {
        const userOrTeam = client.application!.owner;
        const user = userOrTeam instanceof Team ? userOrTeam.owner!.user : userOrTeam;

        const channel = <TextBasedChannel>client.channels.resolve(logChannel);
        return (channel ?? user).send((ping ? user!.toString() : "") + ("```\n" + message + "```"));
    } catch {
        return null;
    }
}

export const log = console.log;
export const logDebug = console.debug;

export function logError(e: Error, origin: NodeJS.UncaughtExceptionOrigin | null = null) {
    console.error(e);
    if (origin)
        sendMessage(wrapText(origin, e.stack!), true);
    else
        sendMessage("E: " + e.stack);
}
