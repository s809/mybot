const child_process = require("child_process");
const env = require("../../env");

const logstrs = prepareChangelog();

function prepareChangelog() {
    let commitCount = parseInt(child_process.execSync("git rev-list --count HEAD", { encoding: "utf8" }));

    let arr = [];
    let str = "";
    let lastVersion = "";

    for (let i = 0; i < commitCount; i++) {
        let hardVersion = child_process.execSync(`git grep --only-matching "\\"v.*\\"" HEAD~${i} -- main.js env.js`, { encoding: "utf8" })
            .split('"')[1]
            .substr(1);
        let packageVersion;
        try {
            packageVersion = child_process.execSync(`git grep --only-matching "version.*\\".*\\"" HEAD~${i} -- package.json`, { encoding: "utf8" })
                .split('"')[2];
        } catch {
            packageVersion = "";
        }
        let version = hardVersion > packageVersion ? hardVersion : packageVersion;

        let msg = child_process.execSync(`git log -1 HEAD~${i} --format=%B`, { encoding: "utf8" });

        if (version !== lastVersion) {
            if (lastVersion !== "")
                arr.push(str.substr(0, str.length - 1));
            str = "";

            lastVersion = version;
            str += version + ":\n";
        }

        str += msg.substr(0, msg.length - 1);
    }
    arr.push(str.substr(0, str.length - 1))

    return arr;
}

async function changelog(msg, page = 1) {
    page = parseInt(page);
    let maxPage = Math.floor(logstrs.length / env.maxVersionsOnChangelogPage + 1);

    if (isNaN(page) || page < 1 || page > maxPage) {
        msg.channel.send(`${page} is not a valid page number. (Allowed range is 1-${maxPage})`);
        return false;
    }
    page--;

    msg.channel.send("```" + logstrs.slice(page * env.maxVersionsOnChangelogPage, Math.min(page + env.maxVersionsOnChangelogPage, logstrs.length)).join("\n\n") + "```");
    return true;
}

module.exports =
{
    name: "changelog",
    description: "get bot changelog",
    args: "<page>",
    minArgs: 0,
    maxArgs: 1,
    func: changelog,
}
