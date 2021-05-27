const env = require("../../env.js");

async function uptime(msg, type) {
    let diff;
    switch (type) {
        case "bot":
            diff = new Date(env.client.uptime);
            break;
        case "host":
            diff = new Date(require("os").uptime() * 1000);
            break;
        default:
            msg.channel.send("Invalid type parameter.");
            return false;
    }

    var days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -= days * (1000 * 60 * 60 * 24);

    var hours = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * (1000 * 60 * 60);

    var mins = Math.floor(diff / (1000 * 60));
    diff -= mins * (1000 * 60);

    var seconds = Math.floor(diff / (1000));
    diff -= seconds * (1000);

    msg.channel.send(`${days} days, ${hours} hours, ${mins} minutes, ${seconds} seconds`);
    return true;
}

module.exports =
{
    name: "uptime",
    description: "get bot uptime",
    args: "<type{bot, host}>",
    minArgs: 0,
    maxArgs: 1,
    func: uptime,
}
