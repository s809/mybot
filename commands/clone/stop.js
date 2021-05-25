const env = require("../../env.js");

async function stopBatchClone(msg) {
    if (!env.pendingClones.has(msg.channel)) {
        msg.channel.send("Clone is not pending.");
        return false;
    }

    env.pendingClones.delete(env.pendingClones.get(msg.channel));
    env.pendingClones.delete(msg.channel);
    return true;
}

module.exports =
{
    name: "stop",
    description: "stop pending clone operation",
    minArgs: 0,
    maxArgs: 0,
    func: stopBatchClone,
}