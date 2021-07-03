"use strict";

async function deleteServer(msg) {
    await msg.guild.delete();
    return true;
}

export const name = "delete";
export const description = "delete test server";
export const func = deleteServer;
