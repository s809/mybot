async function deleteRange(msg, start, end) {
    start = parseInt(start);
    end = parseInt(end);

    if (start === undefined || end === undefined || start >= end) {
        msg.channel.send("Enter a valid message range.");
        return false;
    }

    for (; ;) {
        let messages = await msg.channel.messages.fetch({ limit: 100, before: end - 1 });
        for (let msg of messages.values()) {
            if (msg.id < start)
                return true;
            else
                await msg.delete();
        }
        if (messages.size < 100)
            return true;
    }
}

module.exports =
{
    name: "delrange",
    description: "delete all messages within range",
    args: "<startid> <endid>",
    minArgs: 2,
    maxArgs: 2,
    func: deleteRange,
}
