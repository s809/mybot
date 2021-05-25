module.exports =
{
    name: "owner",
    subcommands: require("../requireHelper.js")("./commands/owner"),
    ownerOnly: true,
}