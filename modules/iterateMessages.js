"use strict";

export default async function* iterateMessages(channel, count = null, latest = true, bottomToTop = false) {
    let messages;
    let totalLength = 0;

    let yieldedCount = 0;
    do {
        messages = [...(await channel.messages.fetch({ after: messages ? messages[messages.length - 1].id : 0, limit: 100 })).values()];

        for (let message of messages.reverse())
        {
            yield message;
            if (++yieldedCount >= count) return;
        }

        if (totalLength >= count) break;
    }
    while (messages.length > 0);
}
