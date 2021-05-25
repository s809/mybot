async function deleteServer(msg) {
    await msg.guild.delete();
    return true;
}

module.exports =
{
    name: "delete",
    description: "delete test server",
    minArgs: 0,
    maxArgs: 0,
    func: deleteServer,
}
