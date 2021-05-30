async function restart(msg) {
    require("child_process").execSync("git pull && npm i && ./mybot.sh");
    return true;
}

module.exports = {
    name: "restart",
    minArgs: 0,
    maxArgs: 0,
    func: restart,
}
