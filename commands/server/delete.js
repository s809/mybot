async function deleteServer(msg) {
    await msg.guild.delete();
}

export const name = "delete";
export const description = "delete test server";
export const func = deleteServer;
