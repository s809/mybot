const env = require("../env");
const sendUtil = require("../sendUtil");

async function botEval(msg) {
    try {
        let response;

        try {
            try {
                response = await eval(`(async () => ${msg.content.substr(env.prefix.length)})();`);
            } catch (e) {
                if (!(e instanceof SyntaxError))
                    throw e;

                response = await eval(`(async () => { ${msg.content.substr(env.prefix.length)} })();`);
            }
        } catch (e) {
            if (msg.channel.deleted)
                throw e;
            response = e;
        }

        response = require("util").inspect(response, { depth: 1 });
        await sendUtil.sendLongText(msg.channel, response);
    } catch (e) {
        console.log(e);
    }
}

module.exports = botEval;
