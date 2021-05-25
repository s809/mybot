const child_process = require("child_process");

const logstr = prepareChangelog();

function prepareChangelog() {
    let commitCount = parseInt(child_process.execSync("git rev-list --count HEAD", { encoding: "utf8" }));
    
    let str = "";
    let lastVersion = "";
    for (let i = 0; i < commitCount; i++) {
        let version = child_process.execSync(`git grep --only-matching "\\"v.*\\"" HEAD~${i} -- main.js env.js`, { encoding: "utf8" })
            .split('"')[1]
            .substr(1);
        let msg = child_process.execSync(`git log -1 HEAD~${i} --format=%B`, { encoding: "utf8" });

        if (version !== lastVersion) {
            if (str.length > 0)
                str += "\n";
            lastVersion = version;
            str += version + ":\n";
        }

        str += msg.substr(0, msg.length - 1);
    }

    return str.substr(0, str.length - 1);
}

async function changelog(msg) {
    msg.channel.send("```" + logstr + "```");
    return true;
}

module.exports =
{
    name: "changelog",
    description: "get bot changelog",
    minArgs: 0,
    maxArgs: 0,
    func: changelog,
}
