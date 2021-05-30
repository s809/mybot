const util = require("util");
const exec = util.promisify(require('child_process').exec);
const { sendLongText } = require("../../sendUtil");

async function shell(msg) {
    let command = '"' + [...arguments].slice(1).join('" "') + '"';
    let { stdout, stderr } = await exec(command, { encoding: "utf8" });
    await sendLongText(msg.channel, "--- stdout ---\n" + stdout);
    await sendLongText(msg.channel, "--- stderr ---\n" + stderr);
    return true;
}

module.exports = {
    name: "shell",
    minArgs: 1,
    maxArgs: Number.MAX_SAFE_INTEGER,
    func: shell,
}
