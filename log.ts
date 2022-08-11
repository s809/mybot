import { Message, Team, TextBasedChannel } from "discord.js";
import { inspect } from "util";
import { setTimeout } from "timers/promises";
import { client, debug, logChannel } from "./env";
import { wrapText } from "./util";

const wrappedMessageMaxLength = 2000 - 7;

let lastMessage: Message | null;
let lineQueue: string[] = [];
let pendingEdit = false;

function argsToString(args: any[]) {
    return args.map(arg => typeof arg == "object"
        ? inspect(arg, { depth: 1 })
        : arg.toString()).join(" ");
}

async function sendMessage(message: string, ping = false) {
    if (!ping && !logChannel) return;

    const sendFunction = async (message: string, ping = false) => {
        try {
            const userOrTeam = client.application!.owner;
            const user = userOrTeam instanceof Team ? userOrTeam.owner!.user : userOrTeam;

            const channel = <TextBasedChannel>client.channels.resolve(logChannel);
            return (channel ?? user).send(ping
                ? `${user!.toString()}\n${message}`
                : ("```\n" + message + "```"));
        } catch { 
            return null;
        }
    };

    if (ping) {
        await sendFunction(message, true);
        return;
    }

    lineQueue.push(...message.split("\n"));
    if (pendingEdit || !client.user) return;

    pendingEdit = true;
    while (lineQueue.length) {
        if (!lastMessage && lineQueue[0].length > wrappedMessageMaxLength) {
            lastMessage = await sendFunction(lineQueue[0].slice(0, wrappedMessageMaxLength));
            lineQueue[0] = lineQueue[0].slice(wrappedMessageMaxLength);
            continue;
        }
        
        let content = lastMessage?.content.slice(0, -3) ?? "";

        while (lineQueue.length) {
            if (content.length + 1 + lineQueue[0].length > wrappedMessageMaxLength)
                break;
            content += "\n" + lineQueue[0];
            lineQueue.shift();
        }

        lastMessage = !lastMessage
            ? await sendFunction(content, ping)
            : await lastMessage.edit(`${content}\`\`\``);
        if (lineQueue.length)
            lastMessage = null;

        await setTimeout(1000);
    }
    pendingEdit = false;
}

export function log(...args: any[]) {
    console.log(...args);
    sendMessage("I: " + argsToString(args));
}

export function logError(e: Error, origin: NodeJS.UncaughtExceptionOrigin | null = null) {
    console.error(e);
    if (origin)
        sendMessage(wrapText(origin, e.stack!), true);
    else
        sendMessage("E: " + e.stack);
}

export function logDebug(...args: any[]) {
    if (!debug) return;

    console.debug(...args);
    sendMessage("D: " + argsToString(args));
}
