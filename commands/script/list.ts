import { Message } from "discord.js";
import { data } from "../../env";
import { Command } from "../../modules/commands/definitions";
import sendLongText from "../../modules/messages/sendLongText";

async function listScripts(msg: Message) {
    let result = "";

    for (let type of Object.keys(data.scripts)) {
        result += `${type}:\n`;

        for (let name of Object.getOwnPropertyNames(data.scripts[type])) {
            result += `- ${name}\n`;
        }
    }

    await sendLongText(msg.channel, result.slice(0, -1));
}

const command: Command = {
    name: "list",
    func: listScripts
};
export default command;
